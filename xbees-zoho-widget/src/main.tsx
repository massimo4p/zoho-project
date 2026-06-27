import Client from '@wildix/xbees-connect';

const BACKEND = (import.meta as any).env?.VITE_BACKEND_URL ?? '';
const client = Client.getInstance();

client.ready();
client.isAuthorized();

client.onSuggestContacts(async (query: string, resolve: any, reject: any) => {
  try {
    const r = await fetch(`${BACKEND}/api/zoho/contacts/search?q=${encodeURIComponent(query)}`);
    resolve(await r.json());
  } catch (e) {
    reject(e);
  }
});

client.onLookupAndMatchContact(async (payload: any, resolve: any, reject: any) => {
  console.log('[lookup] payload:', JSON.stringify(payload), typeof payload);
  const phone = typeof payload === 'string' ? payload : payload?.phone;
  console.log('[lookup] phone estratto:', phone);
  console.log('[lookup] BACKEND:', BACKEND);
  if (!phone) { resolve(null); return; }
  try {
    const url = `${BACKEND}/api/zoho/contacts/lookup?phone=${encodeURIComponent(phone)}`;
    console.log('[lookup] chiamata:', url);
    const r = await fetch(url);
    const data = await r.json();
    console.log('[lookup] risposta:', JSON.stringify(data));
    resolve(data ?? null);
  } catch (e: any) {
    console.log('[lookup] errore:', e.message);
    reject(e);
  }
});

Client.initialize(async () => {
  const { startUI } = await import('./startUI');
  startUI();
});
