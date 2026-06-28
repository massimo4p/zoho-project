import React, { useEffect, useState } from 'react';
import Client from '@wildix/xbees-connect';

const BACKEND = (import.meta as any).env?.VITE_BACKEND_URL ?? '';

interface Contact {
  name: string;
  organization: string;
  phone: string;
  url: string;
  id?: string;
}

interface Deal {
  id: string;
  name: string;
  amount: number;
  stage: string;
  closingDate: string;
  url: string;
}

type Tab = 'summary' | 'deals' | 'activity' | 'tasks';

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
  link:      { color: '#534AB7', textDecoration: 'none', fontSize: 12, display: 'inline-block', marginTop: 12 },
  deal:      { border: '1px solid #eee', borderRadius: 8, padding: '10px 12px', marginBottom: 8 },
  dealName:  { fontWeight: 500, fontSize: 13 },
  dealAmt:   { fontWeight: 500, color: '#1a9e6f', fontSize: 13 },
  bar:       { height: 3, background: '#eee', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  fill:      { height: '100%', background: '#534AB7', borderRadius: 2 },
  badge:     { fontSize: 11, padding: '2px 7px', borderRadius: 20, background: '#eeedfE', color: '#534AB7', marginTop: 4, display: 'inline-block' },
  empty:     { color: '#aaa', textAlign: 'center' as const, marginTop: 40, fontSize: 13 },
  actions:   { display: 'flex', gap: 8, marginTop: 12 },
  btn:       { flex: 1, padding: '7px 0', borderRadius: 6, border: '1px solid #534AB7', background: 'transparent', color: '#534AB7', fontSize: 12, cursor: 'pointer' },
};

const stagePercent: Record<string, number> = {
  'Qualification': 20, 'Needs Analysis': 35, 'Value Proposition': 50,
  'Proposal': 65, 'Negotiation': 80, 'Closed Won': 100, 'Closed Lost': 100,
};

export default function App() {
  const [contact, setContact] = useState<Contact | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tab, setTab] = useState<Tab>('summary');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Client.getInstance().ready();

    const tryLookup = async (phone: string) => {
      const r = await fetch(`${BACKEND}/api/zoho/contacts/lookup?phone=${encodeURIComponent(phone)}`);
      const data = await r.json();
      setContact(data);
      if (data?.id) {
  	const endpoint = data.module === 'Accounts' ? `/api/zoho/deals/account/${data.id}`: `/api/zoho/deals/contact/${data.id}`;
  	const dr = await fetch(`${BACKEND}${endpoint}`);
  	setDeals(await dr.json());
	}
    };

    Client.getInstance().getCurrentContact().then(async (res: any) => {
      const phone = res?.payload?.phone ?? res?.payload?.phones?.[0];
      if (phone) {
        try { await tryLookup(phone); } catch(e) { console.error(e); }
        setLoading(false);
        return;
      }

      Client.getInstance().getAvailableContactData().then(async (res2: any) => {
        const phones = res2?.payload?.phones ?? [];
        if (phones.length > 0) {
          try { await tryLookup(phones[0]); } catch(e) { console.error(e); }
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ ...s.wrap, alignItems: 'center', justifyContent: 'center' }}>Caricamento...</div>;
  if (!contact) return <div style={s.wrap}><div style={s.empty}>Nessun contatto Zoho trovato</div></div>;

  const initials = contact.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={s.wrap}>
      <div
