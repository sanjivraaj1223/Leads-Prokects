'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useCRMStore } from '@/lib/store';
import { initFirebase, saveSubmission, getDefaultConfig } from '@/lib/firebase';
import { cn, generateId, detectDuplicate } from '@/lib/utils';
import type { FormField, CRMForm } from '@/types';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

export default function PublicFormPage() {
  const { formId } = useParams<{ formId: string }>();
  const { crmForms, firebaseConfig, addLead, leads, employees, addNotification, incrementFormSubmissions } = useCRMStore();

  const [form, setForm] = useState<CRMForm | null>(null);
  const [values, setValues] = useState<Record<string, string | string[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    const found = crmForms.find(f => f.id === formId);
    if (found) {
      setForm(found);
      const defaults: Record<string, string> = {};
      found.fields.forEach(f => { defaults[f.id] = ''; });
      setValues(defaults);
    }
  }, [crmForms, formId]);

  useEffect(() => {
    // Always init Firebase — use stored config or fall back to default
    try {
      initFirebase(firebaseConfig ?? getDefaultConfig());
      setFirebaseReady(true);
    } catch {
      setFirebaseReady(false);
    }
  }, [firebaseConfig]);

  const validate = (): boolean => {
    if (!form) return false;
    const newErrors: Record<string, string> = {};
    form.fields.forEach(f => {
      const val = values[f.id];
      if (f.required && (!val || (typeof val === 'string' && !val.trim()) || (Array.isArray(val) && val.length === 0)))
        newErrors[f.id] = `${f.label} is required`;
      if (f.type === 'email' && val && typeof val === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
        newErrors[f.id] = 'Enter a valid email address';
      if ((f.type === 'phone' || f.mapTo === 'phone') && val && typeof val === 'string') {
        if (val.replace(/\D/g,'').length < 10) newErrors[f.id] = 'Enter a valid 10-digit phone number';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!validate()) return;
    setSubmitting(true); setSubmitError('');

    // Build payload keyed by field label + field id + mapped CRM field
    const payload: Record<string, string> = {};
    form.fields.forEach(f => {
      const val = values[f.id];
      const str = Array.isArray(val) ? val.join(', ') : String(val ?? '');
      payload[f.label] = str;
      payload[f.id] = str;
      if (f.mapTo) payload[f.mapTo] = str;
    });

    if (firebaseReady && firebaseConfig) {
      // Real-time path — save to Firestore, hook picks it up
      try {
        await saveSubmission(formId, payload);
        incrementFormSubmissions(form.id);
        setSubmitted(true);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
      }
    } else {
      // Offline/no-Firebase path — create lead directly in localStorage store
      const phone = (payload['phone'] ?? '').replace(/\D/g,'').replace(/^91/,'').slice(-10);
      const email = (payload['email'] ?? '').trim().toLowerCase();
      const name  = (payload['name'] ?? 'Unknown').trim();
      const existing = detectDuplicate(leads, phone, email);
      if (!existing) {
        const activeEmps = employees.filter(e => e.status === 'ACTIVE');
        const assigned = activeEmps.length > 0 ? activeEmps[leads.length % activeEmps.length] : undefined;
        addLead({
          id: generateId(), leadId: `GUH${String(leads.length + 1001).padStart(5,'0')}`,
          name, phone, email: email || undefined,
          college: payload['college'] || undefined, course: payload['course'] || undefined,
          year: payload['year'] || undefined, location: payload['location'] || undefined,
          sourceForm: form.name, sourceFormId: form.id, leadSource: 'CRM_FORM',
          assignedEmployeeId: assigned?.id, assignedEmployeeName: assigned?.name,
          status: 'NEW', priority: 'MEDIUM', createdAt: new Date().toISOString(),
          submissionCount: 1, isDuplicate: false,
          customFields: Object.fromEntries(Object.entries(payload).map(([k,v])=>[k,String(v)])),
        });
        incrementFormSubmissions(form.id);
        addNotification({ id: generateId(), type:'NEW_LEAD', title:'🔔 New Lead!', message:`${name} — ${form.name}`, createdAt: new Date().toISOString(), read: false });
      }
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  const setValue = (fieldId: string, val: string | string[]) => {
    setValues(prev => ({ ...prev, [fieldId]: val }));
    if (errors[fieldId]) setErrors(prev => { const n = {...prev}; delete n[fieldId]; return n; });
  };

  const accent = form?.accentColor ?? '#2563eb';

  if (!form) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading form...</p>
      </div>
    </div>
  );

  if (form.status === 'INACTIVE') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h2 className="font-bold text-gray-900 mb-1">Form not available</h2>
        <p className="text-gray-500 text-sm">This form has been deactivated.</p>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: accent + '20' }}>
          <CheckCircle className="w-8 h-8" style={{ color: accent }} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
        <p className="text-gray-500">{form.successMessage ?? 'We will contact you soon.'}</p>
        <button onClick={() => { setSubmitted(false); setValues(Object.fromEntries(form.fields.map(f => [f.id,'']))); }}
          className="mt-6 text-sm font-medium px-5 py-2.5 rounded-xl text-white" style={{ background: accent }}>
          Submit Another Response
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="h-2" style={{ background: accent }} />
          <div className="px-8 pt-7 pb-5 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">{form.name}</h1>
            {form.description && <p className="text-gray-500 mt-1 text-sm">{form.description}</p>}
          </div>
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
            {form.fields.map(field => (
              <FormFieldInput key={field.id} field={field} value={values[field.id] ?? ''} error={errors[field.id]} onChange={val => setValue(field.id, val)} accent={accent} />
            ))}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />{submitError}
              </div>
            )}
            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70 transition-opacity"
              style={{ background: accent }}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <p className="text-center text-xs text-gray-400">Powered by Guhanix Technology</p>
          </form>
        </div>
      </div>
    </div>
  );
}

