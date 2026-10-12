'use client';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCRMStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { cn, generateId } from '@/lib/utils';
import type { CRMForm, FormField, FormFieldType } from '@/types';
import {
  ArrowLeft, Plus, Trash2, GripVertical, Eye, Copy,
  CheckCircle, Settings, Palette, Save, ExternalLink,
  AlignLeft, AtSign, Phone, Hash, ChevronDown, ToggleLeft, Calendar, List,
} from 'lucide-react';

const FIELD_TYPES: { type: FormFieldType; label: string; icon: React.ReactNode }[] = [
  { type: 'text',     label: 'Text',         icon: <AlignLeft className="w-4 h-4" /> },
  { type: 'phone',    label: 'Phone',        icon: <Phone className="w-4 h-4" /> },
  { type: 'email',    label: 'Email',        icon: <AtSign className="w-4 h-4" /> },
  { type: 'number',   label: 'Number',       icon: <Hash className="w-4 h-4" /> },
  { type: 'textarea', label: 'Long Text',    icon: <AlignLeft className="w-4 h-4" /> },
  { type: 'select',   label: 'Dropdown',     icon: <ChevronDown className="w-4 h-4" /> },
  { type: 'radio',    label: 'Radio',        icon: <ToggleLeft className="w-4 h-4" /> },
  { type: 'checkbox', label: 'Checkbox',     icon: <CheckCircle className="w-4 h-4" /> },
  { type: 'date',     label: 'Date',         icon: <Calendar className="w-4 h-4" /> },
];

const CRM_FIELDS = [
  { value: '', label: '— None —' },
  { value: 'name', label: 'Lead Name' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'college', label: 'College' },
  { value: 'course', label: 'Interested Course' },
  { value: 'year', label: 'Year of Study' },
  { value: 'location', label: 'Location / City' },
  { value: 'notes', label: 'Notes' },
];

const COLORS = ['#2563eb','#7c3aed','#0891b2','#059669','#dc2626','#d97706','#db2777','#0f172a'];

