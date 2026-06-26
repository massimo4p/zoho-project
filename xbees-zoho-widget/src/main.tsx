import Client from '@wildix/xbees-connect';

const BACKEND = import.meta.env.VITE_BACKEND_URL || '/api';

// ── DAEMON MODE ──────────────────────────────────────────────
// Questi handler girano SEMPRE, anche quando l'iframe è nascosto

// Rubrica Zoho in x-bees
Client.getInstance().onSuggestContacts(async (query, resolve, reject) => {
  try {
    const r = await fetch(`${BACKEND}/zoho/contacts/search?q=${encodeURIComponent(query)}`);
    resolve(await r.json());
  } catch (e) {
    reject(e);
  }
});

// Match numero chiamante → contatto Zoho
Client.getInstance().onLookupAndMatchContact(async ({ phone }, resolve, reject) => {
  try {
    const r = await fetch(`${BACKEND}/zoho/contacts/lookup?phone=${encodeURIComponent(phone)}`);
    const contact = await r.json();
    resolve(contact ?? null);
  } catch (e) {
    reject(e);
  }
});

// ── UI MODE ──────────────────────────────────────────────────
// Questo callback si attiva SOLO quando l'utente apre il pannello

Client.initialize(async () => {
  const { startUI } = await import('./startUI');
  startUI();
});
