kimport Client from '@wildix/xbees-connect';

const BACKEND = (import.meta as any).env?.VITE_BACKEND_URL ?? '';
const client = Client.getInstance();

// Handshake immediato
client.ready();

// Controlla se già autorizzato in sessione precedente
const wasAuthorized = client.getFromStorage('authorized');
if (wasAuthorized) {
  client.isAuthorized();
} else {
  // Prima volta — autorizza e salva
  client.isAuthorized();
  client.saveToStorage('authorized', 'true');
}

// ── DAEMON MODE ──────────────────────────────────────────────
client.onSuggestContacts(async (query: string, resolve: any, reject: any) => {
  try {
    const r = await fetch(`${BACKEND}/api/zoho/contacts/search?q=${encodeURIComponent(query)}`);
    resolve(await r.json());
  } catch (e) {
    reject(e);
  }
});

client.onLookupAndMatchContact(async (payload: any, resolve: any, reject: any) => {
  console.log('[zoho lookup] payload:', JSON.stringify(payload));
  const phone = payload?.phone ?? payload?.query?.phone ?? payload?.number;
  if (!phone) {
    resolve(null);
    return;
  }
  try {
    const r = await fetch(`${BACKEND}/api/zoho/contacts/lookup?phone=${encodeURIComponent(phone)}`);
    const contact = await r.json();
    resolve(contact ?? null);
  } catch (e) {
    reject(e);
  }
});
// ── UI MODE ──────────────────────────────────────────────────
Client.initialize(async () => {
  const { startUI } = await import('./startUI');
  startUI();
});
