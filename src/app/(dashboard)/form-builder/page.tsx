'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useCRMStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { cn, generateId, formatDate } from '@/lib/utils';
import type { CRMForm } from '@/types';
import {
  Plus, Edit, Trash2, ExternalLink, Copy, BarChart3,
  CheckCircle, XCircle, Eye, Link as LinkIcon, Zap,
} from 'lucide-react';

export default function FormBuilderListPage() {
  const { crmForms, leads, deleteCRMForm, addCRMForm, firebaseConnected } = useCRMStore();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const getFormUrl = (formId: string) => {
    if (typeof window !== 'undefined') return `${window.location.origin}/f/${formId}`;
    return `/f/${formId}`;
  };

  const copyLink = (formId: string) => {
    navigator.clipboard.writeText(getFormUrl(formId));
    setCopied(formId);
    setTimeout(() => setCopied(null), 2000);
  };

  const createForm = () => {
    if (!name.trim()) return;
    const form: CRMForm = {
      id: generateId(),
      name: name.trim(),
      description: desc.trim(),
      fields: [
        { id: 'name',    type: 'text',  label: 'Full Name',    required: true,  mapTo: 'name',    placeholder: 'Enter your full name' },
        { id: 'phone',   type: 'phone', label: 'Phone Number', required: true,  mapTo: 'phone',   placeholder: '10-digit mobile number' },
        { id: 'email',   type: 'email', label: 'Email Address',required: false, mapTo: 'email',   placeholder: 'your@email.com' },
        { id: 'college', type: 'text',  label: 'College Name', required: false, mapTo: 'college', placeholder: 'Your college' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'ACTIVE',
      submissions: 0,
      accentColor: '#2563eb',
      successMessage: 'Thank you! We will contact you soon.',
    };
    addCRMForm(form);
    setShowNew(false); setName(''); setDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create shareable lead capture forms — no Google account needed</p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}><Plus className="w-4 h-4" /> Create Form</Button>
      </div>

      {/* Firebase status */}
      <div className={cn('rounded-xl border p-4 flex items-start gap-3', firebaseConnected ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200')}>
        {firebaseConnected
          ? <><CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /><div><p className="font-semibold text-green-800 text-sm">Firebase connected — real-time leads enabled</p><p className="text-xs text-green-700 mt-0.5">New form submissions will appear instantly in your leads list.</p></div></>
          : <><Zap className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" /><div><p className="font-semibold text-amber-800 text-sm">Firebase not connected yet</p><p className="text-xs text-amber-700 mt-0.5">Go to <Link href="/settings" className="underline font-medium">Settings → Firebase</Link> and paste your Firebase config to enable real-time lead capture.</p></div></>
        }
      </div>

      {/* Empty state */}
      {crmForms.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No forms yet</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Create a form, share the link, and every submission becomes a lead in your CRM — instantly.
          </p>
          <Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4" /> Create Your First Form</Button>
        </div>
      )}

      {/* Forms grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {crmForms.map(form => {
          const formLeads = leads.filter(l => l.sourceFormId === form.id);
          const converted = formLeads.filter(l => l.status === 'CONVERTED').length;
          const url = getFormUrl(form.id);

          return (
            <div key={form.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Color bar */}
              <div className="h-1.5" style={{ background: form.accentColor ?? '#2563eb' }} />

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{form.name}</h3>
                    {form.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{form.description}</p>}
                  </div>
                  <span className={cn('ml-2 flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium',
                    form.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  )}>
                    {form.status === 'ACTIVE' ? '● Active' : '○ Inactive'}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-blue-50 rounded-xl p-2 text-center">
                    <p className="text-lg font-bold text-blue-700">{formLeads.length}</p>
                    <p className="text-xs text-blue-500">Leads</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-2 text-center">
                    <p className="text-lg font-bold text-green-700">{converted}</p>
                    <p className="text-xs text-green-500">Converted</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-2 text-center">
                    <p className="text-lg font-bold text-purple-700">{form.fields.length}</p>
                    <p className="text-xs text-purple-500">Fields</p>
                  </div>
                </div>

                {/* URL */}
                <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2 mb-4">
                  <LinkIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600 truncate flex-1">{url}</span>
                </div>

                <p className="text-xs text-gray-400 mb-3">Created {formatDate(form.createdAt)} · {form.fields.length} fields</p>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Link href={`/form-builder/${form.id}`} className="flex-1">
                    <Button variant="primary" size="xs" className="w-full"><Edit className="w-3.5 h-3.5" /> Edit</Button>
                  </Link>
                  <button onClick={() => copyLink(form.id)}
                    className={cn('flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors',
                      copied === form.id ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    )}>
                    {copied === form.id ? <><CheckCircle className="w-3.5 h-3.5" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy Link</>}
                  </button>
                  <a href={url} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="xs"><Eye className="w-3.5 h-3.5" /> Preview</Button>
                  </a>
                  <button onClick={() => { if (confirm(`Delete "${form.name}"?`)) deleteCRMForm(form.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* How it works */}
      {crmForms.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-blue-900 mb-3">How to use your form</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { icon: '📋', step: '1', text: 'Build your form with the editor' },
              { icon: '🔗', step: '2', text: 'Copy the share link' },
              { icon: '📤', step: '3', text: 'Share via WhatsApp, email, or website' },
              { icon: '⚡', step: '4', text: 'Leads appear instantly in CRM' },
            ].map(s => (
              <div key={s.step} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-blue-100">
                <span className="text-xl">{s.icon}</span>
                <p className="text-xs font-medium text-blue-800">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New form modal */}
      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Create New Form" size="md">
        <div className="space-y-4">
          <Input label="Form Name *" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Full Stack Course Registration" />
          <Textarea label="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description shown on the form" rows={2} />
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
            Your form will start with <strong>4 default fields</strong> (Name, Phone, Email, College). You can add, remove, and reorder fields in the editor.
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={createForm} disabled={!name.trim()}>Create Form</Button>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
