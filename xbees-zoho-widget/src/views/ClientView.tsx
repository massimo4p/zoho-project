import React, { useState } from 'react';
import { s } from '../styles';
import { MAX_ITEMS, initialsOf, isOpen, isMissed, callLabel, callIcon, relativeDate, statusColor, deskAccountUrl, deskTicketUrl, formatDate } from '../utils';
import { createTicket as apiCreateTicket } from '../api';
import type { Contact, Company, Call, Ticket } from '../types';

function payStyle(v: string | null | undefined): React.CSSProperties {
  if (!v) return s.scWarn;
  const t = v.toLowerCase();
  if (t === 'si' || t.includes('ok') || t.includes('regolare')) return s.scOk;
  if (t.includes('verifica') || t.includes('sospeso') || t.includes('attesa')) return s.scWarn;
  return s.scBad;
}

function capFirst(v: string | null | undefined): string {
  if (!v) return '—';
  const t = v.toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

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
  const statoAttiva = company?.stato === 'Attiva';
  const payTone = payStyle(company?.pagamenti);
  const barColor =
    company?.blocco || payTone === s.scBad || !statoAttiva ? '#D64545'
    : payTone === s.scWarn ? '#E0A32E'
    : '#3CB27E';
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

      <div style={{ ...s.headCard, borderLeft: `4px solid ${barColor}`, borderRadius: '0 14px 14px 0' }}>
        <div style={s.avatarLg}>{initialsOf(contact.name)}</div>
        <div style={{ flexShrink: 0 }}>
          <div style={s.nameRowLg}>
            <a href={contact.url} target="_blank" rel="noreferrer" style={s.nameLink}>{contact.name}</a>
            <a href={company?.url ?? contact.url} target="_blank" rel="noreferrer" style={s.headLinkInline}>Apri in CRM ↗</a>
          </div>
          <div style={s.headMeta}>
            <span>{contact.organization}</span>
            <span>·</span>
            <span style={s.headPhone}>{contact.phone}</span>
            {company?.vat && <><span>·</span><span>P.IVA {company.vat}</span></>}
          </div>
        </div>
        <div style={s.statGroup}>
          <div style={s.statRow}>
            <span style={s.statRowLbl}>Stato</span>
            <span style={{ ...s.statPill, ...(statoAttiva ? s.scOk : s.scBad) }}>{capFirst(company?.stato)}</span>
          </div>
          <div style={s.statRow}>
            <span style={s.statRowLbl}>Pagamenti</span>
            <span style={{ ...s.statPill, ...payStyle(company?.pagamenti) }}>{capFirst(company?.pagamenti)}</span>
          </div>
          <div style={s.statRow}>
            <span style={s.statRowLbl}>Blocco</span>
            <span style={{ ...s.statPill, ...(company?.blocco ? s.scBad : s.scOk) }}>{company?.blocco ? 'Amministrativo' : 'No'}</span>
          </div>
        </div>
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
              <div style={s.callGrid}>
                {tickets.length === 0 ? (
                  <div style={s.emptyBox}>Nessun ticket</div>
                ) : (
                  tickets.slice(0, MAX_ITEMS).map(t => (
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
              {tickets.length > MAX_ITEMS && (
                <a style={s.seeAll} href={deskUrl} target="_blank" rel="noreferrer">Vedi tutti in Desk ↗</a>
              )}
            </>
          )}
        </div>

        <div style={s.card}>
          <div style={s.secHead}>
            <div style={{ ...s.secLbl, marginBottom: 0 }}>Chiamate</div>
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
                      {missed
                        ? <div style={s.callMiss}>Non risposta</div>
                        : <div style={s.callDur}>{c.duration}</div>}
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

        <div style={s.cardFree}>
          <div style={s.freeLbl}>spazio disponibile</div>
        </div>

      </div>
    </div>
  );
}
