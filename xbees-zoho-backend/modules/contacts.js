const express = require('express');
const router = express.Router();
const { getZohoToken } = require('../lib/zoho-auth');
const { contactUrl } = require('../lib/zoho-url');

const ZOHO_API = 'https://www.zohoapis.eu/crm/v8';

router.get('/lookup', async (req, res) => {
  try {
    const { phone } = req.query;
    const token = await getZohoToken();
    const headers = { Authorization: `Zoho-oauthtoken ${token}` };

    const [contactsRes, accountsRes, leadsRes] = await Promise.all([
      fetch(`${ZOHO_API}/Contacts/search?phone=${encodeURIComponent(phone)}`, { headers }),
      fetch(`${ZOHO_API}/Accounts/search?phone=${encodeURIComponent(phone)}`, { headers }),
      fetch(`${ZOHO_API}/Leads/search?phone=${encodeURIComponent(phone)}`, { headers }),
    ]);

    let contact = null;
    let account = null;
    let lead = null;

    if (contactsRes.status === 200) {
      const d = await contactsRes.json();
      const c = d?.data?.[0];
      if (c) contact = {
        id:           c.id,
        module:       'Contacts',
        name:         `${c.First_Name ?? ''} ${c.Last_Name ?? ''}`.trim(),
        organization: c.Account_Name?.name ?? '',
	accountId:    c.Account_Name?.id ?? null,
        phone:        c.Phone ?? phone,
        url:          contactUrl(c.id),
      };
    }

    if (accountsRes.status === 200) {
      const d = await accountsRes.json();
      const a = d?.data?.[0];
      if (a) account = {
        id:           a.id,
        module:       'Accounts',
        name:         a.Account_Name ?? '',
        organization: a.Account_Name ?? '',
	accountId:    a.id,
        phone:        a.Phone ?? phone,
        url:          `https://crm.zoho.eu/crm/org${process.env.ZOHO_ORG_ID}/tab/Accounts/${a.id}`,
      };
    }

    if (leadsRes.status === 200) {
      const d = await leadsRes.json();
      const l = d?.data?.[0];
      if (l) lead = {
        id:           l.id,
        module:       'Leads',
        name:         `${l.First_Name ?? ''} ${l.Last_Name ?? ''}`.trim(),
        organization: l.Company ?? '',
        phone:        l.Phone ?? phone,
        url:          `https://crm.zoho.eu/crm/org${process.env.ZOHO_ORG_ID}/tab/Leads/${l.id}`,
      };
    }

    // Priorità: Account > Contact con organizzazione > Contact senza organizzazione > Lead
    if (account) return res.json(account);
    if (contact?.organization) return res.json(contact);
    if (contact) return res.json(contact);
    if (lead) return res.json(lead);

    res.json(null);
  } catch (e) {
    console.error('[lookup] errore:', e.message);
    res.json(null);
  }
});

// --- Ricerca aziende per autocomplete (solo nome azienda) ---
router.get('/accounts/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const token = await getZohoToken();
    const criteria = encodeURIComponent(`(Account_Name:starts_with:${q})`);
    const r = await fetch(
      `${ZOHO_API}/Accounts/search?criteria=${criteria}&per_page=10`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    );
    if (r.status === 204) return res.json([]);
    const data = await r.json();
    const accounts = (data?.data ?? []).map(a => ({
      id:   a.id,
      name: a.Account_Name ?? '',
    }));
    res.json(accounts);
  } catch (e) {
    res.json([]);
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    const token = await getZohoToken();
    const r = await fetch(`${ZOHO_API}/Contacts/search?word=${encodeURIComponent(q)}&per_page=10`, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` }
    });
    const data = await r.json();
    const contacts = (data?.data ?? []).map(c => ({
      id:           c.id,
      name:         `${c.First_Name ?? ''} ${c.Last_Name ?? ''}`.trim(),
      organization: c.Account_Name?.name ?? '',
      phone:        c.Phone ?? c.Mobile ?? '',
      url:          contactUrl(c.id),
    }));
    res.json(contacts);
  } catch (e) {
    res.json([]);
  }
});

router.post('/create', async (req, res) => {
  try {
    const { type, firstName, lastName, phone, company, accountId, role, email } = req.body;
    const token = await getZohoToken();
    const headers = {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    };

    let url, payload;

    if (type === 'Leads') {
      url = `${ZOHO_API}/Leads`;
      payload = { data: [{
        First_Name: firstName || undefined,
        Last_Name:  lastName,
        Phone:      phone,
        Company:    company || 'Sconosciuta',
        Title:      role || undefined,
        Email:      email || undefined,
      }] };
    } else {
      url = `${ZOHO_API}/Contacts`;
      payload = { data: [{
        First_Name:   firstName || undefined,
        Last_Name:    lastName,
        Phone:        phone,
        Account_Name: accountId ? { id: accountId } : undefined,
        Title:        role || undefined,
        Email:        email || undefined,
      }] };
    }

    const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
    const data = await r.json();
    const id = data?.data?.[0]?.details?.id;
        if (id) {
          const tab = type === 'Leads' ? 'Leads' : 'Contacts';
          res.json({
          ok: true,
          id,
          type,
          url: `https://crm.zoho.eu/crm/org${process.env.ZOHO_ORG_ID}/tab/${tab}/${id}`,
       });
       } else {
         res.status(400).json({ ok: false, error: data });
       }
     } catch (e) {
       res.status(500).json({ ok: false, error: e.message });
    }

});

