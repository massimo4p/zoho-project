import type { Contact, Company, Lead, Call, Ticket, AccountOption, NewRecordData } from './types';

const BACKEND = (import.meta as any).env?.VITE_BACKEND_URL ?? '';

export const eventsUrl = () => `${BACKEND}/api/zoho/events`;

export async function lookupByPhone(phone: string): Promise<Contact | null> {
  const r = await fetch(`${BACKEND}/api/zoho/contacts/lookup?phone=${encodeURIComponent(phone)}`);
  return r.json();
}

export async function fetchRecord(module: string, id: string): Promise<Contact | null> {
  const r = await fetch(`${BACKEND}/api/zoho/contacts/record/${module}/${id}`);
  return r.json();
}

export async function fetchCompany(accountId: string): Promise<Company | null> {
  const r = await fetch(`${BACKEND}/api/zoho/contacts/company/${accountId}`);
  return r.json();
}

export async function fetchLead(id: string): Promise<Lead | null> {
  const r = await fetch(`${BACKEND}/api/zoho/contacts/lead/${id}`);
  return r.json();
}

export async function fetchCalls(module: string, id: string): Promise<Call[]> {
  const r = await fetch(`${BACKEND}/api/zoho/activities/${module}/${id}`);
  return r.json();
}

export async function fetchDesk(module: string, id: string): Promise<{ tickets: Ticket[]; deskAccountId: string | null }> {
  const r = await fetch(`${BACKEND}/api/zoho/desk/${module}/${id}`);
  const d = await r.json();
  return { tickets: d.tickets ?? [], deskAccountId: d.deskAccountId ?? null };
}

export async function fetchLeadStatuses(): Promise<string[]> {
  try {
    const r = await fetch(`${BACKEND}/api/zoho/contacts/lead-statuses`);
    return r.json();
  } catch {
    return [];
  }
}

export async function searchAccounts(q: string): Promise<AccountOption[]> {
  try {
    const r = await fetch(`${BACKEND}/api/zoho/contacts/accounts/search?q=${encodeURIComponent(q)}`);
    return r.json();
  } catch {
    return [];
  }
}

export async function updateLead(id: string, status: string, description: string): Promise<boolean> {
  const r = await fetch(`${BACKEND}/api/zoho/contacts/lead/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, description }),
  });
  const d = await r.json();
  return !!d.ok;
}

export async function createTicket(subject: string, description: string, contactName: string, contactPhone: string): Promise<boolean> {
  const r = await fetch(`${BACKEND}/api/zoho/desk/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, description, contactName, contactPhone }),
  });
  const d = await r.json();
  return !!d.ok;
}

export async function createRecord(data: NewRecordData): Promise<{ ok: boolean; id?: string; type?: string; url?: string }> {
  const r = await fetch(`${BACKEND}/api/zoho/contacts/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}
