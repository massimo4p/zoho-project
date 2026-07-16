import React, { useEffect, useState } from 'react';
import { s } from '../styles';
import { MAX_ITEMS, formatDate, formatDuration, initialsOf } from '../utils';
import { updateLead } from '../api';
import type { Contact, Lead, Call } from '../types';

interface Props {
  contact: Contact;
  lead: Lead | null;
  calls: Call[];
  statuses: string[];
}

export default function LeadView({ contact, lead, calls, statuses }: Props) {
  const [status, setStatus] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setStatus(lead?.status ?? '');
    setDesc(lead?.description ?? '');
    setSaved(false);
  }, [lead?.id, lead?.status, lead?.description]);

  const save = async () => {
    if (!lead) return;
    setSaving(true);
    setSaved(false);
    const ok = await updateLead(lead.id, status, desc);
    setSaving(false);
    if (ok) setSaved(true);
  };

  const address = [
    lead?.street,
    [lead?.zip, lead?.city].filter(Boolean).join(' '),
    lead?.state ? `(${lead.state})` : null,
  ].filter(Boolean).join(', ');

  return (
    <div style={s.wrap}>
      <div style={s.page}>

        <div style={s.side}>
          <div style={s.headMain}>
            <div style={s.avatarLd}>{initialsOf(contact.name)}</div>
            <div style={{ minWidth: 0 }}>
              <div style={s.name}>
                <a href={contact.url} target="_blank" rel="noreferrer" style={s.nameLink}>{contact.name}</a>
              </div>
              <div style={s.sub}>{contact.organization}</div>
              <div style={s.sub}>{contact.phone}</div>
            </div>
          </div>

          <div style={s.chips}>
            <span style={s.chipLead}>Lead</span>
            {lead?.status && <span style={s.chipLead}>{lead.status}</span>}
          </div>

          <div style={s.secTitle}><span>Stato e note</span></div>
          <select style={s.select} value={status} onChange={e => { setStatus(e.target.value); setSaved(false); }}>
            <option value="">—</option>
            {statuses.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
          <textarea
            style={s.textarea}
            placeholder="Appunti sulla chiamata..."
            value={desc}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setDesc(e.target.value); setSaved(false); }}
          />
          {saved && <div style={s.success}>✓ Salvato</div>}
          <div style={s.actions}>
            <button style={s.btnPri} onClick={save} disabled={saving}>{saving ? '...' : 'Salva'}</button>
          </div>

          <div style={s.secSpace}>
            <div style={s.secTitle}>
              <span>Dettagli</span>
              <a style={s.secLink} href={contact.url} target="_blank" rel="noreferrer">Apri ↗</a>
            </div>
            {lead?.owner && <div style={s.row}><span style={s.label}>Referente</span><span style={s.val}>{lead.owner}</span></div>}
            {lead?.source && <div style={s.row}><span style={s.label}>Origine</span><span style={s.val}>{lead.source}</span></div>}
            {lead?.email && <div style={s.row}><span style={s.label}>Email</span><span style={s.val}>{lead.email}</span></div>}
            {lead?.vat && <div style={s.row}><span style={s.label}>P. IVA</span><span style={s.val}>{lead.vat}</span></div>}
            {address && <div style={s.row}><span style={s.label}>Indirizzo</span><span style={s.val}>{address}</span></div>}
          </div>
        </div>

        <div style={s.main}>
          <div style={s.phoneGap} />
          <div style={s.colRight}>
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
  );
}
