import React, { useEffect, useState } from 'react';
import Client from '@wildix/xbees-connect';
import { log } from './logger';

const BACKEND = (import.meta as any).env?.VITE_BACKEND_URL ?? '';

interface Contact {
  id?: string;
  module?: string;
  name: string;
  organization: string;
  phone: string;
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

type Tab = 'summary' | 'calls' | 'desk';

const s: Record<string, React.CSSProperties> = {
  wrap:      { fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', fontSize: 13, color: '#1a1a1a', height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' },
  header:    { padding: '12px 14px 0', borderBottom: '1px solid #eee' },
  avatar:    { width: 38, height: 38, borderRadius: '50%', background: '#534AB7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, flexShrink: 0 },
  name:      { fontWeight: 600, fontSize: 14 },
  sub:       { fontSize: 11, color: '#888', marginTop: 2 },
  tabs:      { display: 'flex', borderBottom: '1px solid #eee', marginTop: 10 },
  tab:       { padding: '7px 12px', fontSize: 12, cursor: 'pointer', borderBottom: '2px solid transparent', color: '#888', marginBottom: -1 },
  tabActive: { padding: '7px 12px', fontSize: 12, cursor: 'pointer', borderBottom: '2px solid #534AB7', color: '#534AB7', fontWeight: 500, marginBottom: -1 },
  body:      { padding: '12px 14px', flex: 1, overflowY: 'auto' as const },
  row:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f0f0f0' },
  label:     { color: '#999', fontSize: 12 },
  val:       { fontSize: 12, textAlign: 'right' as const, maxWidth: '60%' },
  card:      { border: '1px solid #eee', borderRadius: 8, padding: '10px 12px', marginBottom: 8, cursor: 'default' },
  cardLink:  { border: '1px solid #eee', borderRadius: 8, padding: '10px 12px', marginBottom: 8, cursor: 'pointer', textDecoration: 'none', display: 'block', color: 'inherit' },
  cardTitle: { fontWeight: 500, fontSize: 13 },
  cardMeta:  { fontSize: 11, color: '#aaa', marginTop: 4 },
  badge:     { fontSize: 11, padding: '2px 7px', borderRadius: 20, display: 'inline-block', marginTop: 4 },
  empty:     { color: '#aaa', textAlign: 'center' as const, marginTop: 40, fontSize: 13 },
  actions:   { display: 'flex', gap: 8, marginTop: 12 },
  btn:       { flex: 1, padding: '7px 0', borderRadius: 6, border: '1px solid #534AB7', background: 'transparent', color: '#534AB7', fontSize: 12, cursor: 'pointer' },
  stat:      { display: 'flex', gap: 8, marginBottom: 12 },
  statBox:   { flex: 1, border: '1px solid #eee', borderRadius: 8, padding: '8px 10px', textAlign: 'center' as const },
  statNum:   { fontSize: 20, fontWeight: 600, color: '#534AB7' },
  statLbl:   { fontSize: 11, color: '#aaa', marginTop: 2 },
};

const statusColor: Record<string, string> = {
  'Open': '#1a9e6f', 'Aperto': '#1a9e6f',
  'Closed': '#aaa',  'Chiuso': '#aaa',
  'On Hold': '#e08a00', 'In attesa': '#e08a00',
  'In Progress': '#534AB7',
};

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
};

const formatDuration = (d: string) => {
  if (!d || d === '00:00') return null;
  return d;
};

export default function App() {
  const [contact, setContact] = useState<Contact | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tab, setTab] = useState<Tab>('summary');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Client.getInstance().ready();

    const tryLookup = async (phone: string) => {
      log.debug('tryLookup', { phone });
      const r = await fetch(`${BACKEND}/api/zoho/contacts/lookup?phone=${encodeURIComponent(phone)}`);
      const data = await r.json();
      log.debug('contact', data);
      if (!data) return;
      setContact(data);
      const mod = data.module ?? 'Contacts';
      const [callsRes, deskRes] = await Promise.all([
        fetch(`${BACKEND}/api/zoho/activities/${mod}/${data.id}`),
        fetch(`${BACKEND}/api/zoho/desk/${mod}/${data.id}`),
      ]);
      setCalls(await callsRes.json());
      setTickets(await deskRes.json());
    };

    const run = async () => {
      try {
        const lastPhone = Client.getInstance().getFromStorage<string>('lastCallPhone');
        if (lastPhone) { await tryLookup(lastPhone); setLoading(false); return; }
        const res = await Client.getInstance().getCurrentContact();
        const phone = (res as any)?.payload?.phone ?? (res as any)?.payload?.phones?.[0];
        if (phone) { await tryLookup(phone); setLoading(false); return; }
        const res2 = await Client.getInstance().getAvailableContactData();
        const phones = (res2 as any)?.payload?.phones ?? [];
        if (phones.length > 0) await tryLookup(phones[0]);
      } catch (e) {
        log.error('run error', e);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) return <div style={{ ...s.wrap, alignItems: 'center', justifyContent: 'center' }}>Caricamento...</div>;
  if (!contact) return <div style={s.wrap}><div style={s.empty}>Nessun contatto Zoho trovato</div></div>;

  const initials = contact.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const openTickets = tickets.filter(t => t.status !== 'Closed' && t.status !== 'Chiuso').length;

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingBottom: 10 }}>
          <div style={s.avatar}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={s.name}>{contact.name}</div>
            <div style={s.sub}>{contact.organization} · {contact.phone}</div>
          </div>
          <a href={contact.url} target="_blank" rel="noreferrer" style={{ color: '#534AB7', fontSize: 18, textDecoration: 'none' }}>↗</a>
        </div>
        <div style={s.tabs}>
          {(['summary', 'calls', 'desk'] as Tab[]).map(t => (
            <div key={t} style={tab === t ? s.tabActive : s.tab} onClick={() => setTab(t)}>
              {t === 'summary' ? 'Riepilogo' : t === 'calls' ? `Chiamate (${calls.length})` : `Desk (${tickets.length})`}
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
                <div style={s.statLbl}>Ticket totali</div>
              </div>
              <div style={s.statBox}>
                <div style={{ ...s.statNum, color: openTickets > 0 ? '#e08a00' : '#1a9e6f' }}>{openTickets}</div>
                <div style={s.statLbl}>Ticket aperti</div>
              </div>
            </div>
            {calls[0] && (
              <div style={s.row}>
                <span style={s.label}>Ultima chiamata</span>
                <span style={s.val}>{formatDate(calls[0].startTime)}</span>
              </div>
            )}
            {tickets[0] && (
              <div style={s.row}>
                <span style={s.label}>Ultimo ticket</span>
                <span style={s.val}>{tickets[0].subject}</span>
              </div>
            )}
            <div style={s.actions}>
              <button style={s.btn} onClick={() => window.open(contact.url, '_blank')}>Apri in Zoho CRM</button>
              <button style={s.btn} onClick={() => window.open(`https://desk.zoho.eu/agent/4personality/all/tickets/new`, '_blank')}>🎫 Nuovo ticket</button>
            </div>
          </>
        )}

        {tab === 'calls' && (
          calls.length === 0
            ? <div style={s.empty}>Nessuna chiamata trovata</div>
            : calls.map(c => (
              <div key={c.id} style={s.card}>
                <div style={s.cardTitle}>{c.subject}</div>
                <div style={s.cardMeta}>
                  {formatDate(c.startTime)}
                  {formatDuration(c.duration) && ` · ${c.duration}`}
                </div>
                {c.note && <div style={{ ...s.cardMeta, marginTop: 6 }}>{c.note}</div>}
              </div>
            ))
        )}

        {tab === 'desk' && (
          tickets.length === 0
            ? <div style={s.empty}>Nessun ticket trovato</div>
            : tickets.map(t => (
              
                key={t.id}
                href={`https://desk.zoho.eu/agent/4personality/all/tickets/detail/${t.id}`}
                target="_blank"
                rel="noreferrer"
                style={s.cardLink}
              >
                <div style={s.cardTitle}>{t.subject}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                  <div style={{ ...s.badge, background: `${statusColor[t.status] ?? '#aaa'}22`, color: statusColor[t.status] ?? '#aaa' }}>
                    {t.status}
                  </div>
                  {t.channel && <div style={{ ...s.badge, background: '#f0f0f0', color: '#888' }}>{t.channel}</div>}
                </div>
                <div style={s.cardMeta}>{formatDate(t.createdTime)}</div>
              </a>
            ))
        )}
      </div>
    </div>
  );
}
