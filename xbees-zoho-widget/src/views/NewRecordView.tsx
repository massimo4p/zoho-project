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
      <div style={s.headCard}>
        <div style={{ minWidth: 0 }}>
          <div style={s.name}>Numero sconosciuto</div>
          <div style={s.headLine}>
            <span style={s.headSub}><span style={s.headPhone}>{phone}</span></span>
          </div>
        </div>
      </div>

      <div style={{ ...s.body, gridTemplateColumns: '1fr 1.5fr' }}>
        <div style={{ ...s.card, overflowY: 'auto' }}>
          <div style={s.secLbl}>Aggiungi in rubrica</div>

          <label style={s.formLbl}>Tipo</label>
          <select
            style={s.select}
            value={type}
            onChange={e => { setType(e.target.value as 'Leads' | 'Contacts'); setAccountId(null); }}
          >
            <option value="Leads">Lead</option>
            <option value="Contacts">Contatto</option>
          </select>

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
      </div>
    </div>
  );
}
