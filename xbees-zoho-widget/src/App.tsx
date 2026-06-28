import React, { useEffect, useState } from 'react';
import Client from '@wildix/xbees-connect';

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
  val:       { fontSize: 12, textAlign: 'right' as const },
  card:      { border: '1px solid #eee', borderRadius: 8, padding: '10px 12px', marginBottom: 8 },
  cardTitle: { fontWeight: 500, fontSize: 13 },
  cardMeta:  { fontSize: 11, color: '#aaa', marginTop: 4 },
  badge:     { fontSize: 11, padding: '2px 7px', borderRadius: 20, display: 'inline-block', marginTop: 4 },
  empty:     { color: '#aaa', textAlign: 'center' as const, marginTop: 40, fontSize: 13 },
  actions:   { display: 'flex', gap: 8, marginTop: 12 },
  btn:       { flex: 1, padding: '7px 0', borderRadius: 6, border: '1px solid #534AB7', background: 'transparent', color: '#534AB7', fontSize: 12, cursor: 'pointer' },
};

const statusColor: Record<string, string> = {
  'Aperto': '#1a9e6f', 'Open': '#1a9e6f',
  'Chiuso': '#aaa',    'Closed': '#aaa',
  'In attesa': '#e08a00', 'Pending': '#e08a00',
};

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
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
      console.log('[zoho] tryLookup:', phone);
      const r = await fetch(`${BACKEND}/api/zoho/contacts/lookup?phone=${encodeURIComponent(phone)}`);
      const data = await r.json();
      console.log('[zoho] contact:', JSON.stringify(data));
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
        // 1. Prova dal storage (chiamata in corso)
        const lastPhone = Client.getInstance().getFromStorage<string>('lastCallPhone');
        if (lastPhone) {
          await tryLookup(lastPhone);
          setLoading(false);
          return;
        }

        // 2. Prova getCurrentContact
        const res = await Client.getInstance().getCurrentContact();
        const phone = (res as any)?.payload?.phone ?? (res as any)?.payload?.phones?.[0];
        if (phone) {
          await tryLookup(phone);
          setLoading(false);
          return;
        }

        // 3. Prova getAvailableContactData
        const res2 = await Client.getInstance().getAvailableContactData();
        const phones = (res2 as any)?.payload?.phones ?? [];
        if (phones.length > 0) {
          await tryLookup(phones[0]);
        }
      } catch (e) {
        console.error('[zoho] errore:', e);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) return <div style={{ ...s.wrap, alignItems: 'center', justifyContent: 'center' }}>Caricamento...</div>;
  if (!contact) return <div style={s.wrap}><div style={s.empty}>Nessun contatto Zoho trovato</div></div>;

  const initials = contact.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

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
              {t === 'summary' ? 'Summary' : t === 'calls' ? `Chiamate (${calls.length})` : `Desk (${tickets.length})`}
            </div>
          ))}
        </div>
      </div>

      <div style={s.body}>
        {tab === 'summary' && (
          <>
            <div style={s.row}><span style={s.label}>Azienda</span><span style={s.val}>{contact.organization || '—'}</span></div>
            <div style={s.row}><span style={s.label}>Telefono</span><span style={s.val}>{contact.phone}</span></div>
            <div style={s.actions}>
              <button style={s.btn} onClick={() => Client.getInstance().startCall(contact.phone)}>📞 Chiama</button>
              <button style={s.btn} onClick={() => window.open(contact.url, '_blank')}>Apri in Zoho</button>
            </div>
          </>
        )}

        {tab === 'calls' && (
          calls.length === 0
            ? <div style={s.empty}>Nessuna chiamata trovata</div>
            : calls.map(c => (
              <div key={c.id} style={s.card}>
                <div style={s.cardTitle}>{c.subject}</div>
                <div style={s.cardMeta}>{formatDate(c.startTime)} · durata {c.duration || '—'}</div>
                {c.note && <div style={{ ...s.cardMeta, marginTop: 6 }}>{c.note}</div>}
              </div>
            ))
        )}

        {tab === 'desk' && (
          tickets.length === 0
            ? <div style={s.empty}>Nessun ticket trovato</div>
            : tickets.map(t => (
              <div key={t.id} style={s.card}>
                <div style={s.cardTitle}>{t.subject}</div>
                <div style={{ ...s.badge, background: `${statusColor[t.status] ?? '#aaa'}22`, color: statusColor[t.status] ?? '#aaa' }}>
                  {t.status}
                </div>
                <div style={s.cardMeta}>{formatDate(t.createdTime)}</div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
