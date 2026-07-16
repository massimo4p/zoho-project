export const DESK_BASE = 'https://desk.zoho.eu/agent/4personality';
export const MAX_ITEMS = 10;

export const statusColor: Record<string, string> = {
  'Open': '#1a9e6f', 'Aperto': '#1a9e6f',
  'Closed': '#aaa',  'Chiuso': '#aaa',
  'On Hold': '#e08a00', 'In attesa': '#e08a00',
  'In Progress': '#534AB7',
};

export const isOpen = (status: string) => status !== 'Closed' && status !== 'Chiuso';

export const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('it-IT', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

export const formatDuration = (d: string) => (!d || d === '00:00') ? null : d;

export const initialsOf = (name: string) =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

export const deskAccountUrl = (deskAccountId: string | null) =>
  deskAccountId
    ? `${DESK_BASE}/all/accounts/details/${deskAccountId}`
    : `${DESK_BASE}/all/tickets`;

export const deskTicketUrl = (ticketId: string) =>
  `${DESK_BASE}/all/tickets/detail/${ticketId}`;
