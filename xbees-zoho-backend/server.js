require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.WIDGET_ORIGIN || '*' }));
app.use(express.json());

// healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'xbees-zoho-backend' });
});

// moduli (verranno aggiunti progressivamente)
// app.use('/api/zoho/contacts', require('./modules/contacts'));
app.use('/api/zoho/contacts', require('./modules/contacts'));

// app.use('/api/zoho/deals',    require('./modules/deals'));
// app.use('/api/zoho/activities', require('./modules/activities'));
// app.use('/api/zoho/leads',    require('./modules/leads'));
// app.use('/zoho/webhook',      require('./modules/webhook-rx'));

// test token Zoho
app.get('/api/zoho/test', async (req, res) => {
  try {
    const { getZohoToken } = require('./lib/zoho-auth');
    const token = await getZohoToken();
    res.json({ ok: true, token: token.substring(0, 20) + '...' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message, stack: e.stack });
  }
});

app.listen(PORT, () => {
  console.log(`xbees-zoho-backend in ascolto sulla porta ${PORT}`);
});
