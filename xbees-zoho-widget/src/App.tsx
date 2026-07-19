import React, { useEffect, useRef, useState } from 'react';
import Client from '@wildix/xbees-connect';
import { log } from './logger';
import { isOpen } from './utils';
import {
  eventsUrl, lookupByPhone, fetchRecord, fetchCompany, fetchLead,
  fetchCalls, fetchDesk, fetchLeadStatuses, createRecord as apiCreateRecord,
} from './api';
import type { Contact, Company, Lead, Call, Ticket, NewRecordData } from './types';
import PreviewView from './views/PreviewView';
import ClientView from './views/ClientView';
import LeadView from './views/LeadView';
import NewRecordView from './views/NewRecordView';
import { LoadingView, CreatingView, CreatedFallbackView, NoContactView } from './views/StatusViews';

const IS_PREVIEW = new URLSearchParams(window.location.search).get('v') === 'ui';

export default function App() {
  const [contact, setContact] = useState<Contact | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [deskAccountId, setDeskAccountId] = useState<string | null>(null);
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [leadStatuses, setLeadStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [createFailed, setCreateFailed] = useState(false);

  const loadRecordRef = useRef<((m: string, id: string) => Promise<boolean>) | null>(null);

  useEffect(() => {
    fetchLeadStatuses().then(setLeadStatuses);
  }, []);

  useEffect(() => {
    Client.getInstance().ready();
    let currentPhone: string | null = null;

    const clearAll = () => {
      currentPhone = null;
      setContact(null); setCompany(null); setLead(null);
      setCalls([]); setTickets([]); setDeskAccountId(null);
      setCreatedUrl(null); setCreateFailed(false); setCreating(false);
    };

    const loadExtras = async (module: string, id: string, accountId?: string | null) => {
      if (module === 'Leads') {
        setCompany(null); setTickets([]); setDeskAccountId(null);
        const [callsData, leadData] = await Promise.all([fetchCalls(module, id), fetchLead(id)]);
        setCalls(callsData);
        setLead(leadData);
        return;
      }
      setLead(null);
      const [callsData, deskData] = await Promise.all([fetchCalls(module, id), fetchDesk(module, id)]);
      setCalls(callsData);
      setTickets(deskData.tickets);
      setDeskAccountId(deskData.deskAccountId);
      if (accountId) {
        try { setCompany(await fetchCompany(accountId)); }
        catch (e) { log.error('company error', e); }
      } else {
        setCompany(null);
      }
    };

    const tryLookup = async (phone: string) => {
      if (phone === currentPhone) return;
      currentPhone = phone;
      log.debug('tryLookup', { phone });
      const data = await lookupByPhone(phone);
      log.debug('contact', data);
      if (!data) {
        setContact(null); setCompany(null); setLead(null);
        setCalls([]); setTickets([]);
        return;
      }
      setContact(data);
      await loadExtras(data.module ?? 'Contacts', data.id!, data.accountId);
    };

    const loadRecord = async (module: string, id: string) => {
      const data = await fetchRecord(module, id);
      log.debug('record', data);
      if (!data) return false;
      setContact(data);
      await loadExtras(module, id, data.accountId);
      return true;
    };
    loadRecordRef.current = loadRecord;

    const applyPhone = async (phone: string | null) => {
      setActivePhone(phone);
      if (phone) {
        try { await tryLookup(phone); } catch (e) { log.error('lookup error', e); }
      } else {
        clearAll();
      }
      setLoading(false);
    };

    const es = new EventSource(eventsUrl());
    es.onmessage = (ev) => {
      try {
        const { phone } = JSON.parse(ev.data);
        log.info('sse phone', phone);
        applyPhone(phone);
      } catch (e) { log.error('sse parse error', e); }
    };
    es.onerror = (e) => { log.error('sse error', e); };

    // Quando l'iframe torna visibile, ricarica i dati freschi da Zoho
    // (lo stato del lead potrebbe essere stato cambiato da un'altra vista)
    const removeVis = Client.getInstance().onVisibilityChange((visible: boolean) => {
      log.debug('visibility', { visible });
      if (visible && currentPhone) {
        const phone = currentPhone;
        currentPhone = null;        // forza il bypass del dedup
        applyPhone(phone);
      }
    });

    return () => { es.close(); removeVis(); };
  }, []);

  const handleCreate = async (data: NewRecordData) => {
    setCreating(true);
    setCreateFailed(false);
    try {
      const res = await apiCreateRecord(data);
      if (!res.ok || !res.id || !res.type) {
        log.error('create failed', res);
        setCreating(false);
        setCreateFailed(true);
        return;
      }
      setCreatedUrl(res.url ?? null);
      const ok = await loadRecordRef.current?.(res.type, res.id);
      setCreating(false);
      if (!ok) setCreateFailed(true);
    } catch (e) {
      log.error('createRecord error', e);
      setCreating(false);
      setCreateFailed(true);
    }
  };

  if (IS_PREVIEW) {
    return (
      <PreviewView
        loading={loading}
        contact={contact}
        company={company}
        lead={lead}
        statuses={leadStatuses}
        callsCount={calls.length}
        openTickets={tickets.filter(t => isOpen(t.status)).length}
        deskAccountId={deskAccountId}
      />
    );
  }

  if (loading) return <LoadingView />;
  if (creating) return <CreatingView />;
  if (!contact && createFailed && createdUrl) return <CreatedFallbackView url={createdUrl} />;
  if (!contact && activePhone) return <NewRecordView phone={activePhone} onCreate={handleCreate} />;
  if (!contact) return <NoContactView />;

  if (contact.module === 'Leads') {
    return <LeadView contact={contact} lead={lead} calls={calls} statuses={leadStatuses} />;
  }

  return (
    <ClientView
      contact={contact}
      company={company}
      calls={calls}
      tickets={tickets}
      deskAccountId={deskAccountId}
    />
  );
}
