const express = require('express');
const router = express.Router();
const { getZohoToken } = require('../lib/zoho-auth');

const ZOHO_API = 'https://www.zohoapis.eu/crm/v8';
const DESK_API = 'https://desk.zoho.eu/api/v1';
const DESK_DEPT = '119589000000007061';

async function fetchSupport(module, id, token) {
  const r = await fetch(`${ZOHO_API}/${module}/${id}/Zoho_Support`, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` }
  });
  const data = await r.json();
  const tickets = (data?.data ?? []).map(t => ({
    id:          t.id,
    subject:     t.subject,
    status:      t.status,
    priority:    t.priority,
    createdTime: t.createdTime,
    channel:     t.channel,
  }));
  const deskAccountId = data?.ticket_stats?.accountId ?? null;
  return { tickets, deskAccountId };
}

router.get('/:module/:id', async (req, res) => {
  try {
    const { module, id } = req.params;
    const token = await getZohoToken();

    let tickets = [];
    let deskAccountId = null;

    if (module === 'Accounts') {
      const cr = await fetch(`${ZOHO_API}/Accounts/${id}/Contacts?fields=id`, {
        headers: { Authorization: `Zoho-oauthtoken ${token}` }
      });
      const contacts = await cr.json();
      const results = await Promise.all(
        (contacts?.data ?? []).map(c => fetchSupport('Contacts', c.id, token))
      );
      results.forEach(r => {
        tickets.push(...r.tickets);
        if (!deskAccountId && r.deskAccountId) deskAccountId = r.deskAccountId;
      });
    } else {
      const r = await fetchSupport(module, id, token);
      tickets = r.tickets;
      deskAccountId = r.deskAccountId;
    }

    res.json({ tickets, deskAccountId });
  } catch (e) {
    res.json({ tickets: [], deskAccountId: null });
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
