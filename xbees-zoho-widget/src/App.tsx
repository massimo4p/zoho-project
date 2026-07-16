import React, { useEffect, useRef, useState } from 'react';
import Client from '@wildix/xbees-connect';
import { log } from './logger';

const BACKEND = (import.meta as any).env?.VITE_BACKEND_URL ?? '';
const VIEW = new URLSearchParams(window.location.search).get('v');
const IS_PREVIEW = VIEW === 'ui';

const DESK_BASE = 'https://desk.zoho.eu/agent/4personality';
const MAX_ITEMS = 10;

interface Contact {
  id?: string; module?: string; name: string; organization: string;
  accountId?: string | null; phone: string; url: string;
}
interface Company {
  id: string; name: string; email: string | null; phone: string | null;
  website: string | null; vat: string | null; stato: string | null;
  pagamenti: string | null; blocco: boolean; owner: string | null;
  scadenza: string | null; url: string;
}
interface Lead {
  id: string; name: string; company: string; phone: string;
  email: string | null; website: string | null; status: string | null;
  source: string | null; owner: string | null; description: string;
  vat: string | null; cf: string | null; street: string | null;
  city: string | null; zip: string | null; state: string | null;
  converted: boolean; url: string;
}
interface Call { id: string; subject: string; startTime: string; duration: string; note?: string; }
interface Ticket { id: string; subject: string; status: string; priority?: string; createdTime: string; channel?: string; }
interface AccountOption { id: string; name: string; }

