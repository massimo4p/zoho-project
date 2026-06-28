const express = require('express');
const router = express.Router();
const { getZohoToken } = require('../lib/zoho-auth');

const ZOHO_API = 'https://www.zohoapis.eu/crm/v8';
const FIELDS = 'Subject,Call_Start_Time,Call_Duration,Description';

router.get('/:module/:id', async (req, res) => {
  try {
    const { module, id } = req.params;
    const token = await getZohoToken();
    const r = await fetch(
      `${ZOHO_API}/${module}/${id}/Activities_Chronological_View_History?fields=${FIELDS}`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    );
    const data = await r.json();
    const calls = (data?.data ?? [])
      .filter(a => a.$module === 'Calls')
      .map(c => ({
        id:        c.id,
        subject:   c.Subject,
        startTime: c.Call_Start_Time,
        duration:  c.Call_Duration,
        note:      c.Description,
      }));
    res.json(calls);
  } catch (e) {
    res.json([]);
  }
});

module.exports = router;
