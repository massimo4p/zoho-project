import React, { useEffect, useState } from 'react';
import { s } from '../styles';
import { MAX_ITEMS, initialsOf, isMissed, callLabel, callIcon, relativeDate } from '../utils';
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

  return (
    <div style={s.wrap}>

      <div style={s.headCard}>
        <div style={s.avatarLd}>{initialsOf(contact.name)}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={s.nameRowLg}>
            <a href={contact.url} target="_blank" rel="noreferrer" style={s.nameLink}>{contact.name}</a>
            <a href={contact.url} target="_blank" rel="noreferrer" style={s.headLinkInline}>Apri in CRM ↗</a>
          </div>
          <div style={s.headLine}>
            <span style={s.pillLead}>LEAD</span>
            {lead?.status && <span style={s.pillLead}>{lead.status.toUpperCase()}</span>}
          </div>
          <div style={s.headMeta}>
            <span>{contact.organization}</span>
            <span>·</span>
            <span style={s.headPhone}>{contact.phone}</span>
            {lead?.owner && <><span>·</span><span>{lead.owner}</span></>}
          </div>
        </div>
      </div>

      <div style={s.body}>

        <div style={s.card}>
          <div style={s.secLbl}>Stato</div>
          <select style={s.select} value={status} onChange={e => { setStatus(e.target.value); setSaved(false); }}>
            <option value="">—</option>
            {statuses.map(st => <option key={st} value={st}>{st}</option>)}
          </select>

          <div style={s.secLbl}>Note</div>
          <textarea
            style={s.textarea}
            placeholder="Appunti sulla chiamata..."
            value={desc}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setDesc(e.target.value); setSaved(false); }}
          />
          {saved && <div style={s.success}>✓ Salvato</div>}
          <button style={s.btnPri} onClick={save} disabled={saving}>{saving ? '...' : 'Salva scheda'}</button>
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