const s: Record<string, React.CSSProperties> = {
  wrap:      { fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', fontSize: 13, color: '#1a1a1a', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' },
  head:      { padding: '12px 16px', borderBottom: '1px solid #eee', display: 'flex', gap: 12, alignItems: 'center' },
  avatar:    { width: 40, height: 40, borderRadius: '50%', background: '#534AB7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, flexShrink: 0 },
  avatarLd:  { width: 40, height: 40, borderRadius: '50%', background: '#FAEEDA', color: '#854F0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, flexShrink: 0 },
  name:      { fontSize: 15, fontWeight: 600 },
  sub:       { fontSize: 12, color: '#888', marginTop: 2 },
  chips:     { display: 'flex', gap: 6, marginLeft: 12, flexWrap: 'wrap' as const },
  chipOk:    { background: '#E1F5EE', color: '#0F6E56', fontSize: 11, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' as const },
  chipBad:   { background: '#FCEBEB', color: '#A32D2D', fontSize: 11, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' as const },
  chipLead:  { background: '#FAEEDA', color: '#854F0B', fontSize: 11, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' as const },
  spacer:    { flex: 1, minWidth: 300 },
  cols:      { display: 'grid', gridTemplateColumns: '320px minmax(0,1fr) minmax(0,1fr)', flex: 1, alignItems: 'start' },
  col:       { padding: '14px 16px', borderRight: '1px solid #eee' },
  colLast:   { padding: '14px 16px' },
  secTitle:  { fontSize: 11, fontWeight: 600, color: '#999', letterSpacing: 0.5, textTransform: 'uppercase' as const, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  secLink:   { fontSize: 11, color: '#534AB7', textDecoration: 'none', textTransform: 'none' as const, letterSpacing: 0, fontWeight: 400 },
  row:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '5px 0', borderBottom: '1px solid #f4f4f4', fontSize: 12 },
  label:     { color: '#999', flexShrink: 0 },
  val:       { textAlign: 'right' as const, minWidth: 0, wordBreak: 'break-word' as const },
  card:      { border: '1px solid #eee', borderRadius: 8, padding: '8px 10px', marginBottom: 6 },
  cardLink:  { border: '1px solid #eee', borderRadius: 8, padding: '8px 10px', marginBottom: 6, textDecoration: 'none', display: 'block', color: 'inherit', cursor: 'pointer' },
  cardTitle: { fontSize: 12, fontWeight: 500 },
  cardMeta:  { fontSize: 11, color: '#aaa', marginTop: 2 },
  badge:     { fontSize: 11, padding: '2px 7px', borderRadius: 20, display: 'inline-block', marginTop: 4 },
  emptyBox:  { border: '1px dashed #e5e5e5', borderRadius: 8, padding: 20, textAlign: 'center' as const, fontSize: 12, color: '#aaa' },
  empty:     { color: '#aaa', textAlign: 'center' as const, marginTop: 40, fontSize: 13 },
  btn:       { width: '100%', padding: '8px 0', borderRadius: 6, border: '1px solid #534AB7', background: 'transparent', color: '#534AB7', fontSize: 12, cursor: 'pointer', marginTop: 14 },
  btnPri:    { flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid #534AB7', background: '#534AB7', color: '#fff', fontSize: 12, cursor: 'pointer' },
  btnGh:     { flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid #ddd', background: 'transparent', color: '#888', fontSize: 12, cursor: 'pointer', textAlign: 'center' as const, textDecoration: 'none' },
  actions:   { display: 'flex', gap: 8, marginTop: 10 },
  input:     { width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12, marginBottom: 8, boxSizing: 'border-box' as const },
  select:    { width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12, marginBottom: 8, boxSizing: 'border-box' as const, background: '#fff' },
  textarea:  { width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12, marginBottom: 8, boxSizing: 'border-box' as const, resize: 'vertical' as const, minHeight: 90 },
  success:   { color: '#1a9e6f', fontSize: 12, padding: '4px 0' },
  formLbl:   { fontSize: 11, color: '#888', marginBottom: 4, display: 'block' },
  formWrap:  { padding: '14px 16px', maxWidth: 420 },
  acWrap:    { position: 'relative' as const, marginBottom: 8 },
  acList:    { position: 'absolute' as const, top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: 6, maxHeight: 160, overflowY: 'auto' as const, zIndex: 10, marginTop: -6 },
  acItem:    { padding: '7px 10px', fontSize: 12, cursor: 'pointer', borderBottom: '1px solid #f4f4f4' },
  spinner:   { width: 26, height: 26, border: '3px solid #eee', borderTopColor: '#534AB7', borderRadius: '50%', animation: 'zspin 0.8s linear infinite', margin: '0 auto 12px' },
  center:    { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' as const },
  pvWrap:    { fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', height: '100vh', display: 'flex', flexDirection: 'row', gap: 8, padding: 10, background: '#fff', boxSizing: 'border-box' as const },
  pvTile:    { flex: 1, border: '1px solid #eee', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none', color: 'inherit' },
  pvNum:     { fontSize: 28, fontWeight: 700, color: '#534AB7', lineHeight: 1 },
  pvLbl:     { fontSize: 12, color: '#888', marginTop: 6 },
  pvArrow:   { fontSize: 11, color: '#bbb', marginTop: 4 },
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
  const [lead, setLead] = useState<Lead | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [deskAccountId, setDeskAccountId] = useState<string | null>(null);
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [leadStatuses, setLeadStatuses] = useState<string[]>([]);
  const [leadStatus, setLeadStatus] = useState('');
  const [leadDesc, setLeadDesc] = useState('');
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

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
  const [createFailed, setCreateFailed] = useState(false);

  const recordRef = useRef<((m: string, id: string) => Promise<boolean>) | null>(null);

  useEffect(() => {
    fetch(`${BACKEND}/api/zoho/contacts/lead-statuses`)
      .then(r => r.json()).then(setLeadStatuses).catch(() => setLeadStatuses([]));
  }, []);

  useEffect(() => {
    Client.getInstance().ready();
    let currentPhone: string | null = null;

    const resetForm = () => {
      setNewFirst(''); setNewLast(''); setNewCompany('');
      setNewAccountId(null); setNewRole(''); setNewEmail('');
      setNewType('Leads'); setAcOptions([]);
    };

    const clearAll = () => {
      currentPhone = null;
      setContact(null); setCompany(null); setLead(null); setCalls([]); setTickets([]);
      setDeskAccountId(null); setShowTicketForm(false); setTicketDone(false);
      setCreatedUrl(null); setCreateFailed(false); setCreating(false);
      setLeadStatus(''); setLeadDesc(''); setLeadSaved(false);
      resetForm();
    };

    const loadLead = async (id: string) => {
      const r = await fetch(`${BACKEND}/api/zoho/contacts/lead/${id}`);
      const l = await r.json();
      log.debug('lead', l);
      if (!l) return;
      setLead(l); setLeadStatus(l.status ?? ''); setLeadDesc(l.description ?? '');
    };

    const loadExtras = async (module: string, id: string, accountId?: string | null) => {
      if (module === 'Leads') {
        setCompany(null); setTickets([]); setDeskAccountId(null);
        const [callsRes] = await Promise.all([
          fetch(`${BACKEND}/api/zoho/activities/${module}/${id}`),
          loadLead(id),
        ]);
        setCalls(await callsRes.json());
        return;
      }
      setLead(null);
      const [callsRes, deskRes] = await Promise.all([
        fetch(`${BACKEND}/api/zoho/activities/${module}/${id}`),
        fetch(`${BACKEND}/api/zoho/desk/${module}/${id}`),
      ]);
      setCalls(await callsRes.json());
      const deskData = await deskRes.json();
      setTickets(deskData.tickets ?? []);
      setDeskAccountId(deskData.deskAccountId ?? null);
      if (accountId) {
        try {
          const compRes = await fetch(`${BACKEND}/api/zoho/contacts/company/${accountId}`);
          setCompany(await compRes.json());
        } catch (e) { log.error('company error', e); }
      } else setCompany(null);
    };

    const tryLookup = async (phone: string) => {
      if (phone === currentPhone) return;
      currentPhone = phone;
      log.debug('tryLookup', { phone });
      const r = await fetch(`${BACKEND}/api/zoho/contacts/lookup?phone=${encodeURIComponent(phone)}`);
      const data = await r.json();
      log.debug('contact', data);
      if (!data) { setContact(null); setCompany(null); setLead(null); setCalls([]); setTickets([]); return; }
      setContact(data);
      await loadExtras(data.module ?? 'Contacts', data.id, data.accountId);
    };

    const loadRecord = async (module: string, id: string) => {
      const r = await fetch(`${BACKEND}/api/zoho/contacts/record/${module}/${id}`);
      const data = await r.json();
      log.debug('record', data);
      if (!data) return false;
      setContact(data);
      await loadExtras(module, id, data.accountId);
      return true;
    };
    recordRef.current = loadRecord;

    const applyPhone = async (phone: string | null) => {
      setActivePhone(phone);
      if (phone) {
        try { await tryLookup(phone); } catch (e) { log.error('lookup error', e); }
      } else clearAll();
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

  const saveLead = async () => {
    if (!lead) return;
    setLeadSaving(true); setLeadSaved(false);
    try {
      const r = await fetch(`${BACKEND}/api/zoho/contacts/lead/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: leadStatus, description: leadDesc }),
      });
      const data = await r.json();
      if (data.ok) setLeadSaved(true); else log.error('saveLead failed', data);
    } catch (e) { log.error('saveLead error', e); }
    finally { setLeadSaving(false); }
  };

  const createTicket = async () => {
    if (!ticketSubject.trim() || !contact) return;
    setTicketLoading(true);
    try {
      const r = await fetch(`${BACKEND}/api/zoho/desk/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: ticketSubject, description: ticketDesc, contactName: contact.name, contactPhone: contact.phone }),
      });
      const data = await r.json();
      if (data.ok) { setTicketDone(true); setShowTicketForm(false); setTicketSubject(''); setTicketDesc(''); }
    } catch (e) { log.error('createTicket error', e); }
    finally { setTicketLoading(false); }
  };

  const createRecord = async () => {
    if (!newLast.trim() || !activePhone) return;
    setCreating(true); setCreateFailed(false);
    try {
      const r = await fetch(`${BACKEND}/api/zoho/contacts/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newType, firstName: newFirst || undefined, lastName: newLast,
          phone: activePhone, company: newCompany || undefined,
          accountId: newType === 'Contacts' ? newAccountId : undefined,
          role: newRole || undefined, email: newEmail || undefined,
        }),
      });
      const data = await r.json();
      if (!data.ok) { setCreating(false); setCreateFailed(true); log.error('create failed', data); return; }
      setCreatedUrl(data.url ?? null);
      const ok = await recordRef.current?.(data.type, data.id);
      setCreating(false);
      if (!ok) setCreateFailed(true);
      setNewFirst(''); setNewLast(''); setNewCompany('');
      setNewAccountId(null); setNewRole(''); setNewEmail('');
    } catch (e) { log.error('createRecord error', e); setCreating(false); setCreateFailed(true); }
  };

  const openTickets = tickets.filter(t => isOpen(t.status)).length;
  const deskAccountUrl = deskAccountId ? `${DESK_BASE}/all/accounts/details/${deskAccountId}` : `${DESK_BASE}/all/tickets`;

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

  if (loading) return <div style={s.wrap}><div style={s.center}>Caricamento...</div></div>;

  if (creating) return (
    <div style={s.wrap}>
      <style>{`@keyframes zspin { to { transform: rotate(360deg); } }`}</style>
      <div style={s.center}><div style={s.spinner} /><div style={{ fontSize: 13 }}>Creazione in corso...</div></div>
    </div>
  );

  if (!contact && createFailed && createdUrl) return (
    <div style={s.wrap}>
      <div style={s.center}>
        <div style={{ fontSize: 22, color: '#1a9e6f', marginBottom: 8 }}>✓</div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Record creato</div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 4, marginBottom: 16 }}>Non riesco a caricare la scheda</div>
        <a href={createdUrl} target="_blank" rel="noreferrer" style={{ ...s.btnGh, padding: '8px 16px', flex: 'none' }}>Apri in Zoho ↗</a>
      </div>
    </div>
  );

  if (!contact && activePhone) return (
    <div style={s.wrap}>
      <div style={s.head}>
        <div>
          <div style={s.name}>Numero sconosciuto</div>
          <div style={s.sub}>{activePhone}</div>
        </div>
      </div>
      <div style={s.formWrap}>
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
          <input style={{ ...s.input, marginBottom: 0 }} value={newCompany}
            onChange={e => { setNewCompany(e.target.value); setNewAccountId(null); }}
            placeholder={newType === 'Contacts' ? 'Cerca azienda esistente' : 'Nome azienda'} />
          {newType === 'Contacts' && acOptions.length > 0 && (
            <div style={s.acList}>
              {acOptions.map(o => (
                <div key={o.id} style={s.acItem} onClick={() => { setNewCompany(o.name); setNewAccountId(o.id); setAcOptions([]); }}>{o.name}</div>
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
        <button style={{ ...s.btnPri, width: '100%', marginTop: 8 }} onClick={createRecord}
          disabled={!newLast.trim() || (newType === 'Contacts' && !newAccountId)}>Aggiungi in rubrica</button>
      </div>
    </div>
  );

  if (!contact) return <div style={s.wrap}><div style={s.empty}>Nessun contatto Zoho trovato</div></div>;

  const initials = contact.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const callsCol = (
    <>
      <div style={s.secTitle}>
        <span>Chiamate ({calls.length})</span>
        {calls.length > MAX_ITEMS && <a style={s.secLink} href={contact.url} target="_blank" rel="noreferrer">Tutte ↗</a>}
      </div>
      {calls.length === 0
        ? <div style={s.emptyBox}>Nessuna chiamata</div>
        : calls.slice(0, MAX_ITEMS).map(c => (
          <div key={c.id} style={s.card}>
            <div style={s.cardTitle}>{c.subject}</div>
            <div style={s.cardMeta}>{formatDate(c.startTime)}{formatDuration(c.duration) && ` · ${c.duration}`}</div>
          </div>
        ))}
    </>
  );

  if (contact.module === 'Leads') {
    const addr = [lead?.street, [lead?.zip, lead?.city].filter(Boolean).join(' '), lead?.state ? `(${lead.state})` : null].filter(Boolean).join(', ');
    return (
      <div style={s.wrap}>
        <div style={s.head}>
          <div style={s.avatarLd}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={s.name}><a href={contact.url} target="_blank" rel="noreferrer" style={{ color: '#1a1a1a', textDecoration: 'none' }}>{contact.name}</a></div>
            <div style={s.sub}>{contact.organization} · {contact.phone}</div>
          </div>
          <div style={s.chips}>
            <span style={s.chipLead}>Lead</span>
            {lead?.status && <span style={s.chipLead}>{lead.status}</span>}
          </div>
          <div style={s.spacer} />
        </div>

        <div style={s.cols}>
          <div style={s.col}>
            <div style={s.secTitle}>
              <span>Dettagli</span>
              <a style={s.secLink} href={contact.url} target="_blank" rel="noreferrer">Apri ↗</a>
            </div>
            {lead?.source && <div style={s.row}><span style={s.label}>Origine</span><span style={s.val}>{lead.source}</span></div>}
            {lead?.owner && <div style={s.row}><span style={s.label}>Referente</span><span style={s.val}>{lead.owner}</span></div>}
            {lead?.email && <div style={s.row}><span style={s.label}>Email</span><span style={s.val}>{lead.email}</span></div>}
            {lead?.vat && <div style={s.row}><span style={s.label}>P. IVA</span><span style={s.val}>{lead.vat}</span></div>}
            {addr && <div style={s.row}><span style={s.label}>Indirizzo</span><span style={s.val}>{addr}</span></div>}
          </div>

          <div style={s.col}>
            <div style={s.secTitle}><span>Stato e note</span></div>
            <select style={s.select} value={leadStatus} onChange={e => { setLeadStatus(e.target.value); setLeadSaved(false); }}>
              <option value="">—</option>
              {leadStatuses.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
            <textarea style={s.textarea} placeholder="Appunti sulla chiamata..." value={leadDesc}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setLeadDesc(e.target.value); setLeadSaved(false); }} />
            {leadSaved && <div style={s.success}>✓ Salvato</div>}
            <div style={s.actions}>
              <button style={s.btnPri} onClick={saveLead} disabled={leadSaving}>{leadSaving ? '...' : 'Salva'}</button>
            </div>
          </div>

          <div style={s.colLast}>{callsCol}</div>
        </div>
      </div>
    );
  }

  const pagamentiOk = company?.pagamenti === 'SI';
  const statoAttiva = company?.stato === 'Attiva';

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <div style={s.avatar}>{initials}</div>
        <div style={{ minWidth: 0 }}>
          <div style={s.name}><a href={contact.url} target="_blank" rel="noreferrer" style={{ color: '#1a1a1a', textDecoration: 'none' }}>{contact.name}</a></div>
          <div style={s.sub}>{contact.organization} · {contact.phone}</div>
        </div>
        <div style={s.chips}>
          {company?.stato && <span style={statoAttiva ? s.chipOk : s.chipBad}>{company.stato}</span>}
          {company?.pagamenti && <span style={pagamentiOk ? s.chipOk : s.chipBad}>{pagamentiOk ? 'Pagamenti in regola' : `Pagamenti: ${company.pagamenti}`}</span>}
          {company?.blocco && <span style={s.chipBad}>Blocco amministrativo</span>}
        </div>
        <div style={s.spacer} />
      </div>

      <div style={s.cols}>
        <div style={s.col}>
          <div style={s.secTitle}>
            <span>Azienda</span>
            {company && <a style={s.secLink} href={company.url} target="_blank" rel="noreferrer">Apri ↗</a>}
          </div>
          {company ? (
            <>
              {company.vat && <div style={s.row}><span style={s.label}>P. IVA</span><span style={s.val}>{company.vat}</span></div>}
              {company.email && <div style={s.row}><span style={s.label}>Email</span><span style={s.val}>{company.email}</span></div>}
              {company.phone && <div style={s.row}><span style={s.label}>Telefono</span><span style={s.val}>{company.phone}</span></div>}
              {company.owner && <div style={s.row}><span style={s.label}>Referente</span><span style={s.val}>{company.owner}</span></div>}
              {company.scadenza && <div style={s.row}><span style={s.label}>Scad. contratto</span><span style={s.val}>{company.scadenza}</span></div>}
            </>
          ) : <div style={s.emptyBox}>Nessuna azienda collegata</div>}

          {ticketDone && <div style={s.success}>✓ Ticket creato</div>}
          {showTicketForm ? (
            <div style={{ marginTop: 14 }}>
              <input style={s.input} placeholder="Oggetto del ticket *" value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} />
              <textarea style={s.textarea} placeholder="Descrizione (opzionale)" value={ticketDesc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTicketDesc(e.target.value)} />
              <div style={s.actions}>
                <button style={s.btnGh} onClick={() => setShowTicketForm(false)}>Annulla</button>
                <button style={s.btnPri} onClick={createTicket} disabled={ticketLoading}>{ticketLoading ? '...' : 'Crea'}</button>
              </div>
            </div>
          ) : (
            <button style={s.btn} onClick={() => { setShowTicketForm(true); setTicketDone(false); }}>Nuovo ticket</button>
          )}
        </div>

        <div style={s.col}>{callsCol}</div>

        <div style={s.colLast}>
          <div style={s.secTitle}>
            <span>Ticket ({tickets.length}{openTickets > 0 ? ` · ${openTickets} aperti` : ''})</span>
            {tickets.length > 0 && <a style={s.secLink} href={deskAccountUrl} target="_blank" rel="noreferrer">Tutti ↗</a>}
          </div>
          {tickets.length === 0
            ? <div style={s.emptyBox}>Nessun ticket</div>
            : tickets.slice(0, MAX_ITEMS).map(t => (
              <a key={t.id} href={`${DESK_BASE}/all/tickets/detail/${t.id}`} target="_blank" rel="noreferrer" style={s.cardLink}>
                <div style={s.cardTitle}>{t.subject}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                  <div style={{ ...s.badge, background: `${statusColor[t.status] ?? '#aaa'}22`, color: statusColor[t.status] ?? '#aaa' }}>{t.status}</div>
                  {t.channel && <div style={{ ...s.badge, background: '#f0f0f0', color: '#888' }}>{t.channel}</div>}
                </div>
                <div style={s.cardMeta}>{formatDate(t.createdTime)}</div>
              </a>
            ))}
        </div>
      </div>
    </div>
  );
}
