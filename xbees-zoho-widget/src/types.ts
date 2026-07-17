export interface Contact {
  id?: string;
  module?: string;
  name: string;
  organization: string;
  accountId?: string | null;
  phone: string;
  url: string;
}

export interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  vat: string | null;
  stato: string | null;
  pagamenti: string | null;
  blocco: boolean;
  owner: string | null;
  scadenza: string | null;
  url: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string | null;
  website: string | null;
  status: string | null;
  source: string | null;
  owner: string | null;
  description: string;
  vat: string | null;
  cf: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
  state: string | null;
  converted: boolean;
  url: string;
}

export interface Call {
  id: string;
  subject: string;
  startTime: string;
  duration: string;
  seconds: number;
  direction: 'IN' | 'OUT';
  phone: string;
  extension: string;
  note?: string | null;
  extId?: string | null;
}}

export interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority?: string;
  createdTime: string;
  channel?: string;
}

export interface AccountOption {
  id: string;
  name: string;
}

export interface NewRecordData {
  type: 'Leads' | 'Contacts';
  firstName?: string;
  lastName: string;
  phone: string;
  company?: string;
  accountId?: string | null;
  role?: string;
  email?: string;
}
