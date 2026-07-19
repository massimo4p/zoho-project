import React from 'react';
import { s } from '../styles';
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

function Row({ label, value, pill }: { label: string; value: React.ReactNode; pill?: 'ok' | 'bad' }) {
  return (
    <div style={s.row}>
      <span style={s.label}>{label}</span>
      {pill
        ? <span style={pill === 'ok' ? s.pillOk : s.pillBad}>{value}</span>
        : <span style={s.val}>{value}</span>}
    </div>
  );
}

export default function PreviewView({ loading, contact, company, lead }: Props) {
  if (loading) {
    return <div style={s.wrap}><div style={s.center}><div style={s.spinner} />Caricamento...</div></div>;
  }

  if (!contact) {
    return <div style={s.wrap}><div style={s.center}><div style={s.empty}>Nessun contatto Zoho</div></div></div>;
  }

  const isLead = contact.module === 'Leads';
  const title = company?.name || contact.name;

  return (
    <div style={s.wrap}>

      <div style={s.headCard}>
        <div style={isLead ? s.avatarLd : s.avatar}>{initialsOf(title)}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={s.name}>
            <a href={company?.url || contact.url} target="_blank" rel="noreferrer" style={s.nameLink}>
              {title}
            </a>
          </div>
          <div style={s.headLine}>
            {isLead && <span style={s.pillLead}>LEAD</span>}
            {company && (
              <span style={company.blocco ? s.pillBad : s.pillOk}>
                {company.blocco ? 'BLOCCATO' : 'ATTIVO'}
              </span>
            )}
            <span style={s.headSub}>{contact.phone}</span>
          </div>
        </div>
        <a href={company?.url || contact.url} target="_blank" rel="noreferrer" style={s.headLink}>Apri in CRM ↗</a>
      </div>

      <div style={s.body}>
        <div style={{ ...s.card, gridColumn: '1 / -1' }}>
          {company ? (
            <>
              <div style={s.secLbl}>Situazione</div>
              {company.pagamenti != null && company.pagamenti !== '' && (
                <Row label="Pagamenti" value={company.pagamenti} />
              )}
              {company.scadenza && <Row label="Scadenza" value={company.scadenza} />}
              {company.stato && <Row label="Stato" value={company.stato} />}
              {company.vat && <Row label="P.IVA" value={company.vat} />}
              <Row label="Blocco" value={company.blocco ? 'BLOCCATO' : 'OK'} pill={company.blocco ? 'bad' : 'ok'} />
            </>
          ) : (
            <>
              <div style={s.secLbl}>Dati lead</div>
              {(lead?.company || contact.organization) && (
                <Row label="Azienda" value={lead?.company || contact.organization} />
              )}
              {lead?.status && <Row label="Stato lead" value={lead.status} />}
              {lead?.vat && <Row label="P.IVA" value={lead.vat} />}
              {lead?.email && <Row label="Email" value={lead.email} />}
            </>
          )}
        </div>
      </div>

    </div>
  );
}
