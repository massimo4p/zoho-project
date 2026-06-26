import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

export function startUI() {
  const root = document.getElementById('root');
  if (!root) return;
  createRoot(root).render(<App />);
}
