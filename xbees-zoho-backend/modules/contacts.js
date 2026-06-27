const express = require('express');
const router = express.Router();
const { getZohoToken } = require('../lib/zoho-auth');
const { contactUrl } = require('../lib/zoho-url');

const ZOHO_API = 'https://www.zohoapis.eu/crm/v8';

// Lookup per numero di telefono — usato dal daemon onLookupAndMatchContact
router.get('/lookup', async (req, res) => {
  try {
    const { phone } = req.query;
    const token = await getZohoToken();
    const headers = { Authorization: `Zoho-oauthtoken ${token}` };

    // Cerca in parallelo su tutti i moduli
    const [contactsRes, accountsRes, leadsRes] = await Promise.all([
      fetch(`${ZOHO_API}/Contacts/search?phone=${encodeURIComponent(phone)}`, { headers }),
      fetch(`${ZOHO_API}/Accounts/search?phone=${encodeURIComponent(phone)}`, { headers }),
      fetch(`${ZOHO_API}/Leads/search?phone=${encodeURIComponent(phone)}`, { headers }),
    ]);

    // Contacts
    if (contactsRes.status === 200) {
      const d = await contactsRes.json();
      const c = d?.data?.[0];
      if (c) return res.json({
        name:    `${c.First_Name ?? ''} ${c.Last_Name ?? ''}`.trim(),
        company: c.Account_Name?.name ?? '',
        phone:   c.Phone ?? phone,
        url:     contactUrl(c.id),
      });
    }

    // Accounts
    if (accountsRes.status === 200) {
      const d = await accountsRes.json();
      const a = d?.data?.[0];
      if (a) return res.json({
        name:    a.Account_Name ?? '',
        company: a.Account_Name ?? '',
        phone:   a.Phone ?? phone,
        url:     `https://crm.zoho.eu/crm/org${process.env.ZOHO_ORG_ID}/tab/Accounts/${a.id}`,
      });
    }

    // Leads
    if (leadsRes.status === 200) {
      const d = await leadsRes.json();
      const l = d?.data?.[0];
      if (l) return res.json({
        name:    `${l.First_Name ?? ''} ${l.Last_Name ?? ''}`.trim(),
        company: l.Company ?? '',
        phone:   l.Phone ?? phone,
        url:     `https://crm.zoho.eu/crm/org${process.env.ZOHO_ORG_ID}/tab/Leads/${l.id}`,
      });
    }

    res.json(null);
  } catch (e) {
    console.error('[lookup] errore:', e.message);
    res.json(null);
  }
});
// Ricerca full-text — usata dal daemon onSuggestContacts
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    const token = await getZohoToken();

    const r = await fetch(`${ZOHO_API}/Contacts/search?word=${encodeURIComponent(q)}&per_page=10`, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` }
    });
    const data = await r.json();

    // sempre un array, anche in caso di errore Zoho
    const contacts = (data?.data ?? []).map(c => ({
      name:    `${c.First_Name ?? ''} ${c.Last_Name ?? ''}`.trim(),
      company: c.Account_Name?.name ?? '',
      phone:   c.Phone ?? c.Mobile ?? '',
      url:     contactUrl(c.id),
    }));

    res.json(contacts);
  } catch (e) {
    res.json([]); // mai un errore, sempre array vuoto
  }
});
// Crea nuovo contatto
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

module.exports = router;
