import Client from '@wildix/xbees-connect';
import { log } from './logger';

const BACKEND = (import.meta as any).env?.VITE_BACKEND_URL ?? '';
const client = Client.getInstance();

log.info('daemon init', { backend: BACKEND });
log.info('VARIANT', new URLSearchParams(location.search).get('v'));

client.ready();
client.isAuthorized();

client.onSuggestContacts(async (query: string, resolve: any, reject: any) => {
  log.debug('onSuggestContacts', { query });
  try {
    const r = await fetch(`${BACKEND}/api/zoho/contacts/search?q=${encodeURIComponent(query)}`);
    const data = await r.json();
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
    const data = await r.json();
    log.debug('lookup result', data);
    if (!data) { resolve(null); return; }

    // oggetto conforme a ContactShape dell'SDK: solo i campi previsti
    const contact = {
      id: data.id,
      name: data.name,
      phone: data.phone,
      organization: data.organization || undefined,
    };
    log.debug('resolve contact', contact);
    resolve(contact);
  } catch (e: any) {
    log.error('onLookupAndMatchContact failed', e.message);
    reject(e);
  }
});

log.info('booting UI');
import('./startUI')
  .then(({ startUI }) => {
    log.info('startUI imported, mounting');
    startUI();
    log.info('startUI done');
  })
  .catch((e) => log.error('startUI import/mount failed', e?.message ?? e));
