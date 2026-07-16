import React from 'react';

export const PHONE_BAR_HEIGHT = 400;
export const SIDE_WIDTH = 380;

export const s: Record<string, React.CSSProperties> = {
  wrap:      { fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', fontSize: 13, color: '#1a1a1a', minHeight: '100vh', background: '#fff' },

  page:      { display: 'flex', minHeight: '100vh', alignItems: 'stretch' },
  side:      { width: SIDE_WIDTH, flexShrink: 0, padding: 16, borderRight: '1px solid #eee', boxSizing: 'border-box' as const },
  main:      { flex: 1, minWidth: 0 },
  phoneGap:  { height: PHONE_BAR_HEIGHT },

  headMain:  { display: 'flex', gap: 12, alignItems: 'center' },
  avatar:    { width: 44, height: 44, borderRadius: '50%', background: '#534AB7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, flexShrink: 0 },
  avatarLd:  { width: 44, height: 44, borderRadius: '50%', background: '#FAEEDA', color: '#854F0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, flexShrink: 0 },
  name:      { fontSize: 16, fontWeight: 600 },
  nameLink:  { color: '#1a1a1a', textDecoration: 'none' },
  sub:       { fontSize: 12, color: '#888', marginTop: 2 },

  chips:     { display: 'flex', gap: 6, margin: '10px 0 16px', flexWrap: 'wrap' as const },
  chipOk:    { background: '#E1F5EE', color: '#0F6E56', fontSize: 11, padding: '2px 7px', borderRadius: 6, whiteSpace: 'nowrap' as const },
  chipBad:   { background: '#FCEBEB', color: '#A32D2D', fontSize: 11, padding: '2px 7px', borderRadius: 6, whiteSpace: 'nowrap' as const },
  chipLead:  { background: '#FAEEDA', color: '#854F0B', fontSize: 11, padding: '2px 7px', borderRadius: 6, whiteSpace: 'nowrap' as const },

  secTitle:  { fontSize: 11, fontWeight: 600, color: '#999', letterSpacing: 0.5, textTransform: 'uppercase' as const, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  secLink:   { fontSize: 11, color: '#534AB7', textDecoration: 'none', textTransform: 'none' as const, letterSpacing: 0, fontWeight: 400 },
  secSpace:  { marginTop: 18 },

  colRight:  { padding: '14px 16px' },
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 6 },
  list:      { display: 'flex', flexDirection: 'column', gap: 6 },

  row:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '5px 0', borderBottom: '1px solid #f4f4f4', fontSize: 12 },
  label:     { color: '#999', flexShrink: 0 },
  val:       { textAlign: 'right' as const, minWidth: 0, wordBreak: 'break-word' as const },

  card:      { border: '1px solid #eee', borderRadius: 8, padding: '8px 10px' },
  cardLink:  { border: '1px solid #eee', borderRadius: 8, padding: '8px 10px', textDecoration: 'none', display: 'block', color: 'inherit', cursor: 'pointer' },
  cardTitle: { fontSize: 12, fontWeight: 500 },
  cardMeta:  { fontSize: 11, color: '#aaa', marginTop: 2 },
  badge:     { fontSize: 11, padding: '2px 7px', borderRadius: 20, display: 'inline-block', marginTop: 4 },

  emptyBox:  { border: '1px dashed #e5e5e5', borderRadius: 8, padding: 20, textAlign: 'center' as const, fontSize: 12, color: '#aaa' },
  empty:     { color: '#aaa', textAlign: 'center' as const, marginTop: 40, fontSize: 13 },

  btn:       { width: '100%', padding: '8px 0', borderRadius: 6, border: '1px solid #534AB7', background: 'transparent', color: '#534AB7', fontSize: 12, cursor: 'pointer', marginTop: 14 },
  btnPri:    { flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid #534AB7', background: '#534AB7', color: '#fff', fontSize: 12, cursor: 'pointer' },
  btnGh:     { flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid #ddd', background: 'transparent', color: '#888', fontSize: 12, cursor: 'pointer', textAlign: 'center' as const, textDecoration: 'none' },
  actions:   { display: 'flex', gap: 8, marginTop: 8 },

  input:     { width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12, marginBottom: 8, boxSizing: 'border-box' as const },
  select:    { width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12, marginBottom: 8, boxSizing: 'border-box' as const, background: '#fff' },
  textarea:  { width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12, marginBottom: 8, boxSizing: 'border-box' as const, resize: 'vertical' as const, minHeight: 110 },
  formLbl:   { fontSize: 11, color: '#888', marginBottom: 4, display: 'block' },
  formWrap:  { padding: 16, width: SIDE_WIDTH, boxSizing: 'border-box' as const },
  success:   { color: '#1a9e6f', fontSize: 12, padding: '4px 0' },
  warn:      { fontSize: 11, color: '#e08a00', marginBottom: 8 },

  acWrap:    { position: 'relative' as const, marginBottom: 8 },
  acList:    { position: 'absolute' as const, top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: 6, maxHeight: 160, overflowY: 'auto' as const, zIndex: 10, marginTop: -6 },
  acItem:    { padding: '7px 10px', fontSize: 12, cursor: 'pointer', borderBottom: '1px solid #f4f4f4' },

  spinner:   { width: 26, height: 26, border: '3px solid #eee', borderTopColor: '#534AB7', borderRadius: '50%', animation: 'zspin 0.8s linear infinite', margin: '0 auto 12px' },
  center:    { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' as const },

  pvWrap:    { fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', height: '100vh', display: 'flex', flexDirection: 'row', gap: 8, padding: 10, background: '#fff', boxSizing: 'border-box' as const },
  pvTile:    { flex: 1, border: '1px solid #eee', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none', color: 'inherit' },
  pvNum:     { fontSize: 28, fontWeight: 700, color: '#534AB7', lineHeight: 1 },
  pvLbl:     { fontSize: 12, color: '#888', marginTop: 6 },
  pvArrow:   { fontSize: 11, color: '#bbb', marginTop: 4 },
};
