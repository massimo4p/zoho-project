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

// --- SSE: client widget connessi ---

let sseClients = [];

function broadcastActivePhone(phone) {
  const payload = `data: ${JSON.stringify({ phone: phone ?? null })}\n\n`;
  sseClients.forEach((client) => {
    try { client.write(payload); } catch (e) { /* ignore */ }
  });
}

app.get('/api/zoho/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.flushHeaders();

  // invia subito lo stato corrente
  getActivePhone().then((phone) => {
    res.write(`data: ${JSON.stringify({ phone })}\n\n`);
  });

  sseClients.push(res);

  // keep-alive ping ogni 25s per non far cadere la connessione
  const ping = setInterval(() => {
    try { res.write(': ping\n\n'); } catch (e) { /* ignore */ }
  }, 25000);

  req.on('close', () => {
    clearInterval(ping);
    sseClients = sseClients.filter((c) => c !== res);
  });
});

// --- PocketBase: tracciamento chiamate attive (per call_id) ---

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

async function getActivePhone() {
  try {
    const r = await fetch(
      `${PB_URL}/api/collections/active_calls/records?filter=(active=true)&sort=-updated&perPage=1`
    );
    const data = await r.json();
    return data?.items?.[0]?.phone ?? null;
  } catch (e) {
    return null;
  }
}

function extractPhone(type, data) {
  if (type === 'call:start' || type === 'call:update' || type === 'call:end') {
    // Ignora chiamate interne: il chiamante deve essere remoto
    if (data?.caller?.type && data.caller.type.toLowerCase() !== 'remote') return null;
    return data?.caller?.phone ?? null;
  }
  if (type === 'call:live:progress') {
    const flow = data?.flows?.[0];
    if (flow?.caller?.type && flow.caller.type.toUpperCase() !== 'REMOTE') return null;
    return flow?.caller?.phone ?? flow?.remotePhone ?? null;
  }
  return null;
}

function extractCallId(type, data) {
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
  const phone = extractPhone(type, data);
  const callId = extractCallId(type, data);

  console.log(`[${new Date().toISOString()}] [webhook] type=${type} phone=${phone} callId=${callId}`);

  const isActiveEvent = type === 'call:start' || type === 'call:update' || type === 'call:live:progress';
  const isEndedEvent = type === 'call:end' || type === 'call:live:completed';

  if (isActiveEvent && callId) {
    await upsertActiveCallById(callId, true, phone);
  }

  if (isEndedEvent && callId) {
    await upsertActiveCallById(callId, false, phone);
  }

  // Dopo ogni aggiornamento, notifica i widget con lo stato corrente
  if (callId) {
    const activePhone = await getActivePhone();
    console.log(`[${new Date().toISOString()}] [sse] broadcast phone=${activePhone}`);
    broadcastActivePhone(activePhone);
  }

  res.json({ ok: true });
});

app.get('/api/zoho/active-call', async (req, res) => {
  const phone = await getActivePhone();
  res.json({ phone });
});

// --- Route Zoho esistenti ---

app.use('/api/zoho/contacts', require('./modules/contacts'));
app.use('/api/zoho/deals', require('./modules/deals'));
app.use('/api/zoho/activities', require('./modules/activities'));
app.use('/api/zoho/desk', require('./modules/desk'));

app.listen(PORT, () => {
  console.log(`xbees-zoho-backend in ascolto sulla porta ${PORT}`);
});
