'use client';
import { useState } from 'react';
import { useCRMStore } from '@/lib/store';
import { useFormSync } from '@/hooks/useFormSync';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { cn, formatDateTime, generateId } from '@/lib/utils';
import type { GoogleForm, FieldMapping } from '@/types';
import {
  Plus, RefreshCw, Trash2, ExternalLink, CheckCircle, XCircle,
  Clock, AlertTriangle, Settings, BarChart3, Info, Link as LinkIcon,
} from 'lucide-react';

const LEAD_FIELDS = [
  { value: 'name',     label: 'Full Name' },
  { value: 'phone',    label: 'Phone / Mobile' },
  { value: 'email',    label: 'Email Address' },
  { value: 'college',  label: 'College / Institution' },
  { value: 'course',   label: 'Interested Course' },
  { value: 'year',     label: 'Year of Study' },
  { value: 'location', label: 'City / Location' },
  { value: 'notes',    label: 'Additional Notes' },
];

export default function GoogleFormsPage() {
  const { forms, leads, syncLogs, addForm, updateForm, deleteForm } = useCRMStore();
  const { syncForm, syncAll } = useFormSync();

  const [showAdd, setShowAdd] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [selectedForm, setSelectedForm] = useState<GoogleForm | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  // Add form wizard
  const [step, setStep] = useState(1);
  const [newForm, setNewForm] = useState({
    name: '',
    formUrl: '',
    sheetUrl: '',
    spreadsheetId: '',
  });

  // Mapping editor
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [mapFormField, setMapFormField] = useState('');
  const [mapLeadField, setMapLeadField] = useState('name');

  const extractSpreadsheetId = (url: string): string => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : url;
  };

  const handleSheetUrlChange = (url: string) => {
    const extracted = extractSpreadsheetId(url);
    setNewForm(f => ({ ...f, sheetUrl: url, spreadsheetId: extracted }));
  };

  const handleAddForm = () => {
    if (!newForm.name || !newForm.spreadsheetId) return;

    const form: GoogleForm = {
      id: generateId(),
      name: newForm.name,
      formUrl: newForm.formUrl,
      sheetUrl: newForm.sheetUrl,
      spreadsheetId: newForm.spreadsheetId,
      connectedDate: new Date().toISOString().split('T')[0],
      leadCount: 0,
      status: 'ACTIVE',
      fieldMappings: mappings,
    };
    addForm(form);
    // Reset
    setNewForm({ name: '', formUrl: '', sheetUrl: '', spreadsheetId: '' });
    setMappings([]);
    setStep(1);
    setShowAdd(false);
  };

  const handleSync = async (form: GoogleForm) => {
    setSyncing(form.id);
    await syncForm(form);
    setSyncing(null);
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    await syncAll();
    setSyncingAll(false);
  };

  const handleSaveMapping = () => {
    if (!selectedForm) return;
    updateForm(selectedForm.id, { fieldMappings: mappings });
    setShowMapping(false);
  };

  const formLeads = (formId: string) => leads.filter(l => l.sourceFormId === formId);
  const formConverted = (formId: string) => formLeads(formId).filter(l => l.status === 'CONVERTED').length;

  const hasGoogleCreds = true; // we check at sync time via API

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Google Forms</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {forms.filter(f => f.status === 'ACTIVE').length} active forms · Auto-syncs every 30 seconds
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowLogs(true)}>
            <Clock className="w-4 h-4" /> Sync Logs
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSyncAll} disabled={syncingAll || forms.length === 0}>
            <RefreshCw className={cn('w-4 h-4', syncingAll && 'animate-spin')} />
            {syncingAll ? 'Syncing...' : 'Sync All Now'}
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> Connect Form
          </Button>
        </div>
      </div>

      {/* Setup guide — shown when no forms connected */}
      {forms.length === 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-blue-900 mb-2">Connect Your First Google Form</h2>
          <p className="text-blue-700 text-sm mb-6 max-w-lg mx-auto">
            Every time someone fills your Google Form, they'll automatically appear as a new lead here — with duplicate detection, round-robin assignment, and instant notifications.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            {['1. Create Google Form', '2. Link to Google Sheet', '3. Connect here', '4. Leads flow in automatically'].map((step, i) => (
              <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border border-blue-100 shadow-sm">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">{i+1}</span>
                <span className="text-xs font-medium text-blue-800">{step.replace(/^\d\. /,'')}</span>
              </div>
            ))}
          </div>
          <Button size="lg" onClick={() => setShowAdd(true)}>
            <Plus className="w-5 h-5" /> Connect Google Form
          </Button>
        </div>
      )}

      {/* .env reminder */}
      {forms.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Google API credentials required for live sync</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Add <code className="bg-amber-100 px-1 rounded">GOOGLE_SERVICE_ACCOUNT_JSON</code> to your <code className="bg-amber-100 px-1 rounded">.env.local</code> file.
              {' '}<a href="#setup-guide" className="underline font-medium">See setup guide below ↓</a>
            </p>
          </div>
        </div>
      )}

      {/* Forms Grid */}
      {forms.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {forms.map(form => {
            const fl = formLeads(form.id);
            const conv = formConverted(form.id);
            const pct = fl.length ? Math.round(conv / fl.length * 100) : 0;
            const isSyncing = syncing === form.id;
            const recentLogs = syncLogs.filter(l => l.formId === form.id).slice(0, 1);
            const lastLog = recentLogs[0];

            return (
              <div key={form.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Status strip */}
                <div className={cn('h-1', form.status === 'ACTIVE' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gray-200')} />

                <div className="p-5">
                  {/* Title row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0">📋</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{form.name}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
                            form.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          )}>
                            {form.status === 'ACTIVE'
                              ? <><CheckCircle className="w-3 h-3" />Active</>
                              : <><XCircle className="w-3 h-3" />Inactive</>}
                          </span>
                          <span className="text-xs text-gray-400">Connected {form.connectedDate}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => updateForm(form.id, { status: form.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                      className={cn('text-xs px-2.5 py-1 rounded-lg font-medium transition-colors flex-shrink-0',
                        form.status === 'ACTIVE' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                      )}>
                      {form.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                    </button>
                  </div>

                  {/* Spreadsheet ID */}
                  <div className="bg-gray-50 rounded-xl px-3 py-2 mb-4 flex items-center gap-2 text-xs">
                    <span className="text-green-500">📊</span>
                    <span className="text-gray-500 font-medium">Spreadsheet ID:</span>
                    <code className="text-gray-700 truncate flex-1">{form.spreadsheetId}</code>
                    {form.sheetUrl && (
                      <a href={form.sheetUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 flex-shrink-0">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                      <p className="text-xl font-bold text-blue-700">{fl.length}</p>
                      <p className="text-xs text-blue-500">Leads</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-2.5 text-center">
                      <p className="text-xl font-bold text-green-700">{conv}</p>
                      <p className="text-xs text-green-500">Converted</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-2.5 text-center">
                      <p className="text-xl font-bold text-purple-700">{pct}%</p>
                      <p className="text-xs text-purple-500">Conv. Rate</p>
                    </div>
                  </div>

                  {/* Last sync */}
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {form.lastSync ? `Last sync: ${formatDateTime(form.lastSync)}` : 'Never synced'}
                    </span>
                    {lastLog && (
                      <span className={cn('px-2 py-0.5 rounded-full font-medium',
                        lastLog.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                        lastLog.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      )}>{lastLog.status}</span>
                    )}
                  </div>

                  {/* Field mappings status */}
                  <div className="flex items-center gap-1.5 text-xs mb-4">
                    {(form.fieldMappings?.length ?? 0) > 0
                      ? <><CheckCircle className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600">{form.fieldMappings!.length} field mappings configured</span></>
                      : <><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /><span className="text-amber-600">No field mappings — set them so data imports correctly</span></>
                    }
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <Button size="xs" onClick={() => handleSync(form)} disabled={isSyncing}>
                      <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </Button>
                    <Button variant="outline" size="xs" onClick={() => {
                      setSelectedForm(form);
                      setMappings(form.fieldMappings ?? []);
                      setShowMapping(true);
                    }}>
                      <Settings className="w-3.5 h-3.5" /> Field Mapping
                    </Button>
                    <Button variant="outline" size="xs" onClick={() => { setSelectedForm(form); setShowStats(true); }}>
                      <BarChart3 className="w-3.5 h-3.5" /> Stats
                    </Button>
                    <Button variant="danger" size="xs" onClick={() => {
                      if (confirm(`Disconnect "${form.name}"? Existing leads will remain.`)) deleteForm(form.id);
                    }}>
                      <Trash2 className="w-3.5 h-3.5" /> Disconnect
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Setup Guide */}
      <div id="setup-guide" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg"><Info className="w-5 h-5 text-blue-600" />How to Set Up Google Form Integration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Step num={1} title="Create your Google Form" desc="Go to forms.google.com and create your lead capture form with fields like Name, Phone, Email, College, Course, etc." />
            <Step num={2} title="Link to Google Sheet" desc='In your form, go to Responses tab → click the green Sheets icon → "Create new spreadsheet". This is where responses will be stored.' />
            <Step num={3} title="Get the Spreadsheet ID" desc='Open the linked Google Sheet. Copy the ID from the URL: docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit' />
            <Step num={4} title="Connect in CRM" desc='Click "Connect Form" above, paste the Spreadsheet ID, and configure field mappings so the CRM knows which column = Phone, Name, etc.' />
          </div>
          <div className="space-y-4">
            <Step num={5} title="Create Google Cloud Service Account" desc="Go to console.cloud.google.com → New Project → Enable Google Sheets API → IAM & Admin → Service Accounts → Create service account → Download JSON key." />
            <Step num={6} title="Share Sheet with Service Account" desc='Open your Google Sheet → Share → paste the service account email (ends with @...iam.gserviceaccount.com) → give Editor access.' />
            <Step num={7} title="Add credentials to .env.local" desc='In your project root, create .env.local and add: GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}  (paste the full JSON as one line)' />
            <Step num={8} title="Leads flow in automatically" desc="Now whenever anyone fills your Google Form, within 30 seconds their details appear in the CRM as a New lead with auto-assignment and duplicate detection." />
          </div>
        </div>

        <div className="mt-5 bg-slate-900 rounded-xl p-4 text-sm">
          <p className="text-slate-400 text-xs mb-2 font-mono">.env.local</p>
          <pre className="text-green-400 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">{`GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"crm-sync@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}`}</pre>
        </div>
      </div>

      {/* ─── Add Form Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setStep(1); }} title="Connect Google Form" size="lg">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1,2,3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                step === s ? 'bg-blue-600 text-white' : step > s ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
              )}>{step > s ? '✓' : s}</div>
              {s < 3 && <div className={cn('flex-1 h-0.5', step > s ? 'bg-green-400' : 'bg-gray-100')} />}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-5 -mt-3">
          <span>Form details</span><span>Field mapping</span><span>Review</span>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <Input label="Form Name *" value={newForm.name} onChange={e => setNewForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Full Stack Course Registration" />
            <Input label="Google Form URL (optional)" value={newForm.formUrl} onChange={e => setNewForm(f=>({...f,formUrl:e.target.value}))} placeholder="https://forms.gle/..." />
            <div>
              <Input label="Google Sheet URL *" value={newForm.sheetUrl}
                onChange={e => handleSheetUrlChange(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1abc.../edit" />
              {newForm.spreadsheetId && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Detected Spreadsheet ID: <code className="font-mono">{newForm.spreadsheetId}</code>
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Spreadsheet ID *</label>
              <input value={newForm.spreadsheetId} onChange={e => setNewForm(f=>({...f,spreadsheetId:e.target.value}))}
                placeholder="Paste ID manually if needed"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
              <p className="text-xs text-gray-400 mt-1">Found in Sheet URL: …/spreadsheets/d/<strong>THIS_PART</strong>/edit</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" disabled={!newForm.name || !newForm.spreadsheetId} onClick={() => setStep(2)}>Next: Field Mapping →</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
              Map your Google Form column headers to CRM fields. The <strong>Timestamp</strong> column is handled automatically. Use the exact column names from your sheet.
            </div>
            {/* Existing mappings */}
            {mappings.length > 0 && (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr>
                    <th className="px-3 py-2 text-left text-xs text-gray-500 font-semibold">Sheet Column Name</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500 font-semibold">→ CRM Field</th>
                    <th className="px-3 py-2 w-8"></th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {mappings.map((m,i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium text-gray-800">{m.formField}</td>
                        <td className="px-3 py-2 text-blue-600">{LEAD_FIELDS.find(f=>f.value===m.leadField)?.label ?? m.leadField}</td>
                        <td className="px-3 py-2">
                          <button onClick={()=>setMappings(prev=>prev.filter((_,idx)=>idx!==i))} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Add mapping row */}
            <div className="flex gap-2 items-end bg-gray-50 p-3 rounded-xl">
              <div className="flex-1">
                <label className="text-xs text-gray-600 font-medium block mb-1">Sheet Column Header</label>
                <input value={mapFormField} onChange={e=>setMapFormField(e.target.value)}
                  placeholder="e.g. Full Name" onKeyDown={e=>e.key==='Enter' && mapFormField && (setMappings(prev=>[...prev,{formField:mapFormField,leadField:mapLeadField,isRequired:false}]),setMapFormField(''))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-600 font-medium block mb-1">Maps to CRM field</label>
                <select value={mapLeadField} onChange={e=>setMapLeadField(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white">
                  {LEAD_FIELDS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <Button size="sm" className="flex-shrink-0" onClick={()=>{ if(!mapFormField) return; setMappings(prev=>[...prev,{formField:mapFormField,leadField:mapLeadField,isRequired:false}]); setMapFormField(''); }}>
                Add
              </Button>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
              <Button className="flex-1" onClick={() => setStep(3)}>Next: Review →</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-green-800">Ready to connect!</p>
              <div className="text-xs text-green-700 space-y-1">
                <p>📋 <strong>Form:</strong> {newForm.name}</p>
                <p>📊 <strong>Spreadsheet ID:</strong> {newForm.spreadsheetId}</p>
                <p>🔗 <strong>Field mappings:</strong> {mappings.length > 0 ? `${mappings.length} configured` : 'None (can add later)'}</p>
              </div>
            </div>
            {mappings.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                ⚠️ No field mappings set. The system will still import data but may not correctly identify Name, Phone, etc. You can configure mappings after connecting.
              </div>
            )}
            <p className="text-xs text-gray-500">
              After connecting, click <strong>Sync Now</strong> or wait up to 30 seconds for the first automatic sync. Make sure you've added <code className="bg-gray-100 px-1 rounded">GOOGLE_SERVICE_ACCOUNT_JSON</code> to your <code className="bg-gray-100 px-1 rounded">.env.local</code>.
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>← Back</Button>
              <Button className="flex-1" onClick={handleAddForm}><CheckCircle className="w-4 h-4" /> Connect Form</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Field Mapping Modal ─────────────────────────────────────────── */}
      <Modal isOpen={showMapping} onClose={() => setShowMapping(false)} title={`Field Mapping — ${selectedForm?.name}`} size="xl">
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
            Enter the exact column header names from your Google Sheet (row 1). The system matches them case-insensitively.
          </div>
          {mappings.length > 0 && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Sheet Column</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">→ CRM Field</th>
                  <th className="px-4 py-2 w-16"></th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {mappings.map((m,i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{m.formField}</td>
                      <td className="px-4 py-2.5 text-blue-600">{LEAD_FIELDS.find(f=>f.value===m.leadField)?.label ?? m.leadField}</td>
                      <td className="px-4 py-2.5 text-right"><button onClick={()=>setMappings(prev=>prev.filter((_,idx)=>idx!==i))} className="text-xs text-red-500 hover:text-red-700">Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex gap-2 items-end bg-gray-50 p-3 rounded-xl">
            <div className="flex-1">
              <label className="text-xs text-gray-600 font-medium block mb-1">Sheet Column Header</label>
              <input value={mapFormField} onChange={e=>setMapFormField(e.target.value)} placeholder="e.g. Mobile Number"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-600 font-medium block mb-1">Maps to</label>
              <select value={mapLeadField} onChange={e=>setMapLeadField(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white">
                {LEAD_FIELDS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <Button size="sm" className="flex-shrink-0" onClick={()=>{ if(!mapFormField) return; setMappings(prev=>[...prev,{formField:mapFormField,leadField:mapLeadField,isRequired:false}]); setMapFormField(''); }}>Add</Button>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSaveMapping}><CheckCircle className="w-4 h-4" /> Save Mappings</Button>
            <Button variant="outline" onClick={() => setShowMapping(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ─── Sync Logs Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={showLogs} onClose={() => setShowLogs(false)} title="Sync History" size="2xl">
        {syncLogs.length === 0
          ? <p className="text-center text-gray-400 py-8">No sync history yet</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>{['Date/Time','Form','Found','New','Dupes','Updated','Errors','Status'].map(h=>(
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {syncLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">{formatDateTime(log.syncedAt)}</td>
                      <td className="px-3 py-2.5 text-xs font-medium text-gray-800 max-w-36 truncate">{log.formName}</td>
                      <td className="px-3 py-2.5 text-xs text-center">{log.recordsFound}</td>
                      <td className="px-3 py-2.5 text-xs text-center text-green-600 font-bold">{log.newLeads}</td>
                      <td className="px-3 py-2.5 text-xs text-center text-amber-600 font-medium">{log.duplicates}</td>
                      <td className="px-3 py-2.5 text-xs text-center text-blue-600 font-medium">{log.updated}</td>
                      <td className="px-3 py-2.5 text-xs text-center text-red-600 font-medium">{log.errors}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                          log.status==='SUCCESS'?'bg-green-100 text-green-700':log.status==='PARTIAL'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'
                        )}>{log.status}</span>
                        {log.errorMessage && <p className="text-xs text-red-500 mt-0.5 max-w-48" title={log.errorMessage}>{log.errorMessage.slice(0,60)}{log.errorMessage.length>60?'…':''}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Modal>

      {/* ─── Form Stats Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={showStats} onClose={() => setShowStats(false)} title={`Stats — ${selectedForm?.name}`} size="md">
        {selectedForm && (() => {
          const fl = formLeads(selectedForm.id);
          const byStatus: Record<string, number> = {};
          fl.forEach(l => { byStatus[l.status] = (byStatus[l.status] || 0) + 1; });
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:'Total Leads', v: fl.length, color:'text-blue-700 bg-blue-50' },
                  { label:'Converted', v: fl.filter(l=>l.status==='CONVERTED').length, color:'text-green-700 bg-green-50' },
                  { label:'Interested', v: fl.filter(l=>l.status==='INTERESTED').length, color:'text-teal-700 bg-teal-50' },
                  { label:'Lost/Not Int.', v: fl.filter(l=>['LOST','NOT_INTERESTED'].includes(l.status)).length, color:'text-red-700 bg-red-50' },
                ].map(s=>(
                  <div key={s.label} className={cn('rounded-xl p-3 text-center', s.color)}>
                    <p className="text-2xl font-bold">{s.v}</p>
                    <p className="text-xs mt-0.5 opacity-80">{s.label}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">By Status</p>
                {Object.entries(byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-gray-500 w-32 flex-shrink-0">{status.replace(/_/g,' ')}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{width:`${fl.length?(count/fl.length*100):0}%`}} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-5 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">{num}</div>
      <div>
        <p className="font-semibold text-gray-800 text-sm">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
