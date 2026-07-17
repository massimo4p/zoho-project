import React, { useState } from 'react';
import { s } from '../styles';
import { MAX_ITEMS, initialsOf, isOpen, isMissed, callLabel, callIcon, relativeDate, statusColor, deskAccountUrl, deskTicketUrl, formatDate } from '../utils';
import { createTicket as apiCreateTicket } from '../api';
import type { Contact, Company, Call, Ticket } from '../types';

interface Props {
  contact: Contact;
  company: Company | null;
  calls: Call[];
  tickets: Ticket[];
  deskAccountId: string | null;
}

export default function ClientView({ contact, company, calls, tickets, deskAccountId }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const openTickets = tickets.filter(t => isOpen(t.status)).length;
  const pagamentiOk = company?.pagamenti === 'SI';
  const statoAttiva = company?.stato === 'Attiva';
  const deskUrl = deskAccountUrl(deskAccountId);

  const submit = async () => {
    if (!subject.trim()) return;
    setSaving(true);
    const ok = await apiCreateTicket(subject, desc, contact.name, contact.phone);
    setSaving(false);
    if (ok) {
      setDone(true);
      setShowForm(false);
      setSubject('');
      setDesc('');
    }
  };

  return (
    <div style={s.wrap}>

      <div style={s.headCard}>
        <div style={s.avatar}>{initialsOf(contact.name)}</div>
        <div style={{ minWidth: 0 }}>
          <div style={s.name}>
            <a href={contact.url} target="_blank" rel="noreferrer" style={s.nameLink}>{contact.name}</a>
          </div>
          <div style={s.headLine}>
            {company?.stato && <span style={statoAttiva ? s.pillOk : s.pillBad}>{company.stato.toUpperCase()}</span>}
            {company?.pagamenti && (
              <span style={pagamentiOk ? s.pillOk : s.pillBad}>
                {pagamentiOk ? 'PAGAMENTI OK' : `PAGAMENTI: ${company.pagamenti}`}
              </span>
            )}
            {company?.blocco && <span style={s.pillBad}>BLOCCO AMMIN.</span>}
            <span style={s.headSub}>
              {contact.organization} · <span style={s.headPhone}>{contact.phone}</span>
            </span>
            {company?.owner && <span style={s.headSub}>· {company.owner}</span>}
          </div>
        </div>
        <a href={company?.url ?? contact.url} target="_blank" rel="noreferrer" style={s.headLink}>Apri in CRM ↗</a>
      </div>

      <div style={s.body}>

        <div style={s.card}>
          <div style={s.secHead}>
            <div style={{ ...s.secLbl, marginBottom: 0 }}>Ticket</div>
            <span style={s.count}>{openTickets > 0 ? `${openTickets} APERTI` : `${tickets.length} TOTALI`}</span>
          </div>

          {showForm ? (
            <>
              <input style={s.input} placeholder="Oggetto *" value={subject} onChange={e => setSubject(e.target.value)} />
              <textarea
                style={s.textarea}
                placeholder="Descrizione (opzionale)"
                value={desc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDesc(e.target.value)}
              />
              <div style={s.actions}>
                <button style={s.btnGh} onClick={() => setShowForm(false)}>Annulla</button>
                <button style={{ ...s.btnPri, marginTop: 0 }} onClick={submit} disabled={saving}>{saving ? '...' : 'Crea'}</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ ...s.callGrid, gridTemplateColumns: '1fr' }}>
                {tickets.length === 0 ? (
                  <div style={s.emptyBox}>Nessun ticket</div>
                ) : (
                  tickets.slice(0, 4).map(t => (
                    <a key={t.id} href={deskTicketUrl(t.id)} target="_blank" rel="noreferrer" style={s.ticketCard}>
                      <div style={s.callTitle}>{t.subject}</div>
                      <div style={{ display: 'flex', gap: 5, marginTop: 3, alignItems: 'center' }}>
                        <span style={{ ...s.badge, background: `${statusColor[t.status] ?? '#aaa'}22`, color: statusColor[t.status] ?? '#aaa' }}>{t.status}</span>
                        <span style={s.callMeta}>{formatDate(t.createdTime)}</span>
                      </div>
                    </a>
                  ))
                )}
              </div>
              {done && <div style={s.success}>✓ Ticket creato</div>}
              <button style={s.btnPri} onClick={() => { setShowForm(true); setDone(false); }}>Nuovo ticket</button>
              {tickets.length > 4 && (
                <a style={s.seeAll} href={deskUrl} target="_blank" rel="noreferrer">Vedi tutti in Desk ↗</a>
              )}
            </>
          )}
        </div>

        <div style={s.card}>
          <div style={s.secHead}>
            <div style={{ ...s.secLbl, marginBottom: 0 }}>Cronologia chiamate</div>
            <span style={s.count}>{calls.length} TOTALI</span>
          </div>

          {calls.length === 0 ? (
            <div style={s.emptyBox}>Nessuna chiamata</div>
          ) : (
            <div style={s.callGrid}>
              {calls.slice(0, MAX_ITEMS).map(c => {
                const missed = isMissed(c);
                return (
                  <div key={c.id} style={s.callCard}>
                    <div style={missed ? s.callIconX : s.callIcon}>{callIcon(c)}</div>
                    <div style={s.callMain}>
                      <div style={s.callTitle}>{callLabel(c)}</div>
                      <div style={s.callMeta}>{relativeDate(c.startTime)}</div>
                    </div>
                    <div style={s.callRight}>
                      {missed ? (
                        <div style={s.callMiss}>Non risposta</div>
                      ) : (
                        <>
                          <div style={s.callDur}>{c.duration}</div>
                          <div style={s.callOk}>Conclusa</div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {calls.length > MAX_ITEMS && (
            <a style={s.seeAll} href={contact.url} target="_blank" rel="noreferrer">Vedi tutte in CRM ↗</a>
          )}
        </div>

      </div>
    </div>
  );
}