router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, phone, company } = req.body;
    const token = await getZohoToken();
    const r = await fetch(`${ZOHO_API}/Contacts`, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [{
          First_Name:   firstName,
          Last_Name:    lastName,
          Phone:        phone,
          Account_Name: company ? { name: company } : undefined,
        }]
      }),
    });
    const data = await r.json();
    res.json({ id: data?.data?.[0]?.details?.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Debug: cosa possiamo recuperare per un'azienda ---
router.get('/debug/company/:accountId', async (req, res) => {
  try {
    const token = await getZohoToken();
    const headers = { Authorization: `Zoho-oauthtoken ${token}` };
    const { accountId } = req.params;

    const safeJson = async (url) => {
      const r = await fetch(url, { headers });
      if (r.status === 204) return { _status: 204, data: [] };
      const text = await r.text();
      if (!text) return { _status: r.status, data: [] };
      try {
        return { _status: r.status, ...JSON.parse(text) };
      } catch (e) {
        return { _status: r.status, _raw: text.substring(0, 300) };
      }
    };

    const [account, contacts] = await Promise.all([
      safeJson(`${ZOHO_API}/Accounts/${accountId}`),
      safeJson(`${ZOHO_API}/Accounts/${accountId}/Contacts`),
    ]);

    res.json({
      accountStatus: account._status,
      account: account?.data?.[0] ?? null,
      contactsStatus: contacts._status,
      contacts: contacts?.data ?? [],
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Dati azienda per la scheda estesa ---
router.get('/company/:accountId', async (req, res) => {
  try {
    const token = await getZohoToken();
    const headers = { Authorization: `Zoho-oauthtoken ${token}` };
    const { accountId } = req.params;

    const r = await fetch(`${ZOHO_API}/Accounts/${accountId}`, { headers });
    if (r.status === 204) return res.json(null);
    const data = await r.json();
    const a = data?.data?.[0];
    if (!a) return res.json(null);

    res.json({
      id:        a.id,
      name:      a.Account_Name ?? '',
      email:     a.E_mail ?? null,
      phone:     a.Phone ?? a.Cellulare ?? null,
      website:   a.Website ?? null,
      vat:       a.Partita_IVA ?? null,
      stato:     a.Stato ?? null,
      pagamenti: a.In_regola_con_i_pagamenti ?? null,
      blocco:    a.Blocco_amministrativo ?? false,
      owner:     a.Owner?.name ?? null,
      scadenza:  a.Scadenza_Contratto ?? null,
      url:       `https://crm.zoho.eu/crm/org${process.env.ZOHO_ORG_ID}/tab/Accounts/${a.id}`,
    });
  } catch (e) {
    res.json(null);
  }
});

// --- Ricerca aziende per autocomplete ---
router.get('/accounts/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const token = await getZohoToken();
    const r = await fetch(
      `${ZOHO_API}/Accounts/search?word=${encodeURIComponent(q)}&per_page=10`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    );
    if (r.status === 204) return res.json([]);
    const data = await r.json();
    const accounts = (data?.data ?? []).map(a => ({
      id:   a.id,
      name: a.Account_Name ?? '',
    }));
    res.json(accounts);
  } catch (e) {
    res.json([]);
  }
});

module.exports = router;
