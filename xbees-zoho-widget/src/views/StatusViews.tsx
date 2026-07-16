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
        <div style={{ fontSize: 13 }}>Creazione in corso...</div>
      </div>
    </div>
  );
}

export function CreatedFallbackView({ url }: { url: string }) {
  return (
    <div style={s.wrap}>
      <div style={s.center}>
        <div style={{ fontSize: 22, color: '#1a9e6f', marginBottom: 8 }}>✓</div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Record creato</div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 4, marginBottom: 16 }}>Non riesco a caricare la scheda</div>
        <a href={url} target="_blank" rel="noreferrer" style={{ ...s.btnGh, padding: '8px 16px', flex: 'none' }}>Apri in Zoho ↗</a>
      </div>
    </div>
  );
}

export function NoContactView() {
  return <div style={s.wrap}><div style={s.empty}>Nessun contatto Zoho trovato</div></div>;
}
