'use client';
import { useCallback, useEffect, useRef } from 'react';
import { useCRMStore } from '@/lib/store';
import { generateId, detectDuplicate } from '@/lib/utils';
import type { GoogleForm, Lead, SyncLog, Notification } from '@/types';
import type { SyncResult } from '@/app/api/sync/route';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

/**
 * For each active form, read the linked Google Sheet via the API route,
 * import new rows as leads, and detect duplicates.
 */
export function useFormSync() {
  const {
    forms, leads, employees,
    addLead, updateLead, updateForm,
    addSyncLog, addNotification, addActivity,
  } = useCRMStore();

  // Track "last synced row" per form in a ref so it persists across renders
  // but doesn't need to be in the store (we re-derive from syncLogs on mount)
  const lastRowRef = useRef<Record<string, number>>({});

  // ── Core sync function ────────────────────────────────────────────────────
  const syncForm = useCallback(async (form: GoogleForm) => {
    if (!form.spreadsheetId || form.status !== 'ACTIVE') return;

    const lastSyncRow = lastRowRef.current[form.id] ?? 0;

    let result: SyncResult;
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: form.spreadsheetId,
          formId: form.id,
          formName: form.name,
          fieldMappings: form.fieldMappings ?? [],
          existingLeads: leads.map((l) => ({ phone: l.phone, email: l.email ?? '' })),
          lastSyncRow,
        }),
      });
      result = await res.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      logSync(form, 0, 0, 0, 0, 1, 'FAILED', msg);
      updateForm(form.id, { lastSync: new Date().toISOString() });
      return;
    }

    if (!result.success) {
      logSync(form, 0, 0, 0, 0, 1, 'FAILED', result.error);
      updateForm(form.id, { lastSync: new Date().toISOString() });
      return;
    }

    const { rows, totalRows } = result;
    let newCount = 0;
    let dupCount = 0;
    let updCount = 0;

    for (const row of rows) {
      const phone = cleanPhone(row.values['phone'] ?? '');
      const email = (row.values['email'] ?? '').trim().toLowerCase();
      const name  = (row.values['name']  ?? 'Unknown').trim();

      if (!phone && !email) continue; // skip rows with no contact info

      const existing = detectDuplicate(leads, phone, email);

      if (existing) {
        // Update existing lead — add new form submission to source history
        updateLead(existing.id, {
          submissionCount: (existing.submissionCount ?? 1) + 1,
          sourceForm: existing.sourceForm
            ? `${existing.sourceForm}, ${form.name}`
            : form.name,
        });
        addActivity({
          id: generateId(),
          leadId: existing.id,
          type: 'NOTE_ADDED',
          title: 'Re-submitted Google Form',
          notes: `Submitted "${form.name}" again (row ${row.rowIndex})`,
          createdAt: new Date().toISOString(),
          employeeId: 'system',
          employeeName: 'System',
        });
        dupCount++;
      } else {
        // New lead — pick next employee via round-robin
        const activeEmps = employees.filter((e) => e.status === 'ACTIVE');
        const assignedIdx = newCount % (activeEmps.length || 1);
        const assigned = activeEmps[assignedIdx];

        const lead: Lead = {
          id: generateId(),
          leadId: `GUH${String(leads.length + newCount + 1001).padStart(5, '0')}`,
          name,
          phone,
          email: email || undefined,
          college:    (row.values['college']  ?? '').trim() || undefined,
          course:     (row.values['course']   ?? '').trim() || undefined,
          year:       (row.values['year']     ?? '').trim() || undefined,
          location:   (row.values['location'] ?? '').trim() || undefined,
          sourceForm: form.name,
          sourceFormId: form.id,
          leadSource: 'GOOGLE_FORM',
          assignedEmployeeId:   assigned?.id,
          assignedEmployeeName: assigned?.name,
          status:     'NEW',
          priority:   'MEDIUM',
          createdAt:  parseTimestamp(row.timestamp),
          submissionCount: 1,
          isDuplicate: false,
        };

        addLead(lead);
        addActivity({
          id: generateId(),
          leadId: lead.id,
          type: 'LEAD_CREATED',
          title: 'Lead Created',
          notes: `Via Google Form: "${form.name}"`,
          createdAt: lead.createdAt,
          employeeId: 'system',
          employeeName: 'System',
        });

        const notif: Notification = {
          id: generateId(),
          type: 'NEW_LEAD',
          title: 'New Lead Received',
          message: `${name}${phone ? ` (${phone})` : ''} — ${form.name}`,
          createdAt: new Date().toISOString(),
          read: false,
          leadId: lead.id,
        };
        addNotification(notif);
        newCount++;
      }
    }

    // Advance the last-row pointer
    if (rows.length > 0) {
      lastRowRef.current[form.id] = totalRows;
    }

    const status = newCount + dupCount + updCount > 0 ? 'SUCCESS' : 'SUCCESS';
    logSync(form, rows.length, newCount, dupCount, updCount, 0, status);
    updateForm(form.id, {
      lastSync: new Date().toISOString(),
      leadCount: (form.leadCount ?? 0) + newCount,
    });

    if (newCount > 0) {
      // Trigger browser notification if permitted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`${newCount} new lead${newCount > 1 ? 's' : ''} from "${form.name}"`, {
          body: `Guhanix CRM — ${new Date().toLocaleTimeString()}`,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forms, leads, employees]);

  // ── Sync all active forms ─────────────────────────────────────────────────
  const syncAll = useCallback(async () => {
    const activeForms = forms.filter((f) => f.status === 'ACTIVE' && f.spreadsheetId);
    for (const form of activeForms) {
      await syncForm(form);
    }
  }, [forms, syncForm]);

  // ── Poll on mount and every 30 s ─────────────────────────────────────────
  useEffect(() => {
    syncAll(); // run immediately
    const interval = setInterval(syncAll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [syncAll]);

  return { syncAll, syncForm };
}

// ── Helpers ───────────────────────────────────────────────────────────────

function cleanPhone(raw: string): string {
  return raw.replace(/\D/g, '').replace(/^91/, '').slice(-10);
}

function parseTimestamp(raw: string): string {
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {}
  return new Date().toISOString();
}

function logSync(
  form: GoogleForm,
  recordsFound: number,
  newLeads: number,
  duplicates: number,
  updated: number,
  errors: number,
  status: SyncLog['status'],
  errorMessage?: string,
) {
  const { addSyncLog } = useCRMStore.getState();
  const log: SyncLog = {
    id: generateId(),
    formId: form.id,
    formName: form.name,
    syncedAt: new Date().toISOString(),
    recordsFound,
    newLeads,
    duplicates,
    updated,
    errors,
    status,
    errorMessage,
  };
  addSyncLog(log);
}
