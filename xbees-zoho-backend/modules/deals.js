const express = require('express');
const router = express.Router();
const { getZohoToken } = require('../lib/zoho-auth');
const { dealUrl } = require('../lib/zoho-url');

const ZOHO_API = 'https://www.zohoapis.eu/crm/v7';

// Deal collegati a un contatto
router.get('/contact/:contactId', async (req, res) => {
  try {
    const token = await getZohoToken();
    const r = await fetch(`${ZOHO_API}/Contacts/${req.params.contactId}/Deals`, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` }
    });
    const data = await r.json();

    const deals = (data?.data ?? []).map(d => ({
      id:          d.id,
      name:        d.Deal_Name,
      amount:      d.Amount,
      stage:       d.Stage,
      closingDate: d.Closing_Date,
      url:         dealUrl(d.id),
    }));

    res.json(deals);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Aggiorna stage di un deal
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
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
