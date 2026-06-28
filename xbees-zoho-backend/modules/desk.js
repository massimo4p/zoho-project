const express = require('express');
const router = express.Router();
const { getZohoToken } = require('../lib/zoho-auth');

const ZOHO_API = 'https://www.zohoapis.eu/crm/v8';

const fetchTickets = async (module, id, token) => {
  const r = await fetch(`${ZOHO_API}/${module}/${id}/Zoho_Support`, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` }
  });
  const data = await r.json();
  return (data?.data ?? []).map(t => ({
    id:          t.id,
    subject:     t.subject,
    status:      t.status,
    priority:    t.priority,
    createdTime: t.createdTime,
    channel:     t.channel,
  }));
};

router.get('/:module/:id', async (req, res) => {
  try {
    const { module, id } = req.params;
    const token = await getZohoToken();

    let tickets = [];

    if (module === 'Accounts') {
      // Cerca i Contacts collegati all'Account
      const cr = await fetch(`${ZOHO_API}/Accounts/${id}/Contacts?fields=id`, {
        headers: { Authorization: `Zoho-oauthtoken ${token}` }
      });
      const contacts = await cr.json();
      
      // Per ogni Contact cerca i ticket
      const results = await Promise.all(
        (contacts?.data ?? []).map(c => fetchTickets('Contacts', c.id, token))
      );
      tickets = results.flat();
    } else {
      tickets = await fetchTickets(module, id, token);
    }

    res.json(tickets);
  } catch (e) {
    res.json([]);
  }
});

module.exports = router;
