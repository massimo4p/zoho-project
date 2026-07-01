require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.WIDGET_ORIGIN || '*' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'xbees-zoho-backend' });
});

app.get('/api/zoho/test', async (req, res) => {
  try {
    const { getZohoToken } = require('./lib/zoho-auth');
    const token = await getZohoToken();
    res.json({ ok: true, token: token.substring(0, 20) + '...' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message, stack: e.stack });
  }
});
const crypto = require('crypto');

app.post('/api/webhook/call', (req, res) => {
  const secret = process.env.WILDIX_WEBHOOK_SECRET;
  const signature = req.headers['x-signature'];
  
  if (secret && signature) {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    if (signature !== expected) {
      console.log('[webhook] firma non valida');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  const { type, data } = req.body;
  console.log('[webhook]', type, JSON.stringify(data));

  res.json({ ok: true });
});

app.use('/api/zoho/contacts',   require('./modules/contacts'));
app.use('/api/zoho/deals',      require('./modules/deals'));
app.use('/api/zoho/activities', require('./modules/activities'));
app.use('/api/zoho/desk',       require('./modules/desk'));

app.listen(PORT, () => {
  console.log(`xbees-zoho-backend in ascolto sulla porta ${PORT}`);
});
