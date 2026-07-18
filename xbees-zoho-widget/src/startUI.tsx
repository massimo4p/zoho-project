import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { log } from './logger';

export function startUI() {
  const root = document.getElementById('root');
  log.info('startUI: root found?', !!root);
  if (!root) { log.error('startUI: #root missing'); return; }
  try {
    createRoot(root).render(<App />);
    log.info('startUI: App rendered');
  } catch (e: any) {
    log.error('startUI: render failed', e?.message ?? e);
  }
}
