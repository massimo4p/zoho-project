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
  const phone = typeof payload === 'string' ? payload : payload?.phone;
  if (!phone) { resolve(null); return; }
  try {
    const r = await fetch(`${BACKEND}/api/zoho/contacts/lookup?phone=${encodeURIComponent(phone)}`);
    const contact = await r.json();
    resolve(contact);
    if (contact) client.contactMatchUpdated(payload, contact);
  } catch (e: any) {
    reject(e);
  }
});

client.onDaemonCallStarted((payload: any) => {
  console.log('[zoho] onDaemonCallStarted:', JSON.stringify(payload));
  const phone = payload?.phone ?? payload?.remotePhone ?? payload?.callerPhone;
  if (phone) {
    console.log('[zoho] salvo phone in storage:', phone);
    client.saveToStorage('lastCallPhone', phone);
  }
});

client.onDaemonCallFinished(() => {
  client.deleteFromStorage('lastCallPhone');
});

Client.initialize(async () => {
  const { startUI } = await import('./startUI');
  startUI();
});
