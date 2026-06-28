const express = require('express');
const router = express.Router();
const { getZohoToken } = require('../lib/zoho-auth');

const ZOHO_API = 'https://www.zohoapis.eu/crm/v8';

router.get('/:module/:id', async (req, res) => {
  try {
    const { module, id } = req.params;
    const token = await getZohoToken();
    const r = await fetch(
      `${ZOHO_API}/${module}/${id}/Cases?fields=Subject,Status,Priority,Created_Time`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    );
    const data = await r.json();
    const cases = (data?.data ?? []).map(c => ({
      id:          c.id,
      subject:     c.Subject,
      status:      c.Status,
      priority:    c.Priority,
      createdTime: c.Created_Time,
    }));
    res.json(cases);
  } catch (e) {
    res.json([]);
  }
});

module.exports = router;
