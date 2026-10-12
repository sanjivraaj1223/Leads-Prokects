'use client';
import { useState } from 'react';
import { useCRMStore } from '@/lib/store';
import { initFirebase } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import type { FirebaseConfig } from '@/types';
import {
  Settings, Link, Bell, Shield, RefreshCw, Database,
  ChevronRight, Zap, CheckCircle, AlertTriangle, ExternalLink, Copy,
} from 'lucide-react';

type Section = 'general' | 'firebase' | 'google' | 'assignment' | 'duplicates' | 'notifications' | 'permissions';

const SECTIONS = [
  { key: 'general' as Section,       icon: Settings,  label: 'General' },
  { key: 'firebase' as Section,      icon: Zap,       label: 'Firebase Setup' },
  { key: 'google' as Section,        icon: Link,      label: 'Google Sheets' },
  { key: 'assignment' as Section,    icon: RefreshCw, label: 'Lead Assignment' },
  { key: 'duplicates' as Section,    icon: Database,  label: 'Duplicate Rules' },
  { key: 'notifications' as Section, icon: Bell,      label: 'Notifications' },
  { key: 'permissions' as Section,   icon: Shield,    label: 'Permissions' },
];

export default function SettingsPage() {
  const { employees, firebaseConfig, firebaseConnected, setFirebaseConfig, setFirebaseConnected } = useCRMStore();
  const [section, setSection] = useState<Section>('firebase');
  const [saved, setSaved] = useState(false);
  const [fbConnecting, setFbConnecting] = useState(false);
  const [fbError, setFbError] = useState('');

  // Firebase form state
  const [fbCfg, setFbCfg] = useState<FirebaseConfig>(firebaseConfig ?? {
    apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '',
  });
  const [fbJsonPaste, setFbJsonPaste] = useState('');

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const handleFbJsonPaste = (json: string) => {
    setFbJsonPaste(json);
    try {
      const parsed = JSON.parse(json);
      // Support both direct config object and firebaseConfig nested object
      const cfg = parsed.firebaseConfig ?? parsed;
      if (cfg.apiKey) {
        setFbCfg({ apiKey: cfg.apiKey, authDomain: cfg.authDomain, projectId: cfg.projectId, storageBucket: cfg.storageBucket, messagingSenderId: cfg.messagingSenderId, appId: cfg.appId });
        setFbError('');
      }
    } catch { /* not valid JSON yet */ }
  };

  const handleConnectFirebase = async () => {
    if (!fbCfg.apiKey || !fbCfg.projectId) { setFbError('API Key and Project ID are required'); return; }
    setFbConnecting(true); setFbError('');
    try {
      initFirebase(fbCfg);
      setFirebaseConfig(fbCfg);
      setFirebaseConnected(true);
    } catch (err) {
      setFbError(err instanceof Error ? err.message : 'Connection failed');
      setFirebaseConnected(false);
    }
    setFbConnecting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure your CRM preferences and integrations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {SECTIONS.map(s => (
              <button key={s.key} onClick={() => setSection(s.key)}
                className={cn('w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 last:border-0',
                  section === s.key ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                )}>
                <div className="flex items-center gap-3">
                  <s.icon className={cn('w-4 h-4', section === s.key ? 'text-blue-600' : 'text-gray-400')} />
                  <span className="text-sm font-medium">{s.label}</span>
                </div>
                <ChevronRight className={cn('w-4 h-4', section === s.key ? 'text-blue-400' : 'text-gray-300')} />
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            {section === 'firebase' && (
              <div className="space-y-5">
                <SectionHeader title="Firebase" desc="Real-time database for instant lead capture" />

                {/* Always-connected status */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-800 text-sm">Firebase Connected — Guhanix Project</p>
                    <p className="text-xs text-green-700 mt-0.5">Project ID: <code className="bg-green-100 px-1 rounded">leads-c1147</code> · Real-time listeners active</p>
                    <p className="text-xs text-green-600 mt-1">Every form submission instantly creates a lead in your CRM.</p>
                  </div>
                </div>

                {/* Current config display */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Active Firebase Config</p>
                  </div>
                  <div className="p-4 font-mono text-xs space-y-1.5 text-gray-700">
                    <p><span className="text-purple-600">projectId:</span> <span className="text-green-700">leads-c1147</span></p>
                    <p><span className="text-purple-600">authDomain:</span> <span className="text-green-700">leads-c1147.firebaseapp.com</span></p>
                    <p><span className="text-purple-600">appId:</span> <span className="text-green-700">1:693840437111:web:2963a...</span></p>
                    <p><span className="text-purple-600">apiKey:</span> <span className="text-green-700">AIzaSyD6K1q... (configured)</span></p>
                  </div>
                </div>

                {/* Firestore rules reminder */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="font-semibold text-amber-800 text-sm mb-2">⚠️ Enable Firestore in your Firebase Console</p>
                  <p className="text-xs text-amber-700 mb-3">If you haven't already, you need to create the Firestore database:</p>
                  <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside mb-3">
                    <li>Go to <strong>console.firebase.google.com</strong></li>
                    <li>Select project <strong>leads-c1147</strong></li>
                    <li>Click <strong>Build → Firestore Database</strong></li>
                    <li>Click <strong>Create database</strong> → choose <strong>Test mode</strong></li>
                    <li>Done — form submissions will now save in real time</li>
                  </ol>
                  <a href="https://console.firebase.google.com/project/leads-c1147/firestore" target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm"><ExternalLink className="w-3.5 h-3.5" /> Open Firestore Console</Button>
                  </a>
                </div>

                {/* Firestore security rules */}
                <div className="bg-slate-900 rounded-xl p-4">
                  <p className="text-slate-400 text-xs mb-2 font-mono">Firestore Security Rules (paste in Console → Rules tab)</p>
                  <pre className="text-green-400 text-xs font-mono overflow-x-auto">{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public form submissions
    match /crm_forms/{formId}/submissions/{docId} {
      allow create: if true;
      allow read: if false; // only backend reads
    }
    // Block everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`}</pre>
                </div>

                {/* Override with different config */}
                <details className="border border-gray-200 rounded-xl overflow-hidden">
                  <summary className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 list-none flex items-center justify-between">
                    Use a different Firebase project
                    <span className="text-xs text-gray-400">Advanced</span>
                  </summary>
                  <div className="p-4 border-t border-gray-100 space-y-3">
                    <p className="text-xs text-gray-500">Paste your Firebase config JSON to override the default project.</p>
                    <textarea
                      value={fbJsonPaste}
                      onChange={e => handleFbJsonPaste(e.target.value)}
                      rows={4}
                      placeholder={'{\n  "apiKey": "...",\n  "projectId": "..."\n}'}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-blue-400 font-mono resize-none"
                    />
                    {fbCfg.apiKey && fbCfg.projectId !== 'leads-c1147' && (
                      <Button className="w-full" onClick={handleConnectFirebase} disabled={fbConnecting}>
                        {fbConnecting ? 'Connecting...' : 'Switch to New Project'}
                      </Button>
                    )}
                    {fbError && <p className="text-xs text-red-600">{fbError}</p>}
                  </div>
                </details>
              </div>
            )}

            {section === 'general' && (
              <div className="space-y-5">
                <SectionHeader title="General Settings" desc="Company info and basic preferences" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Company Name" defaultValue="Guhanix Technology" />
                  <Input label="Company Email" defaultValue="info@guhanix.com" />
                  <Input label="Phone" defaultValue="+91 98765 43210" />
                  <Input label="Website" defaultValue="https://guhanix.com" />
                  <div className="col-span-2"><Textarea label="Address" defaultValue="Chennai, Tamil Nadu, India" rows={2} /></div>
                  <Select label="Timezone" defaultValue="Asia/Kolkata" options={[{value:'Asia/Kolkata',label:'IST (Asia/Kolkata)'},{value:'UTC',label:'UTC'}]} />
                  <Select label="Currency" defaultValue="INR" options={[{value:'INR',label:'INR (₹)'},{value:'USD',label:'USD ($)'}]} />
                </div>
                <SaveButton onSave={handleSave} saved={saved} />
              </div>
            )}

            {section === 'google' && (
              <div className="space-y-5">
                <SectionHeader title="Google Integration" desc="Configure Google Sheets API access for form sync" />
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <strong>Setup Required:</strong> To enable automatic Google Sheets sync, you need a Google Cloud Service Account with Sheets API access.
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Service Account Email</label>
                    <Input className="mt-1" placeholder="service-account@your-project.iam.gserviceaccount.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Service Account JSON Key</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors">
                      <p className="text-sm text-gray-500">Drop your service-account.json here or click to upload</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Select label="Sync Frequency" options={[{value:'15',label:'Every 15 minutes'},{value:'30',label:'Every 30 minutes'},{value:'60',label:'Every hour'},{value:'0',label:'Manual only'}]} />
                    <Select label="Duplicate Detection" options={[{value:'phone_email',label:'Phone + Email'},{value:'phone',label:'Phone only'},{value:'email',label:'Email only'}]} />
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700 space-y-1">
                  <p className="font-semibold">Steps to enable auto-sync:</p>
                  <p>1. Create a Google Cloud project at console.cloud.google.com</p>
                  <p>2. Enable Google Sheets API</p>
                  <p>3. Create a Service Account and download JSON key</p>
                  <p>4. Share each linked Google Sheet with the service account email (Editor access)</p>
                  <p>5. Paste the Spreadsheet ID when connecting a form above</p>
                </div>
                <SaveButton onSave={handleSave} saved={saved} />
              </div>
            )}

            {section === 'assignment' && (
              <div className="space-y-5">
                <SectionHeader title="Lead Assignment Rules" desc="Control how leads are distributed to employees" />
                <div className="space-y-4">
                  <div className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">Auto Assignment</p>
                        <p className="text-xs text-gray-500">Automatically assign new leads to employees</p>
                      </div>
                      <Toggle defaultChecked />
                    </div>
                    <Select label="Assignment Strategy" options={[{value:'round_robin',label:'Round Robin (Fair rotation)'},{value:'least_assigned',label:'Least Assigned (Balance load)'},{value:'random',label:'Random'},{value:'manual',label:'Manual only'}]} />
                  </div>
                  <div className="border border-gray-100 rounded-xl p-4">
                    <p className="font-medium text-gray-900 mb-2">Assign to Employees</p>
                    <p className="text-xs text-gray-500 mb-3">Select which employees participate in auto-assignment</p>
                    <div className="space-y-2">
                      {employees.filter(e => e.status === 'ACTIVE').map(emp => (
                        <label key={emp.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                          <input type="checkbox" defaultChecked={['SALES_EXECUTIVE','COUNSELLOR'].includes(emp.role)} className="rounded" />
                          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">{emp.name.charAt(0)}</div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{emp.name}</p>
                            <p className="text-xs text-gray-500">{emp.role.replace(/_/g,' ')}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <SaveButton onSave={handleSave} saved={saved} />
              </div>
            )}

            {section === 'duplicates' && (
              <div className="space-y-5">
                <SectionHeader title="Duplicate Detection Rules" desc="How the system handles duplicate lead submissions" />
                <div className="space-y-4">
                  <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                    <p className="font-medium text-gray-900">Detection Method</p>
                    {[
                      { id: 'phone_email', label: 'Phone + Email (Recommended)', desc: 'Flag if same phone OR same email already exists' },
                      { id: 'phone', label: 'Phone Number Only', desc: 'Flag only if same mobile number exists' },
                      { id: 'email', label: 'Email Address Only', desc: 'Flag only if same email exists' },
                    ].map(opt => (
                      <label key={opt.id} className="flex items-start gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                        <input type="radio" name="dup" defaultChecked={opt.id === 'phone_email'} className="mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                          <p className="text-xs text-gray-500">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                    <p className="font-medium text-gray-900">When Duplicate Detected</p>
                    {[
                      { id: 'update', label: 'Update existing lead', desc: 'Add new form submission to source history, increment counter' },
                      { id: 'skip', label: 'Skip silently', desc: 'Ignore the duplicate without updating' },
                      { id: 'notify', label: 'Notify assigned employee', desc: 'Send notification that this person re-submitted' },
                    ].map(opt => (
                      <label key={opt.id} className="flex items-start gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                        <input type="checkbox" defaultChecked={opt.id !== 'skip'} className="mt-0.5 rounded" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                          <p className="text-xs text-gray-500">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <SaveButton onSave={handleSave} saved={saved} />
              </div>
            )}

            {section === 'notifications' && (
              <div className="space-y-5">
                <SectionHeader title="Notification Settings" desc="Control which events trigger notifications" />
                <div className="space-y-2">
                  {[
                    { label: 'New lead received', desc: 'When a new lead is imported from any form' },
                    { label: 'Follow-up due today', desc: 'Morning digest of today\'s follow-ups' },
                    { label: 'Follow-up overdue', desc: 'Alert when follow-up is not completed on time' },
                    { label: 'Lead assigned to me', desc: 'When a lead is assigned to you' },
                    { label: 'Payment pending reminder', desc: 'Reminder for leads in payment pending status' },
                    { label: 'Lead converted', desc: 'Celebration notification when a deal closes' },
                    { label: 'Google Form sync failure', desc: 'Alert when a form sync encounters errors' },
                    { label: 'Duplicate lead detected', desc: 'When a form submission matches existing lead' },
                  ].map(n => (
                    <label key={n.label} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{n.label}</p>
                        <p className="text-xs text-gray-500">{n.desc}</p>
                      </div>
                      <Toggle defaultChecked />
                    </label>
                  ))}
                </div>
                <SaveButton onSave={handleSave} saved={saved} />
              </div>
            )}

            {section === 'permissions' && (
              <div className="space-y-5">
                <SectionHeader title="Role Permissions" desc="What each role can access and modify" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Permission</th>
                        {['Admin','Manager','Sales Exec','Counsellor','Employee'].map(r => (
                          <th key={r} className="px-3 py-2 text-center text-xs font-semibold text-gray-500">{r}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[
                        { label: 'View all leads',          perms: [true, true, false, false, false] },
                        { label: 'View own leads',           perms: [true, true, true, true, true] },
                        { label: 'Add/Edit leads',           perms: [true, true, true, true, false] },
                        { label: 'Delete leads',             perms: [true, true, false, false, false] },
                        { label: 'View all employees',       perms: [true, true, true, false, false] },
                        { label: 'Manage employees',         perms: [true, false, false, false, false] },
                        { label: 'Connect Google Forms',     perms: [true, true, false, false, false] },
                        { label: 'View reports',             perms: [true, true, true, false, false] },
                        { label: 'Export data',              perms: [true, true, false, false, false] },
                        { label: 'Manage settings',          perms: [true, false, false, false, false] },
                      ].map(row => (
                        <tr key={row.label} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 text-sm text-gray-700">{row.label}</td>
                          {row.perms.map((allowed, i) => (
                            <td key={i} className="px-3 py-2.5 text-center">
                              {allowed
                                ? <span className="text-green-500">✓</span>
                                : <span className="text-gray-200">✗</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="pb-4 border-b border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
    </div>
  );
}

function SaveButton({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <Button onClick={onSave}>{saved ? '✓ Saved!' : 'Save Changes'}</Button>
      {saved && <span className="text-sm text-green-600 font-medium">Settings saved successfully</span>}
    </div>
  );
}

function Toggle({ defaultChecked }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked ?? false);
  return (
    <button onClick={() => setOn(!on)} className={cn('relative w-10 h-5 rounded-full transition-colors flex-shrink-0', on ? 'bg-blue-600' : 'bg-gray-200')}>
      <span className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all', on ? 'left-5' : 'left-0.5')} />
    </button>
  );
}
