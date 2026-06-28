const KEY = 'ZOHO_DEBUG';

const isDebug = () =>
  typeof window !== 'undefined' &&
  (window.localStorage.getItem(KEY) === 'true' ||
   new URLSearchParams(window.location.search).get('debug') === 'zoho');

const fmt = (level: string, msg: string) =>
  `[zoho:${level}] ${new Date().toISOString().slice(11,23)} ${msg}`;

export const log = {
  debug: (msg: string, data?: unknown) => {
    if (!isDebug()) return;
    data !== undefined
      ? console.debug(fmt('DBG', msg), data)
      : console.debug(fmt('DBG', msg));
  },
  info: (msg: string, data?: unknown) => {
    data !== undefined
      ? console.info(fmt('INF', msg), data)
      : console.info(fmt('INF', msg));
  },
  warn: (msg: string, data?: unknown) => {
    data !== undefined
      ? console.warn(fmt('WRN', msg), data)
      : console.warn(fmt('WRN', msg));
  },
  error: (msg: string, data?: unknown) => {
    data !== undefined
      ? console.error(fmt('ERR', msg), data)
      : console.error(fmt('ERR', msg));
  },
};

// Attiva debug dalla console browser con: window.__zohoDebug(true)
if (typeof window !== 'undefined') {
  (window as any).__zohoDebug = (on: boolean) => {
    window.localStorage.setItem(KEY, String(on));
    console.info(`[zoho] debug ${on ? 'ATTIVATO' : 'DISATTIVATO'} — ricarica la pagina`);
  };
}
