import React from 'react';
import { s } from '../styles';
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
  const style = pill === 'ok' ? s.pillOk : pill === 'bad' ? s.pillBad : undefined;
  return (
    <div style={s.pvRow}>
      <span style={s.pvKey}>{label}</span>
      {style ? <span style={style}>{value}</span> : <span style={s.pvVal}>{value}</span>}
    </div>
  );
}

export default function PreviewView({ loading, contact, company, lead }: Props) {
  if (loading) {
    return <div style={{ ...s.pvCol, alignItems: 'center' }}>Caricamento...</div>;
  }

  if (!contact) {
    return (
      <div style={{ ...s.pvCol, alignItems: 'center' }}>
        <div style={s.empty}>Nessun contatto Zoho</div>
      </div>
    );
  }

  const isLead = contact.module === 'Leads';

  // --- Account/Contatto con azienda: mostra dati pagamenti ---
  if (company) {
    return (
      <div style={s.pvCol}>
        <div style={s.pvHead}>
          <div>
            <a style={s.pvTitle} href={company.url} target="_blank" rel="noreferrer">
              {company.name || '—'} ↗
            </a>
            {company.vat && <div style={s.pvSub}>P.IVA {company.vat}</div>}
          </div>
        </div>
        <div style={s.pvRows}>
          {company.pagamenti != null && company.pagamenti !== '' && (
            <Row label="Pagamenti" value={company.pagamenti} />
          )}
          {company.scadenza && <Row label="Scadenza" value={company.scadenza} />}
          {company.stato && <Row label="Stato" value={company.stato} />}
          <Row
            label="Blocco"
            value={company.blocco ? 'BLOCCATO' : 'OK'}
            pill={company.blocco ? 'bad' : 'ok'}
          />
        </div>
      </div>
    );
  }

  // --- Lead: nessun dato pagamento in Zoho, mostro info lead ---
  return (
    <div style={s.pvCol}>
      <div style={s.pvHead}>
        <div>
          <a style={s.pvTitle} href={contact.url} target="_blank" rel="noreferrer">
            {contact.name || '—'} ↗
          </a>
          <div style={s.pvSub}>{isLead ? 'Lead' : 'Contatto'}</div>
        </div>
      </div>
      <div style={s.pvRows}>
        {(lead?.company || contact.organization) && (
          <Row label="Azienda" value={lead?.company || contact.organization} />
        )}
        {lead?.status && <Row label="Stato lead" value={lead.status} />}
        {lead?.vat && <Row label="P.IVA" value={lead.vat} />}
      </div>
    </div>
  );
}