export default function FormEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { crmForms, updateCRMForm } = useCRMStore();
  const form = useMemo(() => crmForms.find(f => f.id === id), [crmForms, id]);

  const [fields, setFields] = useState<FormField[]>(form?.fields ?? []);
  const [formName, setFormName] = useState(form?.name ?? '');
  const [formDesc, setFormDesc] = useState(form?.description ?? '');
  const [accentColor, setAccentColor] = useState(form?.accentColor ?? '#2563eb');
  const [successMsg, setSuccessMsg] = useState(form?.successMessage ?? 'Thank you! We will contact you soon.');
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'fields' | 'settings' | 'preview'>('fields');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);

  if (!form) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-gray-500">Form not found</p>
      <Button variant="outline" onClick={() => router.push('/form-builder')}>← Back</Button>
    </div>
  );

  const formUrl = typeof window !== 'undefined' ? `${window.location.origin}/f/${id}` : `/f/${id}`;

  const handleSave = () => {
    updateCRMForm(id, { name: formName, description: formDesc, fields, accentColor, successMessage: successMsg, updatedAt: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addField = (type: FormFieldType) => {
    const f: FormField = { id: generateId(), type, label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`, placeholder: '', required: false, options: ['select','radio','checkbox'].includes(type) ? ['Option 1','Option 2'] : undefined, mapTo: '' };
    setFields(prev => [...prev, f]);
    setSelectedField(f.id);
  };

  const updateField = (fid: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === fid ? { ...f, ...updates } : f));
  };

  const removeField = (fid: string) => {
    setFields(prev => prev.filter(f => f.id !== fid));
    if (selectedField === fid) setSelectedField(null);
  };

  const moveField = (from: number, to: number) => {
    setFields(prev => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  const selected = fields.find(f => f.id === selectedField);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <button onClick={() => router.push('/form-builder')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft className="w-5 h-5" /></button>
        <input value={formName} onChange={e => setFormName(e.target.value)} className="text-lg font-semibold text-gray-900 bg-transparent border-none outline-none flex-1 min-w-0" />
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          {(['fields','settings','preview'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={cn('px-3 py-1 text-xs font-medium rounded-md transition-all capitalize', activeTab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700')}>
              {t}
            </button>
          ))}
        </div>
        <a href={formUrl} target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm"><ExternalLink className="w-3.5 h-3.5" /> Open</Button>
        </a>
        <button onClick={() => { navigator.clipboard.writeText(formUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
            copied ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')}>
          {copied ? <><CheckCircle className="w-3.5 h-3.5" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Share Link</>}
        </button>
        <Button size="sm" onClick={handleSave}>{saved ? <><CheckCircle className="w-3.5 h-3.5" />Saved!</> : <><Save className="w-3.5 h-3.5" />Save</>}</Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Field palette ─────────────────────────── */}
        {activeTab === 'fields' && (
          <div className="w-56 bg-white border-r border-gray-200 flex flex-col overflow-y-auto flex-shrink-0">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add Field</p>
            </div>
            <div className="p-2 space-y-1">
              {FIELD_TYPES.map(ft => (
                <button key={ft.type} onClick={() => addField(ft.type)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors text-left">
                  <span className="text-gray-400">{ft.icon}</span>{ft.label}
                  <Plus className="w-3 h-3 ml-auto text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Centre: Form canvas ─────────────────────────── */}
        {(activeTab === 'fields' || activeTab === 'settings') && (
          <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
            {activeTab === 'fields' && (
              <div className="max-w-xl mx-auto">
                {/* Form header */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
                  <div className="h-2" style={{ background: accentColor }} />
                  <div className="p-5">
                    <p className="text-xl font-bold text-gray-900">{formName}</p>
                    {formDesc && <p className="text-sm text-gray-500 mt-1">{formDesc}</p>}
                  </div>
                </div>

                {/* Fields */}
                <div className="space-y-2">
                  {fields.map((field, idx) => (
                    <div
                      key={field.id}
                      onClick={() => setSelectedField(field.id)}
                      onDragOver={e => { e.preventDefault(); setDragOver(field.id); }}
                      onDrop={e => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('idx')); moveField(from, idx); setDragOver(null); }}
                      className={cn(
                        'bg-white rounded-xl border-2 p-4 cursor-pointer transition-all group',
                        selectedField === field.id ? 'border-blue-400 shadow-sm' : 'border-gray-100 hover:border-gray-200',
                        dragOver === field.id && 'border-blue-300 bg-blue-50'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div draggable onDragStart={e => e.dataTransfer.setData('idx', String(idx))}
                          className="mt-1 cursor-grab text-gray-300 hover:text-gray-500">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-800">{field.label}</span>
                            {field.required && <span className="text-xs text-red-500 font-medium">*</span>}
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-auto">{field.type}</span>
                          </div>
                          <FieldPreview field={field} />
                        </div>
                        <button onClick={e => { e.stopPropagation(); removeField(field.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {fields.length === 0 && (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
                      <p className="text-gray-400 text-sm">Click a field type on the left to add it here</p>
                    </div>
                  )}
                </div>

                {/* Submit button preview */}
                <div className="mt-4 bg-white rounded-xl border-2 border-gray-100 p-4">
                  <button className="w-full py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: accentColor }}>
                    Submit
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-xl mx-auto space-y-5">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <h3 className="font-semibold text-gray-900">Form Settings</h3>
                  <Input label="Form Name" value={formName} onChange={e => setFormName(e.target.value)} />
                  <Textarea label="Description" value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} />
                  <Textarea label="Success Message" value={successMsg} onChange={e => setSuccessMsg(e.target.value)} rows={2} />
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Palette className="w-4 h-4 text-blue-600" />Brand Color</h3>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setAccentColor(c)}
                        className={cn('w-8 h-8 rounded-full transition-transform hover:scale-110', accentColor === c && 'ring-2 ring-offset-2 ring-gray-400 scale-110')}
                        style={{ background: c }} />
                    ))}
                    <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                      className="w-8 h-8 rounded-full border-none cursor-pointer" title="Custom color" />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">Share Your Form</h3>
                  <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                    <code className="text-xs text-blue-600 flex-1 truncate">{formUrl}</code>
                    <button onClick={() => { navigator.clipboard.writeText(formUrl); setCopied(true); setTimeout(() => setCopied(false),2000); }}
                      className={cn('text-xs px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1 flex-shrink-0 transition-colors',
                        copied ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')}>
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <Button className="w-full" onClick={handleSave}>Save Settings</Button>
              </div>
            )}
          </div>
        )}

        {/* ── Preview tab ─────────────────────────────────── */}
        {activeTab === 'preview' && (
          <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
            <div className="max-w-lg mx-auto">
              <FormPreview form={{ ...form, name: formName, description: formDesc, fields, accentColor, successMessage: successMsg }} />
            </div>
          </div>
        )}

        {/* ── Right: Field editor ─────────────────────────── */}
        {activeTab === 'fields' && selected && (
          <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Field Properties</p>
              <button onClick={() => setSelectedField(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
            <div className="p-4 space-y-4">
              <Input label="Label" value={selected.label} onChange={e => updateField(selected.id, { label: e.target.value })} />
              <Input label="Placeholder" value={selected.placeholder ?? ''} onChange={e => updateField(selected.id, { placeholder: e.target.value })} />
              <Select label="Maps to CRM field" value={selected.mapTo ?? ''} onChange={e => updateField(selected.id, { mapTo: e.target.value })} options={CRM_FIELDS} />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={selected.required} onChange={e => updateField(selected.id, { required: e.target.checked })} className="rounded" />
                <span className="text-sm font-medium text-gray-700">Required field</span>
              </label>
              {['select','radio','checkbox'].includes(selected.type) && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Options <span className="text-xs text-gray-400">(one per line)</span></p>
                  <textarea
                    value={(selected.options ?? []).join('\n')}
                    onChange={e => updateField(selected.id, { options: e.target.value.split('\n').filter(Boolean) })}
                    rows={5}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 resize-none"
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                </div>
              )}
              <Button variant="danger" size="sm" className="w-full" onClick={() => removeField(selected.id)}>
                <Trash2 className="w-3.5 h-3.5" /> Remove Field
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Field preview inside editor ───────────────────────────────────────────────
function FieldPreview({ field }: { field: FormField }) {
  const base = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-default pointer-events-none";
  if (field.type === 'textarea') return <textarea className={base} placeholder={field.placeholder || field.label} rows={2} readOnly />;
  if (field.type === 'select') return (
    <select className={base}><option>{field.options?.[0] ?? 'Select...'}</option></select>
  );
  if (field.type === 'radio' || field.type === 'checkbox') return (
    <div className="space-y-1">
      {(field.options ?? []).slice(0, 3).map(o => (
        <label key={o} className="flex items-center gap-2 text-sm text-gray-400">
          <input type={field.type} disabled className="rounded" />{o}
        </label>
      ))}
    </div>
  );
  return <input type={field.type === 'phone' ? 'tel' : field.type} className={base} placeholder={field.placeholder || field.label} readOnly />;
}

// ── Live preview ──────────────────────────────────────────────────────────────
function FormPreview({ form }: { form: Partial<CRMForm> }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="h-2" style={{ background: form.accentColor ?? '#2563eb' }} />
      <div className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900">{form.name}</h1>
        {form.description && <p className="text-gray-500 mt-1">{form.description}</p>}
        <div className="mt-6 space-y-4">
          {(form.fields ?? []).map(f => (
            <div key={f.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <FieldPreview field={f} />
            </div>
          ))}
        </div>
        <button className="mt-6 w-full py-3 rounded-xl text-white text-sm font-semibold" style={{ background: form.accentColor ?? '#2563eb' }}>
          Submit
        </button>
      </div>
    </div>
  );
}
