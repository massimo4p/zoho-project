const express = require('express');
const router = express.Router();
const { getZohoToken } = require('../lib/zoho-auth');
const { contactUrl } = require('../lib/zoho-url');

const ZOHO_API = 'https://www.zohoapis.eu/crm/v7';

// Lookup per numero di telefono — usato dal daemon onLookupAndMatchContact
router.get('/lookup', async (req, res) => {
  try {
    const { phone } = req.query;
    const token = await getZohoToken();

    const url = `${ZOHO_API}/Contacts/search?phone=${encodeURIComponent(phone)}`;
    console.log('[lookup] phone ricevuto:', phone);
    console.log('[lookup] url:', url);
    console.log('[lookup] chiamata:', url);

    const r = await fetch(url, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` }
    });
    const data = await r.json();
    console.log('[lookup] risposta Zoho:', JSON.stringify(data));

    const c = data?.data?.[0];
    if (!c) return res.json(null);

    res.json({
      name:    `${c.First_Name ?? ''} ${c.Last_Name ?? ''}`.trim(),
      company: c.Account_Name?.name ?? '',
      phone:   c.Phone ?? phone,
      url:     contactUrl(c.id),
    });
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
