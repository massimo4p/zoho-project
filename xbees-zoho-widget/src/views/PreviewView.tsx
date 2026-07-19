import React from 'react';
import { initialsOf } from '../utils';
import type { Contact, Company, Lead } from '../types';

interface Props {
  loading: boolean;
  contact: Contact | null;
  company: Company | null;
  lead: Lead | null;
  callsCount: number;
  openTickets: number;
  deskAccountId: string | null;
}

const c = {
  wrap:   { fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', background: '#fff', padding: '10px 12px', boxSizing: 'border-box' as const, display: 'flex', flexDirection: 'column' as const, gap: 8 },
  head:   { display: 'flex', alignItems: 'center', gap: 10 },
  av:     { width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, color: '#fff' },
  avLead: { background: 'linear-gradient(135deg,#F5C34B,#FBD87A)', color: '#5C3A05' },
  avAcc:  { background: 'linear-gradient(135deg,#6C63D8,#534AB7)' },
  mid:    { minWidth: 0, flex: 1 },
  nameRow:{ display: 'flex', alignItems: 'center', gap: 6 },
  name:   { fontSize: 14, fontWeight: 600, color: '#1a1a1a', textDecoration: 'none', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
  sub:    { fontSize: 11, color: '#999', marginTop: 1, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
  pill:   { fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 100, flexShrink: 0, letterSpacing: '0.02em' },
  pillLead:{ background: '#FDF3DF', color: '#8A5B08', border: '1px solid #F2DFAF' },
  pillOk: { background: '#E7F6F0', color: '#0F6E56', border: '1px solid #C7EADD' },
  pillBad:{ background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F3D2D2' },
  link:   { fontSize: 11, color: '#534AB7', textDecoration: 'none', flexShrink: 0, marginLeft: 'auto', whiteSpace: 'nowrap' as const },
  rows:   { display: 'flex', flexDirection: 'column' as const, gap: 0 },
  row:    { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '5px 0', borderBottom: '1px solid #F2F2F4', fontSize: 12 },
  key:    { color: '#999', flexShrink: 0 },
  val:    { color: '#1a1a1a', fontWeight: 600, textAlign: 'right' as const, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
  empty:  { color: '#aaa', fontSize: 12, textAlign: 'center' as const, padding: '16px 0' },
};

function Row({ k, v, tone }: { k: string; v: React.ReactNode; tone?: 'ok' | 'bad' }) {
  return (
    <div style={c.row}>
      <span style={c.key}>{k}</span>
      {tone
        ? <span style={{ ...c.pill, ...(tone === 'ok' ? c.pillOk : c.pillBad) }}>{v}</span>
        : <span style={c.val}>{v}</span>}
    </div>
  );
}

export default function PreviewView({ loading, contact, company, lead }: Props) {
  if (loading) return <div style={c.wrap}><div style={c.empty}>Caricamento…</div></div>;
  if (!contact) return <div style={c.wrap}><div style={c.empty}>Nessun contatto Zoho</div></div>;

  const isLead = contact.module === 'Leads';
  const title = company?.name || contact.name;
  const href = company?.url || contact.url;

  return (
    <div style={c.wrap}>
      <div style={c.head}>
        <div style={{ ...c.av, ...(isLead ? c.avLead : c.avAcc) }}>{initialsOf(title)}</div>
        <div style={c.mid}>
          <div style={c.nameRow}>
            <a href={href} target="_blank" rel="noreferrer" style={c.name}>{title}</a>
            {isLead && <span style={{ ...c.pill, ...c.pillLead }}>LEAD</span>}
            {company && (
              <span style={{ ...c.pill, ...(company.blocco ? c.pillBad : c.pillOk) }}>
                {company.blocco ? 'BLOCCATO' : 'ATTIVO'}
              </span>
            )}
          </div>
          <div style={c.sub}>{contact.phone}</div>
        </div>
        <a href={href} target="_blank" rel="noreferrer" style={c.link}>Apri in CRM ↗</a>
      </div>

      <div style={c.rows}>
        {company ? (
          <>
            {company.pagamenti != null && company.pagamenti !== '' && <Row k="Pagamenti" v={company.pagamenti} />}
            {company.scadenza && <Row k="Scadenza" v={company.scadenza} />}
            {company.stato && <Row k="Stato" v={company.stato} />}
            {company.vat && <Row k="P.IVA" v={company.vat} />}
            <Row k="Blocco" v={company.blocco ? 'BLOCCATO' : 'OK'} tone={company.blocco ? 'bad' : 'ok'} />
          </>
        ) : (
          <>
            {(lead?.company || contact.organization) && <Row k="Azienda" v={lead?.company || contact.organization} />}
            {lead?.status && <Row k="Stato lead" v={lead.status} />}
            {lead?.vat && <Row k="P.IVA" v={lead.vat} />}
            {lead?.email && <Row k="Email" v={lead.email} />}
          </>
        )}
      </div>
    </div>
  );
}
