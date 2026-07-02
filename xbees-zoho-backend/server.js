require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const PB_URL = process.env.POCKETBASE_URL || 'http://pocketbase.local';

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

// --- PocketBase: tracciamento chiamate attive ---

async function upsertActiveCall(phone, active, callId) {
  try {
    const filter = encodeURIComponent(`phone='${phone}'`);
    const searchRes = await fetch(
      `${PB_URL}/api/collections/active_calls/records?filter=${filter}`
    );
    const searchData = await searchRes.json();
    const existing = searchData?.items?.[0];

    if (existing) {
      await fetch(`${PB_URL}/api/collections/active_calls/records/${existing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active, call_id: callId }),
      });
    } else {
      await fetch(`${PB_URL}/api/collections/active_calls/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, active, call_id: callId }),
      });
    }
  } catch (e) {
    console.error('[pocketbase] errore:', e.message);
  }
}

// --- Debug: ultimo body webhook grezzo ricevuto ---

let lastWebhookBody = null;

app.get('/api/debug/last-webhook', (req, res) => {
  res.json(lastWebhookBody);
});

app.post('/api/webhook/call', async (req, res) => {
  const secret = process.env.WILDIX_WEBHOOK_SECRET;
  const signature = req.headers['x-signature'];

  if (secret && signature) {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    if (signature !== expected) {
      console.log(`[${new Date().toISOString()}] [webhook] firma non valida`);
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  const { type, data } = req.body;
  lastWebhookBody = req.body;

  console.log(`[${new Date().toISOString()}] [webhook] type=${type} phone=${data?.caller?.phone} sipCallId=${data?.caller?.sipCallId} status=${data?.status}`);

  if (type === 'call:start' || type === 'call:update') {
    const phone = data?.caller?.phone;
    const callId = data?.caller?.sipCallId;
    if (phone) {
      console.log(`[${new Date().toISOString()}] [webhook] chiamata attiva: ${phone}`);
      await upsertActiveCall(phone, true, callId);
    }
  }

  if (type === 'call:end') {
    const phone = data?.caller?.phone;
    if (phone) {
      console.log(`[${new Date().toISOString()}] [webhook] chiamata terminata: ${phone}`);
      await upsertActiveCall(phone, false, null);
    }
  }

  res.json({ ok: true });
});

app.get('/api/zoho/call-status', async (req, res) => {
  try {
    const { phone } = req.query;
    const filter = encodeURIComponent(`phone='${phone}'`);
    const r = await fetch(
      `${PB_URL}/api/collections/active_calls/records?filter=${filter}`
    );
    const data = await r.json();
    const record = data?.items?.[0];
    res.json({ active: record?.active ?? false });
  } catch (e) {
    res.json({ active: false });
  }
});

app.get('/api/zoho/active-call', async (req, res) => {
  try {
    const r = await fetch(
      `${PB_URL}/api/collections/active_calls/records?filter=(active=true)&sort=-updated&perPage=1`
    );
    const data = await r.json();
    const record = data?.items?.[0];
    res.json({ phone: record?.phone ?? null });
  } catch (e) {
    res.json({ phone: null });
  }
});

// --- Route Zoho esistenti ---

app.use('/api/zoho/contacts', require('./modules/contacts'));
app.use('/api/zoho/deals', require('./modules/deals'));
app.use('/api/zoho/activities', require('./modules/activities'));
app.use('/api/zoho/desk', require('./modules/desk'));

app.listen(PORT, () => {
  console.log(`xbees-zoho-backend in ascolto sulla porta ${PORT}`);
});
