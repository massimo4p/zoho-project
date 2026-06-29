const express = require('express');
const router = express.Router();
const { getZohoToken } = require('../lib/zoho-auth');

const ZOHO_API = 'https://www.zohoapis.eu/crm/v8';
const DESK_API = 'https://desk.zoho.eu/api/v1';
const DESK_DEPT = '119589000000007061';

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
      const cr = await fetch(`${ZOHO_API}/Accounts/${id}/Contacts?fields=id`, {
        headers: { Authorization: `Zoho-oauthtoken ${token}` }
      });
      const contacts = await cr.json();
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

router.post('/create', async (req, res) => {
  try {
    const { subject, description, contactName, contactPhone } = req.body;
    const token = await getZohoToken();
    const r = await fetch(`${DESK_API}/tickets`, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: subject || 'Nuovo ticket',
        departmentId: DESK_DEPT,
        description: description || '',
        channel: 'Phone',
        contact: {
          lastName: contactName || 'Sconosciuto',
          phone: contactPhone || '',
        },
      }),
    });
    const data = await r.json();
    if (data.id) {
      res.json({ ok: true, id: data.id });
    } else {
      res.status(400).json({ ok: false, error: data });
    }
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