function FormFieldInput({ field, value, error, onChange, accent }: {
  field: FormField; value: string | string[]; error?: string;
  onChange: (v: string | string[]) => void; accent: string;
}) {
  const base = cn('w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-colors bg-white',
    error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-400');
  const label = (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
  const err = error && <p className="text-xs text-red-600 mt-1">{error}</p>;

  if (field.type === 'textarea') return <div>{label}<textarea className={cn(base,'resize-none')} rows={3} placeholder={field.placeholder} value={String(value)} onChange={e => onChange(e.target.value)} />{err}</div>;
  if (field.type === 'select') return (
    <div>{label}
      <select className={base} value={String(value)} onChange={e => onChange(e.target.value)}>
        <option value="">Select {field.label}</option>
        {(field.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
      </select>{err}
    </div>
  );
  if (field.type === 'radio') return (
    <div>{label}
      <div className="space-y-2">{(field.options ?? []).map(o => (
        <label key={o} className="flex items-center gap-2.5 cursor-pointer">
          <input type="radio" name={field.id} value={o} checked={String(value)===o} onChange={() => onChange(o)} style={{ accentColor: accent }} className="w-4 h-4" />
          <span className="text-sm text-gray-700">{o}</span>
        </label>
      ))}</div>{err}
    </div>
  );
  if (field.type === 'checkbox') {
    const arr = Array.isArray(value) ? value : (value ? [String(value)] : []);
    return (
      <div>{label}
        <div className="space-y-2">{(field.options ?? []).map(o => (
          <label key={o} className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={arr.includes(o)} onChange={e => onChange(e.target.checked ? [...arr,o] : arr.filter(x=>x!==o))} style={{ accentColor: accent }} className="w-4 h-4 rounded" />
            <span className="text-sm text-gray-700">{o}</span>
          </label>
        ))}</div>{err}
      </div>
    );
  }
  return (
    <div>{label}
      <input type={field.type==='phone'?'tel':field.type} className={base} placeholder={field.placeholder} value={String(value)} onChange={e => onChange(e.target.value)} />
      {err}
    </div>
  );
}
