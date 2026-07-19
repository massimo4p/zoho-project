import React from 'react';

export const s: Record<string, React.CSSProperties> = {
  wrap:      { fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', fontSize: 13, color: '#1a1a1a', height: '100vh', background: '#F6F6F7', boxSizing: 'border-box' as const, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' },

  // header: largo 76% cosi non finisce sotto la barra telefono
  headCard:  { background: '#fff', border: '1px solid #E8E8EA', borderRadius: 14, padding: '26px 22px', display: 'flex', alignItems: 'center', gap: 16, width: '100%', boxSizing: 'border-box' as const, flexShrink: 0 },
  avatarLg:  { width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(135deg,#6C63D8,#534AB7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 },
  nameLg:    { fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 8 },
  nameRowLg: { display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8, flexWrap: 'wrap' as const, fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' },
  headLinkInline: { fontSize: 13, fontWeight: 400, color: '#534AB7', textDecoration: 'none', flexShrink: 0 },
  headMeta:  { fontSize: 14, color: '#777', marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' },
  statRows:  { display: 'flex', flexDirection: 'column' as const, gap: 7, flexShrink: 0 },
  statRow:   { display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' },
  statRowLbl:{ fontSize: 13, color: '#777' },
  statPill:  { padding: '3px 14px', borderRadius: 100, fontSize: 13, fontWeight: 700, minWidth: 104, textAlign: 'center' as const },
  scOk:      { background: '#E7F6F0', color: '#0F6E56' },
  scWarn:    { background: '#FAEEDA', color: '#BA7517' },
  scBad:     { background: '#FCEBEB', color: '#A32D2D' },
  avatar:    { width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,#6C63D8,#534AB7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  avatarLd:  { width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,#F5C34B,#FBD87A)', color: '#5C3A05', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  name:      { fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' },
  nameLink:  { color: '#1a1a1a', textDecoration: 'none' },
  headLine:  { display: 'flex', gap: 6, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' as const },
  headSub:   { fontSize: 10, color: '#999' },
  headPhone: { color: '#1a1a1a' },
  headLink:  { fontSize: 10, color: '#534AB7', textDecoration: 'none', flexShrink: 0, marginLeft: 'auto' },

  pill:      { fontSize: 9, fontWeight: 600, padding: '1px 8px', borderRadius: 100 },
  pillLead:  { fontSize: 9, fontWeight: 600, padding: '1px 8px', borderRadius: 100, background: '#FDF3DF', color: '#8A5B08', border: '1px solid #F2DFAF' },
  pillOk:    { fontSize: 9, fontWeight: 600, padding: '1px 8px', borderRadius: 100, background: '#E7F6F0', color: '#0F6E56', border: '1px solid #C7EADD' },
  pillBad:   { fontSize: 9, fontWeight: 600, padding: '1px 8px', borderRadius: 100, background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F3D2D2' },

  body:      { flex: 1, display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: 8, minHeight: 0 },
  card:      { background: '#fff', border: '1px solid #E8E8EA', borderRadius: 14, padding: 12, display: 'flex', flexDirection: 'column', minHeight: 0 },

  secLbl:    { fontSize: 9, fontWeight: 600, color: '#999', letterSpacing: '0.06em', marginBottom: 6, textTransform: 'uppercase' as const },
  secHead:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  count:     { background: '#F2F2F4', fontSize: 9, padding: '2px 8px', borderRadius: 100, color: '#666' },

  select:    { width: '100%', background: '#FAFAFB', border: '1px solid #E8E8EA', borderRadius: 10, padding: '7px 10px', fontSize: 11, marginBottom: 10, boxSizing: 'border-box' as const },
  textarea:  { flex: 1, width: '100%', background: '#FAFAFB', border: '1px solid #E8E8EA', borderRadius: 10, padding: '8px 10px', fontSize: 11, lineHeight: 1.5, boxSizing: 'border-box' as const, resize: 'none' as const, minHeight: 0, fontFamily: 'inherit' },
  input:     { width: '100%', background: '#FAFAFB', border: '1px solid #E8E8EA', borderRadius: 10, padding: '7px 10px', fontSize: 11, marginBottom: 8, boxSizing: 'border-box' as const },
  btnPri:    { background: '#534AB7', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 0', textAlign: 'center' as const, fontSize: 11, fontWeight: 600, marginTop: 8, cursor: 'pointer', width: '100%' },
  btnGh:     { background: '#fff', color: '#666', border: '1px solid #E8E8EA', borderRadius: 10, padding: '8px 0', textAlign: 'center' as const, fontSize: 11, cursor: 'pointer', width: '100%', textDecoration: 'none', display: 'block', boxSizing: 'border-box' as const },
  actions:   { display: 'flex', gap: 6, marginTop: 8 },

  callGrid:  { display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' as const, minHeight: 0 },
  callCard:  { background: '#FAFAFB', border: '1px solid #EDEDEF', borderRadius: 10, padding: '7px 9px', display: 'flex', alignItems: 'center', gap: 8 },
  callIcon:  { width: 24, height: 24, background: '#EFEFF2', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 },
  callIconX: { width: 24, height: 24, background: '#FBEDED', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0, color: '#A32D2D' },
  callMain:  { flex: 1, minWidth: 0 },
  callTitle: { fontSize: 10, fontWeight: 600 },
  callMeta:  { fontSize: 9, color: '#999' },
  callRight: { textAlign: 'right' as const, flexShrink: 0 },
  callDur:   { fontSize: 10, fontWeight: 600 },
  callOk:    { fontSize: 8, color: '#1a9e6f' },
  callMiss:  { fontSize: 8, color: '#A32D2D' },

  ticketCard:{ background: '#FAFAFB', border: '1px solid #EDEDEF', borderRadius: 10, padding: '7px 9px', textDecoration: 'none', color: 'inherit', display: 'block' },
  badge:     { fontSize: 8, padding: '1px 6px', borderRadius: 100, display: 'inline-block' },

  row:       { display: 'flex', justifyContent: 'space-between', gap: 10, padding: '4px 0', borderBottom: '1px solid #F2F2F4', fontSize: 10 },
  label:     { color: '#999', flexShrink: 0 },
  val:       { textAlign: 'right' as const, minWidth: 0, wordBreak: 'break-word' as const },

  emptyBox:  { border: '1px dashed #E5E5E7', borderRadius: 10, padding: 16, textAlign: 'center' as const, fontSize: 10, color: '#aaa' },
  empty:     { color: '#aaa', textAlign: 'center' as const, fontSize: 12 },
  seeAll:    { fontSize: 9, color: '#534AB7', textDecoration: 'none', textAlign: 'center' as const, paddingTop: 6, display: 'block' },
  success:   { color: '#1a9e6f', fontSize: 10, padding: '4px 0' },
  warn:      { fontSize: 9, color: '#e08a00', marginBottom: 6 },
  formLbl:   { fontSize: 9, color: '#999', marginBottom: 3, display: 'block' },

  acWrap:    { position: 'relative' as const, marginBottom: 8 },
  acList:    { position: 'absolute' as const, top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: 8, maxHeight: 140, overflowY: 'auto' as const, zIndex: 10, marginTop: -6 },
  acItem:    { padding: '6px 10px', fontSize: 10, cursor: 'pointer', borderBottom: '1px solid #f4f4f4' },

  spinner:   { width: 26, height: 26, border: '3px solid #eee', borderTopColor: '#534AB7', borderRadius: '50%', animation: 'zspin 0.8s linear infinite', margin: '0 auto 12px' },
  center:    { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' as const },

  pvWrap:    { fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', height: '100vh', display: 'flex', flexDirection: 'row', gap: 8, padding: 10, background: '#fff', boxSizing: 'border-box' as const },
  pvTile:    { flex: 1, border: '1px solid #eee', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none', color: 'inherit' },
  pvNum:     { fontSize: 28, fontWeight: 700, color: '#534AB7', lineHeight: 1 },
  pvLbl:     { fontSize: 12, color: '#888', marginTop: 6 },
  pvArrow:   { fontSize: 11, color: '#bbb', marginTop: 4 },
  cardFree:  { background: '#fff', border: '1px dashed #D8D8DC', borderRadius: 14, padding: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', minHeight: 0 },
  freeLbl:   { fontSize: 9, color: '#BBB', textAlign: 'center' as const, paddingBottom: 8 },
};
