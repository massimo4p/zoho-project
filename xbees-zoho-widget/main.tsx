import Client from '@wildix/xbees-connect';

const BACKEND = (import.meta as any).env?.VITE_BACKEND_URL ?? '';

Client.getInstance().ready();
Client.getInstance().isAuthorized();

Client.getInstance().onSuggestContacts(async (query: string, resolve: any, reject: any) => {
  try {
    const r = await fetch(`${BACKEND}/api/zoho/contacts/search?q=${encodeURIComponent(query)}`);
    resolve(await r.json());
  } catch (e) {
    reject(e);
  }
});

Client.getInstance().onLookupAndMatchContact(async ({ phone }: { phone: string }, resolve: any, reject: any) => {
  try {
    const r = await fetch(`${BACKEND}/api/zoho/contacts/lookup?phone=${encodeURIComponent(phone)}`);
    const contact = await r.json();
    resolve(contact ?? null);
  } catch (e) {
    reject(e);
  }
});

Client.initialize(async () => {
  const { startUI } = await import('./startUI');
  startUI();
});
