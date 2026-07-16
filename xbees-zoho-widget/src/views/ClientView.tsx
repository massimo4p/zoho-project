import React, { useState } from 'react';
import { s } from '../styles';
import { MAX_ITEMS, formatDate, formatDuration, initialsOf, isOpen, statusColor, deskAccountUrl, deskTicketUrl } from '../utils';
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
      <div style={s.page}>

        <div style={s.side}>
          <div style={s.headMain}>
            <div style={s.avatar}>{initialsOf(contact.name)}</div>
            <div style={{ minWidth: 0 }}>
              <div style={s.name}>
                <a href={contact.url} target="_blank" rel="noreferrer" style={s.nameLink}>{contact.name}</a>
              </div>
              <div style={s.sub}>{contact.organization}</div>
              <div style={s.sub}>{contact.phone}</div>
            </div>
          </div>

          <div style={s.chips}>
            {company?.stato && <span style={statoAttiva ? s.chipOk : s.chipBad}>{company.stato}</span>}
            {company?.pagamenti && (
              <span style={pagamentiOk ? s.chipOk : s.chipBad}>
                {pagamentiOk ? 'Pagamenti in regola' : `Pagamenti: ${company.pagamenti}`}
              </span>
            )}
            {company?.blocco && <span style={s.chipBad}>Blocco amministrativo</span>}
          </div>

          {done && <div style={s.success}>✓ Ticket creato</div>}

          {showForm ? (
            <div>
              <div style={s.secTitle}><span>Nuovo ticket</span></div>
              <input style={s.input} placeholder="Oggetto *" value={subject} onChange={e => setSubject(e.target.value)} />
              <textarea
                style={s.textarea}
                placeholder="Descrizione (opzionale)"
                value={desc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDesc(e.target.value)}
              />
              <div style={s.actions}>
                <button style={s.btnGh} onClick={() => setShowForm(false)}>Annulla</button>
                <button style={s.btnPri} onClick={submit} disabled={saving}>{saving ? '...' : 'Crea'}</button>
              </div>
            </div>
          ) : (
            <button style={{ ...s.btn, marginTop: 0 }} onClick={() => { setShowForm(true); setDone(false); }}>
              Nuovo ticket
            </button>
          )}

          {company && (
            <div style={s.secSpace}>
              <div style={s.secTitle}>
                <span>Azienda</span>
                <a style={s.secLink} href={company.url} target="_blank" rel="noreferrer">Apri ↗</a>
              </div>
              {company.owner && <div style={s.row}><span style={s.label}>Referente</span><span style={s.val}>{company.owner}</span></div>}
              {company.vat && <div style={s.row}><span style={s.label}>P. IVA</span><span style={s.val}>{company.vat}</span></div>}
              {company.email && <div style={s.row}><span style={s.label}>Email</span><span style={s.val}>{company.email}</span></div>}
              {company.phone && <div style={s.row}><span style={s.label}>Telefono</span><span style={s.val}>{company.phone}</span></div>}
              {company.scadenza && <div style={s.row}><span style={s.label}>Scad. contratto</span><span style={s.val}>{company.scadenza}</span></div>}
            </div>
          )}
        </div>

        <div style={s.main}>
          <div style={s.phoneGap} />
          <div style={s.colRight}>
            <div style={s.secTitle}>
              <span>Ticket ({tickets.length}{openTickets > 0 ? ` · ${openTickets} aperti` : ''})</span>
              {tickets.length > 0 && (
                <a style={s.secLink} href={deskUrl} target="_blank" rel="noreferrer">Tutti ↗</a>
              )}
            </div>
            {tickets.length === 0 ? (
              <div style={s.emptyBox}>Nessun ticket</div>
            ) : (
              <div style={s.grid}>
                {tickets.slice(0, MAX_ITEMS).map(t => (
                  <a key={t.id} href={deskTicketUrl(t.id)} target="_blank" rel="noreferrer" style={s.cardLink}>
                    <div style={s.cardTitle}>{t.subject}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                      <div style={{ ...s.badge, background: `${statusColor[t.status] ?? '#aaa'}22`, color: statusColor[t.status] ?? '#aaa' }}>
                        {t.status}
                      </div>
                      {t.channel && <div style={{ ...s.badge, background: '#f0f0f0', color: '#888' }}>{t.channel}</div>}
                    </div>
                    <div style={s.cardMeta}>{formatDate(t.createdTime)}</div>
                  </a>
                ))}
              </div>
            )}

            <div style={s.secSpace}>
              <div style={s.secTitle}>
                <span>Chiamate ({calls.length})</span>
                {calls.length > MAX_ITEMS && (
                  <a style={s.secLink} href={contact.url} target="_blank" rel="noreferrer">Tutte ↗</a>
                )}
              </div>
              {calls.length === 0 ? (
                <div style={s.emptyBox}>Nessuna chiamata</div>
              ) : (
                <div style={s.grid}>
                  {calls.slice(0, MAX_ITEMS).map(c => (
                    <div key={c.id} style={s.card}>
                      <div style={s.cardTitle}>{c.subject}</div>
                      <div style={s.cardMeta}>
                        {formatDate(c.startTime)}{formatDuration(c.duration) && ` · ${c.duration}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
