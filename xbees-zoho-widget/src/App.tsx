import React, { useEffect, useState } from 'react';
import Client from '@wildix/xbees-connect';
import { log } from './logger';

const BACKEND = (import.meta as any).env?.VITE_BACKEND_URL ?? '';
const VIEW = new URLSearchParams(window.location.search).get('v'); // 'ui' | 'f' | 'no-ui'
const IS_PREVIEW = VIEW === 'ui';

const DESK_BASE = 'https://desk.zoho.eu/agent/4personality';
const MAX_ITEMS = 10;

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
  textarea:   { width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12, marginBottom: 8, boxSizing: 'border-box' as const, resize: 'vertical' as const, minHeight: 80 },
  success:    { color: '#1a9e6f', fontSize: 12, padding: '8px 0' },
  seeAll:     { display: 'block', textAlign: 'center' as const, padding: '8px 0', fontSize: 12, color: '#534AB7', textDecoration: 'none', cursor: 'pointer' },
  pvWrap:     { fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', height: '100vh', display: 'flex', flexDirection: 'row', gap: 8, padding: 10, background: '#fff', boxSizing: 'border-box' as const },
  pvTile:     { flex: 1, border: '1px solid #eee', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none', color: 'inherit' },
  pvNum:      { fontSize: 28, fontWeight: 700, color: '#534AB7', lineHeight: 1 },
  pvLbl:      { fontSize: 12, color: '#888', marginTop: 6 },
  pvArrow:    { fontSize: 11, color: '#bbb', marginTop: 4 },
};

const statusColor: Record<string, string> = {
  'Open': '#1a9e6f', 'Aperto': '#1a9e6f',
  'Closed': '#aaa',  'Chiuso': '#aaa',
  'On Hold': '#e08a00', 'In attesa': '#e08a00',
  'In Progress': '#534AB7',
};

const isOpen = (status: string) => status !== 'Closed' && status !== 'Chiuso';

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
  const [tab, setTab] = useState<Tab>('summary');
  const [loading, setLoading] = useState(true);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketDone, setTicketDone] = useState(false);

  useEffect(() => {
    Client.getInstance().ready();

    let currentPhone: string | null = null;

    const clearAll = () => {
      currentPhone = null;
      setContact(null);
      setCompany(null);
      setCalls([]);
      setTickets([]);
      setDeskAccountId(null);
      setShowTicketForm(false);
      setTicketDone(false);
    };

    const
