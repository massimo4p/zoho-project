import React, { useEffect, useState } from 'react';
import { s } from '../styles';
import { searchAccounts } from '../api';
import type { AccountOption, NewRecordData } from '../types';

interface Props {
  phone: string;
  onCreate: (data: NewRecordData) => void;
}

export default function NewRecordView({ phone, onCreate }: Props) {
  const [type, setType] = useState<'Leads' | 'Contacts'>('Leads');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [company, setCompany] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [options, setOptions] = useState<AccountOption[]>([]);

  useEffect(() => {
    if (type !== 'Contacts' || company.length < 2 || accountId) {
      setOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      setOptions(await searchAccounts(company));
    }, 300);
    return () => clearTimeout(t);
  }, [company, type, accountId]);

  const canSubmit = last.trim() !== '' && !(type === 'Contacts' && !accountId);

  const submit = () => {
    if (!canSubmit) return;
    onCreate({
      type,
      firstName: first || undefined,
      lastName: last,
      phone,
      company: company || undefined,
      accountId: type === 'Contacts' ? accountId : undefined,
      role: role || undefined,
      email: email || undefined,
    });
  };

  return (
    <div style={s.wrap}>

      <div style={{ ...s.headCard, borderLeft: '4px solid #E0A32E', borderRadius: '0 14px 14px 0' }}>
        <div style={s.avatarUnknown}>?</div>
        <div style={{ minWidth: 0 }}>
          <div style={s.nameLg}>Numero sconosciuto</div>
          <div style={s.headMeta}>
            <span style={s.headPhone}>{phone}</span>
            <span>·</span>
            <span>non presente in Zoho CRM</span>
          </div>
        </div>
      </div>

      <div style={s.body}>
        <div style={{ ...s.card, overflowY: 'auto' }}>
          <div style={s.secLbl}>Aggiungi in rubrica</div>

          <div style={s.typeToggle}>
            <button
              style={type === 'Leads' ? s.toggleOn : s.toggleOff}
              onClick={() => { setType('Leads'); setAccountId(null); }}
            >Lead</button>
            <button
              style={type === 'Contacts' ? s.toggleOn : s.toggleOff}
              onClick={() => { setType('Contacts'); setAccountId(null); }}
            >Contatto</button>
          </div>

          <label style={s.formLbl}>Nome</label>
          <input style={s.input} value={first} onChange={e => setFirst(e.target.value)} />

          <label style={s.formLbl}>Cognome *</label>
          <input style={s.input} value={last} onChange={e => setLast(e.target.value)} />

          <label style={s.formLbl}>Azienda</label>
          <div style={s.acWrap}>
            <input
              style={{ ...s.input, marginBottom: 0 }}
              value={company}
              onChange={e => { setCompany(e.target.value); setAccountId(null); }}
              placeholder={type === 'Contacts' ? 'Cerca azienda esistente' : 'Nome azienda'}
            />
            {type === 'Contacts' && options.length > 0 && (
              <div style={s.acList}>
                {options.map(o => (
                  <div
                    key={o.id}
                    style={s.acItem}
                    onClick={() => { setCompany(o.name); setAccountId(o.id); setOptions([]); }}
                  >
                    {o.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          {type === 'Contacts' && company && !accountId && (
            <div style={s.warn}>Seleziona un'azienda dall'elenco</div>
          )}

          <label style={s.formLbl}>Ruolo</label>
          <input style={s.input} value={role} onChange={e => setRole(e.target.value)} />

          <label style={s.formLbl}>Email</label>
          <input style={s.input} value={email} onChange={e => setEmail(e.target.value)} />

          <button style={s.btnPri} onClick={submit} disabled={!canSubmit}>
            Aggiungi in rubrica
          </button>
        </div>

        <div />
        <div />
      </div>
    </div>
  );
}
