import Client from '@wildix/xbees-connect';

const BACKEND = (import.meta as any).env?.VITE_BACKEND_URL ?? '/api';

// ── DAEMON MODE ──────────────────────────────────────────────

Client.getInstance().onSuggestContacts(async (query: string, resolve: (contacts: unknown) => void, reject: (err: unknown) => void) => {
  try {
    const r = await fetch(`${BACKEND}/zoho/contacts/search?q=${encodeURIComponent(query)}`);
    resolve(await r.json());
  } catch (e) {
    reject(e);
  }
});

Client.getInstance().onLookupAndMatchContact(async ({ phone }: { phone: string }, resolve: (contact: unknown) => void, reject: (err: unknown) => void) => {
  try {
    const r = await fetch(`${BACKEND}/zoho/contacts/lookup?phone=${encodeURIComponent(phone)}`);
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
