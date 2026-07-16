import React, { useEffect, useRef, useState } from 'react';
import Client from '@wildix/xbees-connect';
import { log } from './logger';

const BACKEND = (import.meta as any).env?.VITE_BACKEND_URL ?? '';
const VIEW = new URLSearchParams(window.location.search).get('v');
const IS_PREVIEW = VIEW === 'ui';

const DESK_BASE = 'https://desk.zoho.eu/agent/4personality';
const MAX_ITEMS = 10;
const RETRY_MS = 2000;
const RETRY_MAX = 6;

interface Contact {
  id?: string;
  module?: string;
  name: string;
  organization: string;
  accountId?: string | null;
  phone: string;
  url: string;
}

interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  vat: string | null;
  stato: string | null;
  pagamenti: string | null;
  blocco: boolean;
  owner: string | null;
  scadenza: string | null;
  url: string;
}

interface Call {
  id: string;
  subject: string;
  startTime: string;
  duration: string;
  note?: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority?: string;
  createdTime: string;
  channel?: string;
}

interface AccountOption { id: string; name: string; }

type Tab = 'summary' | 'calls' | 'desk';

const s: Record<string, React.CSSProperties> = {
  wrap:       { fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', fontSize: 13, color: '#1a1a1a', height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' },
  header:     { padding: '12px 14px 0', borderBottom: '1px solid #eee' },
  avatar:     { width: 38, height: 38, borderRadius: '50%', background: '#534AB7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, flexShrink: 0 },
  name:       { fontWeight: 600, fontSize: 14 },
  sub:        { fontSize: 11, color: '#888', marginTop: 2 },
  tabs:       { display: 'flex', borderBottom: '1px solid #eee', marginTop: 10 },
  tab:        { padding: '7px 12px', fontSize: 12, cursor: 'pointer', borderBottom: '2px solid transparent', color: '#888', marginBottom: -1 },
  tabActive:  { padding: '7px 12px', fontSize: 12, cursor: 'pointer', borderBottom: '2px solid #534AB7', color: '#534AB7', fontWeight: 500, marginBottom: -1 },
  body:       { padding: '12px 14px', flex: 1, overflowY: 'auto' as const },
  section:    { marginTop: 16 },
  secTitle:   { fontSize: 11, fontWeight: 600, color: '#999', letterSpacing: 0.5, textTransform: 'uppercase' as const, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  secLink:    { fontSize: 11, color: '#534AB7', textDecoration: 'none', textTransform: 'none' as const, letterSpacing: 0, fontWeight: 400 },
  row:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f4f4f4' },
  label:      { color: '#999', fontSize: 12 },
  val:        { fontSize: 12, textAlign: 'right' as const, maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  dot:        { display: 'inline-block', width: 7, height: 7, borderRadius: '50%', marginRight: 6 },
  card:       { border: '1px solid #eee', borderRadius: 8, padding: '10px 12px', marginBottom: 8 },
  cardLink:   { border: '1px solid #eee', borderRadius: 8, padding: '10px 12px', marginBottom: 8, cursor: 'pointer', textDecoration: 'none', display: 'block', color: 'inherit' },
  cardTitle:  { fontWeight: 500, fontSize: 13 },
  cardMeta:   { fontSize: 11, color: '#aaa', marginTop: 4 },
  badge:      { fontSize: 11, padding: '2px 7px', borderRadius: 20, display: 'inline-block', marginTop: 4 },
  empty:      { color: '#aaa', textAlign: 'center' as const, marginTop: 40, fontSize: 13 },
  actions:    { display: 'flex', gap: 8, marginTop: 16 },
  btn:        { flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid #534AB7', background: 'transparent', color: '#534AB7', fontSize: 12, cursor: 'pointer' },
  btnPrimary: { flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid #534AB7', background: '#534AB7', color: '#fff', fontSize: 12, cursor: 'pointer' },
  stat:       { display: 'flex', gap: 8 },
  statBox:    { flex: 1, border: '1px solid #eee', borderRadius: 8, padding: '8px 10px', textAlign: 'center' as const },
  statNum:    { fontSize: 20, fontWeight: 600, color: '#534AB7' },
  statLbl:    { fontSize: 11, color: '#aaa', marginTop: 2 },
  input:      { width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12, marginBottom: 8, boxSizing: 'border-box' as const },
  select:     { width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12, marginBottom: 8, boxSizing: 'border-box' as const, background: '#fff' },
  textarea:   { width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12, marginBottom: 8, boxSizing: 'border-box' as const, resize: 'vertical' as const, minHeight: 80 },
  success:    { color: '#1a9e6f', fontSize: 12, padding: '8px 0' },
  seeAll:     { display: 'block', textAlign: 'center' as const, padding: '8px 0', fontSize: 12, color: '#534AB7', textDecoration: 'none', cursor: 'pointer' },
  pvWrap:     { fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', height: '100vh', display: 'flex', flexDirection: 'row', gap: 8, padding: 10, background: '#fff', boxSizing: 'border-box' as const },
  pvTile:     { flex: 1, border: '1px solid #eee', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none', color: 'inherit' },
  pvNum:      { fontSize: 28, fontWeight: 700, color: '#534AB7', lineHeight: 1 },
  pvLbl:      { fontSize: 12, color: '#888', marginTop: 6 },
  pvArrow:    { fontSize: 11, color: '#bbb', marginTop: 4 },
  formLbl:    { fontSize: 11, color: '#888', marginBottom: 4, display: 'block' },
  acWrap:     { position: 'relative' as const, marginBottom: 8 },
  acList:     { position: 'absolute' as const, top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: 6, maxHeight: 160, overflowY: 'auto' as const, zIndex: 10, marginTop: -6 },
  acItem:     { padding: '7px 10px', fontSize: 12, cursor: 'pointer', borderBottom: '1px solid #f4f4f4' },
  spinner:    { width: 26, height: 26, border: '3px solid #eee', borderTopColor: '#534AB7', borderRadius: '50%', animation: 'zspin 0.8s linear infinite', margin: '0 auto 12px' },
  center:     { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' as const },
};

const statusColor: Record<string, string> = {
  'Open': '#1a9e6f', 'Aperto': '#1a9e6f',
  'Closed': '#aaa',  'Chiuso': '#aaa',
  'On Hold': '#e08a00', 'In attesa': '#e08a00',
  'In Progress': '#534AB7',
};

const isOpen = (st: string) => st !== 'Closed' && st !== 'Chiuso';
const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
};
const formatDuration = (d: string) => (!d || d === '00:00') ? null : d;

export default function App() {
  const [contact, setContact] = useState<Contact | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [deskAccountId, setDeskAccountId] = useState<string | null>(null);
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('summary');
  const [loading, setLoading] = useState(true);

  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketDone, setTicketDone] = useState(false);

  const [newType, setNewType] = useState<'Leads' | 'Contacts'>('Leads');
  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newAccountId, setNewAccountId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [acOptions, setAcOptions] = useState<AccountOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [retryFailed, setRetryFailed] = useState(false);

  const lookupRef = useRef<((p: string, force?: boolean) => Promise<boolean>) | null>(null);

  useEffect(() => {
    Client.getInstance().ready();

    let currentPhone: string | null = null;

    const clearAll = () => {
      currentPhone = null;
      setContact(null); setCompany(null); setCalls([]); setTickets([]);
      setDeskAccountId(null); setShowTicketForm(false); setTicketDone(false);
      setCreatedUrl(null); setRetryFailed(false); setCreating(false);
    };

    const tryLookup = async (phone: string, force = false): Promise<boolean> => {
      if (!force && phone === currentPhone) return !!contact;
      currentPhone = phone;
      log.debug('tryLookup', { phone });
      const r = await fetch(`${BACKEND}/api/zoho/contacts/lookup?phone=${encodeURIComponent(phone)}`);
      const data = await r.json();
      log.debug('contact', data);
      if (!data) { setContact(null); setCompany(null); setCalls([]); setTickets([]); return false; }
      setContact(data);
      const mod = data.module ?? 'Contacts';
      const [callsRes, deskRes] = await Promise.all([
        fetch(`${BACKEND}/api/zoho/activities/${mod}/${data.id}`),
        fetch(`${BACKEND}/api/zoho/desk/${mod}/${data.id}`),
      ]);
      setCalls(await callsRes.json());
      const deskData = await deskRes.json();
      setTickets(deskData.tickets ?? []);
      setDeskAccountId(deskData.deskAccountId ?? null);
      if (data.accountId) {
        try {
          const compRes = await fetch(`${BACKEND}/api/zoho/contacts/company/${data.accountId}`);
          setCompany(await compRes.json());
        } catch (e) { log.error('company error', e); }
      } else {
        setCompany(null);
      }
      return true;
    };

    lookupRef.current = tryLookup;

    const applyPhone = async (phone: string | null) => {
      setActivePhone(phone);
      if (phone) {
        try { await tryLookup(phone); } catch (e) { log.error('lookup error', e); }
      } else {
        clearAll();
      }
      setLoading(false);
    };

    const es = new EventSource(`${BACKEND}/api/zoho/events`);
    es.onmessage = (ev) => {
      try {
        const { phone } = JSON.parse(ev.data);
        log.info('sse phone', phone);
        applyPhone(phone);
      } catch (e) { log.error('sse parse error', e); }
    };
    es.onerror = (e) => { log.error('sse error', e); };
    return () => { es.close(); };
  }, []);

  useEffect(() => {
    if (newType !== 'Contacts' || newCompany.length < 2 || newAccountId) { setAcOptions([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`${BACKEND}/api/zoho/contacts/accounts/search?q=${encodeURIComponent(newCompany)}`);
        setAcOptions(await r.json());
      } catch { setAcOptions([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [newCompany, newType, newAccountId]);

  const createTicket = async () => {
    if (!ticketSubject.trim() || !contact) return;
    setTicketLoading(true);
    try {
      const r = await fetch(`${BACKEND}/api/zoho/desk/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: ticketSubject, description: ticketDesc, contactName: contact.name, contactPhone: contact.phone }),
      });
      const data = await r.json();
      if (data.ok) { setTicketDone(true); setShowTicketForm(false); setTicketSubject(''); setTicketDesc(''); }
    } catch (e) { log.error('createTicket error', e); }
    finally { setTicketLoading(false); }
  };

  const createRecord = async () => {
    if (!newLast.trim() || !activePhone) return;
    setCreating(true);
    setRetryFailed(false);
    try {
      const r = await fetch(`${BACKEND}/api/zoho/contacts/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newType,
          firstName: newFirst || undefined,
          lastName: newLast,
          phone: activePhone,
          company: newCompany || undefined,
          accountId: newType === 'Contacts' ? newAccountId : undefined,
          role: newRole || undefined,
          email: newEmail || undefined,
        }),
      });
      const data = await r.json();
      if (!data.ok) { setCreating(false); log.error('create failed', data); return; }
      setCreatedUrl(data.url ?? null);

      for (let i = 0; i < RETRY_MAX; i++) {
        await new Promise(res => setTimeout(res, RETRY_MS));
        try {
          const found = await lookupRef.current?.(activePhone, true);
          if (found) { setCreating(false); return; }
        } catch (e) { log.error('retry lookup error', e); }
      }
      setCreating(false);
      setRetryFailed(true);
    } catch (e) {
      log.error('createRecord error', e);
      setCreating(false);
    }
  };

  const openTickets = tickets.filter(t => isOpen(t.status)).length;
  const deskAccountUrl = deskAccountId ? `${DESK_BASE}/all/accounts/details/${deskAccountId}` : `${DESK_BASE}/all/tickets`;

  const spinnerCss = <style>{`@keyframes zspin { to { transform: rotate(360deg); } }`}</style>;

  if (IS_PREVIEW) {
    if (loading) return <div style={{ ...s.pvWrap, alignItems: 'center', justifyContent: 'center' }}>Caricamento...</div>;
    if (!contact) return <div style={{ ...s.pvWrap, alignItems: 'center', justifyContent: 'center' }}><div style={s.empty}>Nessun contatto Zoho</div></div>;
    return (
      <div style={s.pvWrap}>
        <a style={s.pvTile} href={contact.url} target="_blank" rel="noreferrer">
          <div style={s.pvNum}>{calls.length}</div>
          <div style={s.pvLbl}>Chiamate</div>
          <div style={s.pvArrow}>Apri in CRM ↗</div>
        </a>
        <a style={s.pvTile} href={deskAccountUrl} target="_blank" rel="noreferrer">
          <div style={{ ...s.pvNum, color: openTickets > 0 ? '#e08a00' : '#1a9e6f' }}>{openTickets}</div>
          <div style={s.pvLbl}>Ticket aperti</div>
          <div style={s.pvArrow}>Apri in Desk ↗</div>
        </a>
      </div>
    );
  }

  if (loading) return <div style={{ ...s.wrap, alignItems: 'center', justifyContent: 'center' }}>Caricamento...</div>;

  if (creating) {
    return (
      <div style={s.wrap}>
        {spinnerCss}
        <div style={s.center}>
          <div style={s.spinner} />
          <div style={{ fontSize: 13 }}>Creazione in corso...</div>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>Attendo che Zoho aggiorni la rubrica</div>
        </div>
      </div>
    );
  }

  if (!contact && retryFailed && createdUrl) {
    return (
      <div style={s.wrap}>
        <div style={s.center}>
          <div style={{ fontSize: 22, color: '#1a9e6f', marginBottom: 8 }}>✓</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Record creato</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4, marginBottom: 16 }}>Zoho ci sta ancora mettendo un po'</div>
          <a href={createdUrl} target="_blank" rel="noreferrer" style={{ ...s.btn, textDecoration: 'none', padding: '8px 16px', flex: 'none' }}>Apri in Zoho ↗</a>
        </div>
      </div>
    );
  }

  if (!contact && activePhone) {
    return (
      <div style={s.wrap}>
        <div style={s.header}>
          <div style={{ paddingBottom: 10 }}>
            <div style={s.name}>Numero sconosciuto</div>
            <div style={s.sub}>{activePhone}</div>
          </div>
        </div>
        <div style={s.body}>
          <div style={{ ...s.secTitle, marginBottom: 10 }}><span>Aggiungi in rubrica</span></div>

          <label style={s.formLbl}>Tipo</label>
          <select style={s.select} value={newType} onChange={e => { setNewType(e.target.value as any); setNewAccountId(null); }}>
            <option value="Leads">Lead</option>
            <option value="Contacts">Contatto</option>
          </select>

          <label style={s.formLbl}>Nome</label>
          <input style={s.input} value={newFirst} onChange={e => setNewFirst(e.target.value)} />

          <label style={s.formLbl}>Cognome *</label>
          <input style={s.input} value={newLast} onChange={e => setNewLast(e.target.value)} />

          <label style={s.formLbl}>Azienda</label>
          <div style={s.acWrap}>
            <input
              style={{ ...s.input, marginBottom: 0 }}
              value={newCompany}
              onChange={e => { setNewCompany(e.target.value); setNewAccountId(null); }}
              placeholder={newType === 'Contacts' ? 'Cerca azienda esistente' : 'Nome azienda'}
            />
            {newType === 'Contacts' && acOptions.length > 0 && (
              <div style={s.acList}>
                {acOptions.map(o => (
                  <div key={o.id} style={s.acItem} onClick={() => { setNewCompany(o.name); setNewAccountId(o.id); setAcOptions([]); }}>
                    {o.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          {newType === 'Contacts' && newCompany && !newAccountId && (
            <div style={{ fontSize: 11, color: '#e08a00', marginBottom: 8 }}>Seleziona un'azienda dall'elenco</div>
          )}

          <label style={s.formLbl}>Ruolo</label>
          <input style={s.input} value={newRole} onChange={e => setNewRole(e.target.value)} />

          <label style={s.formLbl}>Email</label>
          <input style={s.input} value={newEmail} onChange={e => setNewEmail(e.target.value)} />

          <div style={s.actions}>
            <button
              style={s.btnPrimary}
              onClick={createRecord}
              disabled={!newLast.trim() || (newType === 'Contacts' && !newAccountId)}
            >
              Aggiungi in rubrica
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!contact) return <div style={s.wrap}><div style={s.empty}>Nessun contatto Zoho trovato</div></div>;

  const initials = contact.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const pagamentiOk = company?.pagamenti === 'SI';
  const statoAttiva = company?.stato === 'Attiva';

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingBottom: 10 }}>
          <div style={s.avatar}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.name}>
              <a href={contact.url} target="_blank" rel="noreferrer" style={{ color: '#1a1a1a', textDecoration: 'none' }}>{contact.name}</a>
            </div>
            <div style={s.sub}>{contact.organization} · {contact.phone}</div>
          </div>
        </div>
        <div style={s.tabs}>
          {(['summary', 'calls', 'desk'] as Tab[]).map(t => (
            <div key={t} style={tab === t ? s.tabActive : s.tab} onClick={() => setTab(t)}>
              {t === 'summary' ? 'Riepilogo' : t === 'calls' ? `Chiamate (${calls.length})` : `Ticket (${tickets.length})`}
            </div>
          ))}
        </div>
      </div>

      <div style={s.body}>
        {tab === 'summary' && (
          <>
            <div style={s.stat}>
              <div style={s.statBox}>
                <div style={s.statNum}>{calls.length}</div>
                <div style={s.statLbl}>Chiamate</div>
              </div>
              <div style={s.statBox}>
                <div style={s.statNum}>{tickets.length}</div>
                <div style={s.statLbl}>Ticket</div>
              </div>
              <div style={s.statBox}>
                <div style={{ ...s.statNum, color: openTickets > 0 ? '#e08a00' : '#1a9e6f' }}>{openTickets}</div>
                <div style={s.statLbl}>Aperti</div>
              </div>
            </div>

            {company && (
              <div style={s.section}>
                <div style={s.secTitle}>
                  <span>Azienda</span>
                  <a style={s.secLink} href={company.url} target="_blank" rel="noreferrer">Apri ↗</a>
                </div>
                {company.stato && (
                  <div style={s.row}>
                    <span style={s.label}>Stato</span>
                    <span style={s.val}><span style={{ ...s.dot, background: statoAttiva ? '#1a9e6f' : '#d9534f' }} />{company.stato}</span>
                  </div>
                )}
                {company.pagamenti && (
                  <div style={s.row}>
                    <span style={s.label}>Pagamenti</span>
                    <span style={s.val}><span style={{ ...s.dot, background: pagamentiOk ? '#1a9e6f' : '#d9534f' }} />{pagamentiOk ? 'In regola' : company.pagamenti}</span>
                  </div>
                )}
                {company.blocco && (
                  <div style={s.row}>
                    <span style={s.label}>Blocco ammin.</span>
                    <span style={{ ...s.val, color: '#d9534f', fontWeight: 500 }}><span style={{ ...s.dot, background: '#d9534f' }} />Attivo</span>
                  </div>
                )}
                {company.vat && <div style={s.row}><span style={s.label}>P. IVA</span><span style={s.val}>{company.vat}</span></div>}
                {company.email && <div style={s.row}><span style={s.label}>Email</span><span style={s.val}>{company.email}</span></div>}
                {company.phone && <div style={s.row}><span style={s.label}>Telefono</span><span style={s.val}>{company.phone}</span></div>}
                {company.owner && <div style={s.row}><span style={s.label}>Referente</span><span style={s.val}>{company.owner}</span></div>}
                {company.scadenza && <div style={s.row}><span style={s.label}>Scad. contratto</span><span style={s.val}>{company.scadenza}</span></div>}
              </div>
            )}

            {(calls[0] || tickets[0]) && (
              <div style={s.section}>
                <div style={s.secTitle}><span>Ultima attività</span></div>
                {calls[0] && <div style={s.row}><span style={s.label}>Chiamata</span><span style={s.val}>{formatDate(calls[0].startTime)}</span></div>}
                {tickets[0] && <div style={s.row}><span style={s.label}>Ticket</span><span style={s.val}>{tickets[0].subject}</span></div>}
              </div>
            )}

            {ticketDone && <div style={s.success}>✓ Ticket creato</div>}

            {showTicketForm ? (
              <div style={{ marginTop: 16 }}>
                <input style={s.input} placeholder="Oggetto del ticket *" value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} />
                <textarea style={s.textarea} placeholder="Descrizione (opzionale)" value={ticketDesc} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTicketDesc(e.target.value)} />
                <div style={s.actions}>
                  <button style={{ ...s.btn, color: '#aaa', borderColor: '#ddd' }} onClick={() => setShowTicketForm(false)}>Annulla</button>
                  <button style={s.btnPrimary} onClick={createTicket} disabled={ticketLoading}>{ticketLoading ? '...' : 'Crea ticket'}</button>
                </div>
              </div>
            ) : (
              <div style={s.actions}>
                <button style={s.btn} onClick={() => { setShowTicketForm(true); setTicketDone(false); }}>🎫 Nuovo ticket</button>
              </div>
            )}
          </>
        )}

        {tab === 'calls' && (
          calls.length === 0
            ? <div style={s.empty}>Nessuna chiamata trovata</div>
            : <>
                {calls.slice(0, MAX_ITEMS).map(c => (
                  <div key={c.id} style={s.card}>
                    <div style={s.cardTitle}>{c.subject}</div>
                    <div style={s.cardMeta}>{formatDate(c.startTime)}{formatDuration(c.duration) && ` · ${c.duration}`}</div>
                    {c.note && <div style={{ ...s.cardMeta, marginTop: 6 }}>{c.note}</div>}
                  </div>
                ))}
                <a style={s.seeAll} href={contact.url} target="_blank" rel="noreferrer">Vedi tutto in CRM ↗</a>
              </>
        )}

        {tab === 'desk' && (
          tickets.length === 0
            ? <div style={s.empty}>Nessun ticket trovato</div>
            : <>
                {tickets.slice(0, MAX_ITEMS).map(t => (
                  <a key={t.id} href={`${DESK_BASE}/all/tickets/detail/${t.id}`} target="_blank" rel="noreferrer" style={s.cardLink}>
                    <div style={s.cardTitle}>{t.subject}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                      <div style={{ ...s.badge, background: `${statusColor[t.status] ?? '#aaa'}22`, color: statusColor[t.status] ?? '#aaa' }}>{t.status}</div>
                      {t.channel && <div style={{ ...s.badge, background: '#f0f0f0', color: '#888' }}>{t.channel}</div>}
                    </div>
                    <div style={s.cardMeta}>{formatDate(t.createdTime)}</div>
                  </a>
                ))}
                <a style={s.seeAll} href={deskAccountUrl} target="_blank" rel="noreferrer">Vedi tutti i ticket in Desk ↗</a>
              </>
        )}
      </div>
    </div>
  );
}
