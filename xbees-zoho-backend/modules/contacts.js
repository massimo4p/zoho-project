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

    const [accRes, contRes] = await Promise.all([
      fetch(`${ZOHO_API}/Accounts/${accountId}`, { headers }),
      fetch(`${ZOHO_API}/Accounts/${accountId}/Contacts`, { headers }),
    ]);

    const account = await accRes.json();
    const contacts = await contRes.json();

    res.json({
      account: account?.data?.[0] ?? null,
      contacts: contacts?.data ?? [],
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
