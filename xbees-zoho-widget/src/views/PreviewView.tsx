import React from 'react';
import { s } from '../styles';
import { deskAccountUrl } from '../utils';
import type { Contact } from '../types';

interface Props {
  loading: boolean;
  contact: Contact | null;
  callsCount: number;
  openTickets: number;
  deskAccountId: string | null;
}

export default function PreviewView({ loading, contact, callsCount, openTickets, deskAccountId }: Props) {
  if (loading) {
    return <div style={{ ...s.pvWrap, alignItems: 'center', justifyContent: 'center' }}>Caricamento...</div>;
  }

  if (!contact) {
    return (
      <div style={{ ...s.pvWrap, alignItems: 'center', justifyContent: 'center' }}>
        <div style={s.empty}>Nessun contatto Zoho</div>
      </div>
    );
  }

  return (
    <div style={s.pvWrap}>
      <a style={s.pvTile} href={contact.url} target="_blank" rel="noreferrer">
        <div style={s.pvNum}>{callsCount}</div>
        <div style={s.pvLbl}>Chiamate</div>
        <div style={s.pvArrow}>Apri in CRM ↗</div>
      </a>
      <a style={s.pvTile} href={deskAccountUrl(deskAccountId)} target="_blank" rel="noreferrer">
        <div style={{ ...s.pvNum, color: openTickets > 0 ? '#e08a00' : '#1a9e6f' }}>{openTickets}</div>
        <div style={s.pvLbl}>Ticket aperti</div>
        <div style={s.pvArrow}>Apri in Desk ↗</div>
      </a>
    </div>
  );
}
