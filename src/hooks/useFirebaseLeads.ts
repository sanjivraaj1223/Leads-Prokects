'use client';
import { useEffect, useRef } from 'react';
import { useCRMStore } from '@/lib/store';
import { initFirebase, listenToSubmissions, isFirebaseReady } from '@/lib/firebase';
import { generateId, detectDuplicate } from '@/lib/utils';
import type { Lead, Notification, Activity, CRMForm } from '@/types';

/**
 * For every ACTIVE CRM form, open a real-time Firestore listener.
 * New submissions → instant lead creation with round-robin assignment.
 */
export function useFirebaseLeads() {
  const {
    crmForms, leads, employees,
    firebaseConfig, setFirebaseConnected,
    addLead, updateLead, addActivity, addNotification, incrementFormSubmissions,
  } = useCRMStore();

  // Track active listeners so we can clean them up
  const unsubscribers = useRef<Record<string, () => void>>({});
  // Track which doc IDs we already processed (prevent re-processing on re-render)
  const processed = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!firebaseConfig) return;

    // Init firebase (idempotent)
    try {
      initFirebase(firebaseConfig);
      setFirebaseConnected(true);
    } catch {
      setFirebaseConnected(false);
      return;
    }

    const activeForms = crmForms.filter(f => f.status === 'ACTIVE');

    activeForms.forEach((form) => {
      // Don't create duplicate listeners
      if (unsubscribers.current[form.id]) return;

      const unsub = listenToSubmissions(form.id, (data, docId) => {
        // Skip already-processed docs (Firestore replays all on mount)
        const key = `${form.id}__${docId}`;
        if (processed.current.has(key)) return;
        processed.current.add(key);

        handleNewSubmission(form, data, docId);
      });

      unsubscribers.current[form.id] = unsub;
    });

    // Stop listeners for forms that are now inactive/deleted
    Object.keys(unsubscribers.current).forEach((formId) => {
      if (!activeForms.find(f => f.id === formId)) {
        unsubscribers.current[formId]?.();
        delete unsubscribers.current[formId];
      }
    });

    return () => {
      // Cleanup on unmount
      Object.values(unsubscribers.current).forEach(u => u());
      unsubscribers.current = {};
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crmForms, firebaseConfig]);

  // ─────────────────────────────────────────────────────────────────────────
  function handleNewSubmission(form: CRMForm, data: Record<string, string>, docId: string) {
    // Map submission data to lead fields using form.fields[].mapTo
    const mapped: Record<string, string> = { ...data };
    form.fields.forEach(field => {
      if (field.mapTo && data[field.label] !== undefined) {
        mapped[field.mapTo] = data[field.label];
      }
      if (field.mapTo && data[field.id] !== undefined) {
        mapped[field.mapTo] = data[field.id];
      }
    });

    const phone = cleanPhone(mapped['phone'] ?? '');
    const email = (mapped['email'] ?? '').trim().toLowerCase();
    const name  = (mapped['name'] ?? mapped['full_name'] ?? 'Unknown').trim();

    if (!phone && !email && !name) return;

    // Duplicate check
    const currentLeads = useCRMStore.getState().leads;
    const existing = detectDuplicate(currentLeads, phone, email);

    if (existing) {
      updateLead(existing.id, {
        submissionCount: (existing.submissionCount ?? 1) + 1,
        sourceForm: existing.sourceForm
          ? existing.sourceForm.includes(form.name) ? existing.sourceForm : `${existing.sourceForm}, ${form.name}`
          : form.name,
      });
      addActivity({
        id: generateId(), leadId: existing.id, type: 'NOTE_ADDED',
        title: 'Re-submitted form', notes: `Submitted "${form.name}" again`,
        createdAt: new Date().toISOString(), employeeId: 'system', employeeName: 'System',
      });
      return;
    }

    // Round-robin assignment
    const currentStore = useCRMStore.getState();
    const activeEmps = currentStore.employees.filter(e => e.status === 'ACTIVE');
    const newLeadsCount = currentStore.leads.length;
    const assigned = activeEmps.length > 0 ? activeEmps[newLeadsCount % activeEmps.length] : undefined;

    const lead: Lead = {
      id: generateId(),
      leadId: `GUH${String(newLeadsCount + 1001).padStart(5, '0')}`,
      name,
      phone,
      email: email || undefined,
      college:  (mapped['college'] ?? '').trim() || undefined,
      course:   (mapped['course'] ?? '').trim() || undefined,
      year:     (mapped['year'] ?? '').trim() || undefined,
      location: (mapped['location'] ?? '').trim() || undefined,
      sourceForm: form.name,
      sourceFormId: form.id,
      leadSource: 'CRM_FORM',
      assignedEmployeeId:   assigned?.id,
      assignedEmployeeName: assigned?.name,
      status:   'NEW',
      priority: 'MEDIUM',
      createdAt: new Date().toISOString(),
      submissionCount: 1,
      isDuplicate: false,
      // Store all raw fields as custom data
      customFields: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
    };

    addLead(lead);
    incrementFormSubmissions(form.id);

    addActivity({
      id: generateId(), leadId: lead.id, type: 'LEAD_CREATED',
      title: 'Lead Created via CRM Form',
      notes: `Submitted "${form.name}"`,
      createdAt: lead.createdAt, employeeId: 'system', employeeName: 'System',
    });

    const notif: Notification = {
      id: generateId(), type: 'NEW_LEAD',
      title: '🔔 New Lead!',
      message: `${name}${phone ? ` · ${phone}` : ''} — ${form.name}`,
      createdAt: new Date().toISOString(), read: false, leadId: lead.id,
    };
    addNotification(notif);
  }
}

function cleanPhone(raw: string): string {
  return raw.replace(/\D/g, '').replace(/^91/, '').slice(-10);
}
