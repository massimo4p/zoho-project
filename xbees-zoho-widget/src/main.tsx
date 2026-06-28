import Client from '@wildix/xbees-connect';
import { log } from './logger';

const BACKEND = (import.meta as any).env?.VITE_BACKEND_URL ?? '';
const client = Client.getInstance();

log.info('daemon init', { backend: BACKEND });

client.ready();
client.isAuthorized();

client.onSuggestContacts(async (query: string, resolve: any, reject: any) => {
  log.debug('onSuggestContacts', { query });
  try {
    const r = await fetch(`${BACKEND}/api/zoho/contacts/search?q=${encodeURIComponent(query)}`);
    const data = await r.json();
    log.debug('onSuggestContacts result', { count: data.length });
    resolve(data);
  } catch (e: any) {
    log.error('onSuggestContacts failed', e.message);
    reject(e);
  }
});

client.onLookupAndMatchContact(async (payload: any, resolve: any, reject: any) => {
  const phone = typeof payload === 'string' ? payload : payload?.phone;
  log.debug('onLookupAndMatchContact', { phone });
  if (!phone) { resolve(null); return; }
  try {
    const r = await fetch(`${BACKEND}/api/zoho/contacts/lookup?phone=${encodeURIComponent(phone)}`);
    const contact = await r.json();
    log.debug('onLookupAndMatchContact result', contact);
    // Salva sempre il phone in storage per l'UI mode
    if (contact) client.saveToStorage('lastCallPhone', phone);
    resolve(contact);
    if (contact) client.contactMatchUpdated(payload, contact);
  } catch (e: any) {
    log.error('onLookupAndMatchContact failed', e.message);
    reject(e);
  }
});

client.onDaemonCallStarted((payload: any) => {
  log.info('onDaemonCallStarted', payload);
  const phone = payload?.phone ?? payload?.remotePhone ?? payload?.callerPhone;
  if (phone) {
    log.debug('salvo phone in storage', { phone });
    client.saveToStorage('lastCallPhone', phone);
  }
});

client.onDaemonCallFinished((payload: any) => {
  log.info('onDaemonCallFinished', payload);
  client.deleteFromStorage('lastCallPhone');
});

Client.initialize(async () => {
  log.info('UI mode init');
  const { startUI } = await import('./startUI');
  startUI();
});
