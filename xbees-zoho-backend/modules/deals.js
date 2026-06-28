const express = require('express');
const router = express.Router();
const { getZohoToken } = require('../lib/zoho-auth');
const { dealUrl } = require('../lib/zoho-url');

const ZOHO_API = 'https://www.zohoapis.eu/crm/v8';

const mapDeal = d => ({
  id:          d.id,
  name:        d.Deal_Name,
  amount:      d.Amount,
  stage:       d.Stage,
  closingDate: d.Closing_Date,
  url:         dealUrl(d.id),
});

router.get('/contact/:contactId', async (req, res) => {
  try {
    const token = await getZohoToken();
    const r = await fetch(`${ZOHO_API}/Contacts/${req.params.contactId}/Deals`, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` }
    });
    const data = await r.json();
    res.json((data?.data ?? []).map(mapDeal));
  } catch (e) {
    res.json([]);
  }
});

router.get('/account/:accountId', async (req, res) => {
  try {
    const token = await getZohoToken();
    const r = await fetch(`${ZOHO_API}/Accounts/${req.params.accountId}/Deals`, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` }
    });
    const data = await r.json();
    res.json((data?.data ?? []).map(mapDeal));
  } catch (e) {
    res.json([]);
  }
});

router.patch('/:dealId', async (req, res) => {
  try {
    const { stage } = req.body;
    const token = await getZohoToken();
    const r = await fetch(`${ZOHO_API}/Deals/${req.params.dealId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: [{ Stage: stage }] }),
    });
    res.json(await r.json());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
