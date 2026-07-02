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
// Ogni record e' identificato dal call_id (data.id del webhook),
// cosi' possiamo aprire con call:live:progress e chiudere con
// call:live:completed anche se quest'ultimo non porta il numero.

async function upsertActiveCallById(callId, active, phone) {
  try {
    const filter = encodeURIComponent(`call_id='${callId}'`);
    const searchRes = await fetch(
      `${PB_URL}/api/collections/active_calls/records?filter=${filter}`
    );
    const searchData = await searchRes.json();
    const existing = searchData?.items?.[0];

    if (existing) {
      const body = { active };
      if (phone) body.phone = phone;
      await fetch(`${PB_URL}/api/collections/active_calls/records/${existing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else if (phone) {
      // Creiamo il record solo se abbiamo almeno il phone
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

function extractPhone(type, data) {
  if (type === 'call:start' || type === 'call:update' || type === 'call:end') {
    return data?.caller?.phone ?? null;
  }
  if (type === 'call:live:progress') {
    return data?.flows?.[0]?.caller?.phone ?? data?.flows?.[0]?.remotePhone ?? null;
  }
  return null;
}

function extractCallId(type, data) {
  // data.id e' comune a call:live:progress e call:live:completed
  if (data?.id) return data.id;
  if (type === 'call:start' || type === 'call:update' || type === 'call:end') {
    return data?.caller?.sipCallId ?? null;
  }
  return null;
}

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

  const phone = extractPhone(type, data);
  const callId = extractCallId(type, data);

  console.log(`[${new Date().toISOString()}] [webhook] type=${type} phone=${phone} callId=${callId}`);

  const isActiveEvent = type === 'call:start' || type === 'call:update' || type === 'call:live:progress';
  const isEndedEvent = type === 'call:end' || type === 'call:live:completed';

  if (isActiveEvent && callId) {
    console.log(`[${new Date().toISOString()}] [webhook] chiamata attiva callId=${callId} phone=${phone}`);
    await upsertActiveCallById(callId, true, phone);
  }

  if (isEndedEvent && callId) {
    console.log(`[${new Date().toISOString()}] [webhook] chiamata terminata callId=${callId}`);
    await upsertActiveCallById(callId, false, phone);
  }

  res.json({ ok: true });
});

app.get('/api/zoho/call-status', async (req, res) => {
  try {
    const { phone } = req.query;
    const filter = encodeURIComponent(`phone='${phone}' && active=true`);
    const r = await fetch(
      `${PB_URL}/api/collections/active_calls/records?filter=${filter}`
    );
    const data = await r.json();
    const record = data?.items?.[0];
    res.json({ active: !!record });
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
