import React from 'react';
import { s } from '../styles';

export function LoadingView() {
  return <div style={s.wrap}><div style={s.center}>Caricamento...</div></div>;
}

export function CreatingView() {
  return (
    <div style={s.wrap}>
      <style>{`@keyframes zspin { to { transform: rotate(360deg); } }`}</style>
      <div style={s.center}>
        <div style={s.spinner} />
        <div style={{ fontSize: 12 }}>Creazione in corso...</div>
      </div>
    </div>
  );
}

export function CreatedFallbackView({ url }: { url: string }) {
  return (
    <div style={s.wrap}>
      <div style={s.center}>
        <div style={{ fontSize: 20, color: '#1a9e6f', marginBottom: 6 }}>✓</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Record creato</div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 3, marginBottom: 12 }}>Non riesco a caricare la scheda</div>
        <a href={url} target="_blank" rel="noreferrer" style={{ ...s.btnGh, width: 'auto', padding: '8px 16px' }}>Apri in Zoho ↗</a>
      </div>
    </div>
  );
}

export function NoContactView() {
  return <div style={s.wrap}><div style={s.center}><div style={s.empty}>Nessun contatto Zoho trovato</div></div></div>;
}
