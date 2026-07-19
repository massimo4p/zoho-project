import React, { useEffect, useState } from 'react';
import { initialsOf } from '../utils';
import { updateLead } from '../api';
import type { Contact, Company, Lead } from '../types';

interface Props {
  loading: boolean;
  contact: Contact | null;
  company: Company | null;
  lead: Lead | null;
  statuses: string[];
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
  ctrl:   { display: 'flex', gap: 6, alignItems: 'center' },
  select: { flex: 1, background: '#FAFAFB', border: '1px solid #E8E8EA', borderRadius: 8, padding: '6px 8px', fontSize: 12, boxSizing: 'border-box' as const },
  ok:     { fontSize: 11, color: '#1a9e6f', flexShrink: 0 },
  noteBtn:{ display: 'block', textAlign: 'center' as const, background: '#fff', color: '#534AB7', border: '1px solid #E0DEF3', borderRadius: 8, padding: '7px 0', fontSize: 12, fontWeight: 600, textDecoration: 'none' },
  empty:  { color: '#aaa', fontSize: 12, textAlign: 'center' as const, padding: '16px 0' },
};

export default function PreviewView({ loading, contact, company, lead, statuses }: Props) {
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setStatus(lead?.status ?? '');
    setSaved(false);
  }, [lead?.id, lead?.status]);

  if (loading) return <div style={c.wrap}><div style={c.empty}>Caricamento…</div></div>;
  if (!contact) return <div style={c.wrap}><div style={c.empty}>Nessun contatto Zoho</div></div>;

  const isLead = contact.module === 'Leads';
  const title = company?.name || contact.name;
  const href = company?.url || contact.url;

  const saveStatus = async (newStatus: string) => {
    setStatus(newStatus);
    setSaved(false);
    if (!lead) return;
    setSaving(true);
    const ok = await updateLead(lead.id, newStatus, lead.description ?? '');
    setSaving(false);
    if (ok) setSaved(true);
  };

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

      {isLead ? (
        <>
          <div style={c.ctrl}>
            <select style={c.select} value={status} onChange={e => saveStatus(e.target.value)} disabled={saving || !lead}>
              <option value="">— Stato lead —</option>
              {statuses.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
            {saving ? <span style={c.ok}>…</span> : saved ? <span style={c.ok}>✓</span> : null}
          </div>
          <div style={c.rows}>
            {(lead?.company || contact.organization) && (
              <div style={c.row}><span style={c.key}>Azienda</span><span style={c.val}>{lead?.company || contact.organization}</span></div>
            )}
          </div>
          <a href={contact.url} target="_blank" rel="noreferrer" style={c.noteBtn}>+ Aggiungi note in CRM ↗</a>
        </>
      ) : (
        <div style={c.rows}>
          {company?.pagamenti != null && company.pagamenti !== '' && (
            <div style={c.row}><span style={c.key}>Pagamenti</span><span style={c.val}>{company.pagamenti}</span></div>
          )}
          {company?.scadenza && <div style={c.row}><span style={c.key}>Scadenza</span><span style={c.val}>{company.scadenza}</span></div>}
          {company?.stato && <div style={c.row}><span style={c.key}>Stato</span><span style={c.val}>{company.stato}</span></div>}
          {company?.vat && <div style={c.row}><span style={c.key}>P.IVA</span><span style={c.val}>{company.vat}</span></div>}
          {company && (
            <div style={c.row}>
              <span style={c.key}>Blocco</span>
              <span style={{ ...c.pill, ...(company.blocco ? c.pillBad : c.pillOk) }}>{company.blocco ? 'BLOCCATO' : 'OK'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
