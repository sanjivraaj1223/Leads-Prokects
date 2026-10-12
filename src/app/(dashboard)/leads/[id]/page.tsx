'use client';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCRMStore } from '@/lib/store';
import { StatusBadge } from '@/components/leads/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { cn, formatCurrency, formatDate, formatDateTime, STATUS_LABELS, ALL_STATUSES, PRIORITY_COLORS, generateId } from '@/lib/utils';
import type { LeadStatus, ActivityType } from '@/types';
import {
  ArrowLeft, Phone, MessageCircle, Mail, Edit, UserCheck, CheckCircle,
  Clock, Plus, Calendar, MapPin, Building2, BookOpen, User, Star,
  AlertTriangle, DollarSign, Activity, FileText, RefreshCw
} from 'lucide-react';

const ACTIVITY_ICONS: Record<string, string> = {
  LEAD_CREATED: '🟢', CALL: '📞', WHATSAPP: '💬', EMAIL: '📧',
  MEETING: '🤝', FOLLOW_UP_ADDED: '📅', FOLLOW_UP_COMPLETED: '✅',
  NOTE_ADDED: '📝', STATUS_CHANGED: '🔄', ASSIGNED: '👤',
  PAYMENT: '💰', CONVERTED: '🎉', DEMO: '🖥️',
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { leads, employees, updateLead, addFollowUp } = useCRMStore();
  const lead = useMemo(() => leads.find(l => l.id === id), [leads, id]);

  const [showEdit, setShowEdit] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [noteType, setNoteType] = useState<ActivityType>('CALL');
  const [noteText, setNoteText] = useState('');
  const [activities, setActivities] = useState(lead?.activities || [
    { id: 'a1', leadId: id, type: 'LEAD_CREATED' as ActivityType, title: 'Lead Created', notes: `Via ${lead?.sourceForm || 'Google Form'}`, createdAt: lead?.createdAt || new Date().toISOString(), employeeId: 'emp1', employeeName: 'System' },
  ]);
  const [fuForm, setFuForm] = useState({ date: '', time: '10:00', reason: '', notes: '' });
  const [editForm, setEditForm] = useState({ name: lead?.name || '', phone: lead?.phone || '', email: lead?.email || '', college: lead?.college || '', course: lead?.course || '', year: lead?.year || '', location: lead?.location || '', priority: lead?.priority || 'MEDIUM', expectedValue: String(lead?.expectedValue || ''), notes: lead?.notes || '' });

  if (!lead) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-gray-500">Lead not found</p>
      <Button variant="outline" onClick={() => router.push('/leads')}>← Back to Leads</Button>
    </div>
  );

  const pc = PRIORITY_COLORS[lead.priority];

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const newAct = { id: generateId(), leadId: id, type: noteType, title: noteType.replace('_',' '), notes: noteText, createdAt: new Date().toISOString(), employeeId: 'emp1', employeeName: 'Rajesh Kumar' };
    setActivities(prev => [...prev, newAct]);
    updateLead(id, { lastContacted: new Date().toISOString() });
    setNoteText(''); setShowAddNote(false);
  };

  const handleFollowUp = () => {
    if (!fuForm.date) return;
    addFollowUp({ id: generateId(), leadId: id, leadName: lead.name, leadPhone: lead.phone, assignedEmployeeId: lead.assignedEmployeeId || 'emp1', assignedEmployeeName: lead.assignedEmployeeName || 'Unassigned', scheduledDate: fuForm.date, scheduledTime: fuForm.time, reason: fuForm.reason, notes: fuForm.notes, status: 'PENDING', createdAt: new Date().toISOString() });
    updateLead(id, { nextFollowUp: fuForm.date });
    setShowFollowUp(false); setFuForm({ date:'', time:'10:00', reason:'', notes:'' });
  };

  const handleStatusChange = (s: LeadStatus) => {
    updateLead(id, { status: s, lastContacted: new Date().toISOString() });
    setActivities(prev => [...prev, { id: generateId(), leadId: id, type: 'STATUS_CHANGED', title: `Status → ${STATUS_LABELS[s]}`, notes: '', createdAt: new Date().toISOString(), employeeId: 'emp1', employeeName: 'Rajesh Kumar' }]);
    setShowStatus(false);
  };

  const handleAssign = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    updateLead(id, { assignedEmployeeId: empId, assignedEmployeeName: emp?.name });
    setShowAssign(false);
  };

  const handleEditSave = () => {
    updateLead(id, { ...editForm, expectedValue: editForm.expectedValue ? Number(editForm.expectedValue) : undefined });
    setShowEdit(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => router.push('/leads')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
            <StatusBadge status={lead.status} />
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', pc.bg, pc.text)}>{lead.priority}</span>
            <span className="text-xs text-gray-400 font-mono">{lead.leadId}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href={`tel:${lead.phone}`}><Button variant="success" size="sm"><Phone className="w-4 h-4" /> Call</Button></a>
          <a href={`https://wa.me/91${lead.phone}`} target="_blank" rel="noreferrer"><Button variant="secondary" size="sm"><MessageCircle className="w-4 h-4" /> WhatsApp</Button></a>
          {lead.email && <a href={`mailto:${lead.email}`}><Button variant="secondary" size="sm"><Mail className="w-4 h-4" /> Email</Button></a>}
          <Button variant="outline" size="sm" onClick={() => setShowAddNote(true)}><Plus className="w-4 h-4" /> Add Note</Button>
          <Button variant="outline" size="sm" onClick={() => setShowFollowUp(true)}><Calendar className="w-4 h-4" /> Follow-up</Button>
          <Button size="sm" onClick={() => setShowStatus(true)}><RefreshCw className="w-4 h-4" /> Status</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Lead Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Lead Information</h2>
              <button onClick={() => setShowEdit(true)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-col items-center mb-5">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2">{lead.name.charAt(0)}</div>
              <h3 className="font-semibold text-gray-900">{lead.name}</h3>
              {lead.submissionCount > 1 && <span className="mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Submitted {lead.submissionCount} forms</span>}
            </div>
            <div className="space-y-3">
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={lead.phone} />
              <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={lead.email || '-'} />
              <InfoRow icon={<Building2 className="w-4 h-4" />} label="College" value={lead.college || '-'} />
              <InfoRow icon={<BookOpen className="w-4 h-4" />} label="Course" value={lead.course || '-'} />
              <InfoRow icon={<User className="w-4 h-4" />} label="Year" value={lead.year ? `${lead.year}${lead.year === '1' ? 'st' : lead.year === '2' ? 'nd' : lead.year === '3' ? 'rd' : 'th'} Year` : '-'} />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Location" value={lead.location || '-'} />
              <InfoRow icon={<Star className="w-4 h-4" />} label="Source" value={lead.sourceForm || lead.leadSource.replace(/_/g,' ')} />
              <InfoRow icon={<DollarSign className="w-4 h-4" />} label="Expected Value" value={lead.expectedValue ? formatCurrency(lead.expectedValue) : '-'} />
            </div>
          </div>

          {/* Assignment Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Assigned Employee</h2>
              <button onClick={() => setShowAssign(true)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><UserCheck className="w-4 h-4" /></button>
            </div>
            {lead.assignedEmployeeName ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">{lead.assignedEmployeeName.charAt(0)}</div>
                <div>
                  <p className="font-medium text-gray-900">{lead.assignedEmployeeName}</p>
                  <p className="text-xs text-gray-500">{employees.find(e=>e.id===lead.assignedEmployeeId)?.role.replace(/_/g,' ') || 'Employee'}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-2">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
                <p className="text-sm text-gray-500">Not assigned</p>
                <Button size="sm" onClick={() => setShowAssign(true)}>Assign Now</Button>
              </div>
            )}
          </div>

          {/* Follow-up Card */}
          {lead.nextFollowUp && (
            <div className={cn('rounded-xl border shadow-sm p-5', new Date(lead.nextFollowUp) < new Date() ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200')}>
              <div className="flex items-center gap-2 mb-1">
                {new Date(lead.nextFollowUp) < new Date()
                  ? <><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-sm font-semibold text-red-700">Overdue Follow-up</span></>
                  : <><Clock className="w-4 h-4 text-blue-500" /><span className="text-sm font-semibold text-blue-700">Next Follow-up</span></>}
              </div>
              <p className={cn('text-sm', new Date(lead.nextFollowUp) < new Date() ? 'text-red-600' : 'text-blue-600')}>{formatDate(lead.nextFollowUp)}</p>
            </div>
          )}

          {/* Payment Card */}
          {lead.payment && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-600" />Payment</h2>
              <div className="space-y-2">
                <InfoRow icon={<CheckCircle className="w-4 h-4" />} label="Amount" value={formatCurrency(lead.payment.amount)} />
                <InfoRow icon={<CheckCircle className="w-4 h-4" />} label="Status" value={lead.payment.paymentStatus} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date" value={formatDate(lead.payment.paymentDate || '')} />
                <InfoRow icon={<FileText className="w-4 h-4" />} label="Method" value={lead.payment.paymentMethod || '-'} />
              </div>
            </div>
          )}
        </div>

        {/* Right: Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Created</p>
              <p className="text-sm font-semibold text-gray-800">{formatDate(lead.createdAt)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Last Contacted</p>
              <p className="text-sm font-semibold text-gray-800">{lead.lastContacted ? formatDate(lead.lastContacted) : '—'}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Activities</p>
              <p className="text-sm font-semibold text-gray-800">{activities.length}</p>
            </div>
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
              <p className="text-sm text-amber-800">{lead.notes}</p>
            </div>
          )}

          {/* Add Note Bar */}
          <div className="flex gap-2">
            {(['CALL','WHATSAPP','EMAIL','MEETING','NOTE_ADDED'] as ActivityType[]).map(t => (
              <button key={t} onClick={() => { setNoteType(t); setShowAddNote(true); }}
                className="flex-1 flex flex-col items-center gap-1 py-2 px-1 bg-white rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-colors text-xs text-gray-600 font-medium">
                <span className="text-lg">{ACTIVITY_ICONS[t]}</span>
                {t.replace('_',' ')}
              </button>
            ))}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Activity className="w-4 h-4" />Activity Timeline</h2>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />
              <div className="space-y-4">
                {[...activities].reverse().map((act) => (
                  <div key={act.id} className="flex gap-4 relative">
                    <div className="flex-shrink-0 w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-base z-10">{ACTIVITY_ICONS[act.type] || '📌'}</div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-3 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className="font-medium text-sm text-gray-900">{act.title}</p>
                        <span className="text-xs text-gray-400 flex-shrink-0">{formatDateTime(act.createdAt)}</span>
                      </div>
                      {act.notes && <p className="text-sm text-gray-600 mt-1">{act.notes}</p>}
                      <p className="text-xs text-gray-400 mt-1">by {act.employeeName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      <Modal isOpen={showAddNote} onClose={() => setShowAddNote(false)} title="Add Activity Note" size="md">
        <div className="space-y-4">
          <Select label="Activity Type" value={noteType} onChange={e => setNoteType(e.target.value as ActivityType)} options={[
            {value:'CALL',label:'📞 Call'},{value:'WHATSAPP',label:'💬 WhatsApp'},{value:'EMAIL',label:'📧 Email'},
            {value:'MEETING',label:'🤝 Meeting'},{value:'NOTE_ADDED',label:'📝 Note'},{value:'DEMO',label:'🖥️ Demo'},
            {value:'PAYMENT',label:'💰 Payment'},{value:'FOLLOW_UP_ADDED',label:'📅 Follow-up'},
          ]} />
          <Textarea label="Notes" value={noteText} onChange={e => setNoteText(e.target.value)} rows={4} placeholder="What happened?" />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleAddNote}>Save Note</Button>
            <Button variant="outline" onClick={() => setShowAddNote(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Follow-up Modal */}
      <Modal isOpen={showFollowUp} onClose={() => setShowFollowUp(false)} title="Schedule Follow-up" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date *" type="date" value={fuForm.date} onChange={e => setFuForm(f=>({...f,date:e.target.value}))} />
            <Input label="Time" type="time" value={fuForm.time} onChange={e => setFuForm(f=>({...f,time:e.target.value}))} />
          </div>
          <Input label="Reason" value={fuForm.reason} onChange={e => setFuForm(f=>({...f,reason:e.target.value}))} placeholder="Course inquiry, payment follow-up..." />
          <Textarea label="Notes" value={fuForm.notes} onChange={e => setFuForm(f=>({...f,notes:e.target.value}))} placeholder="Additional notes..." />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleFollowUp}>Schedule</Button>
            <Button variant="outline" onClick={() => setShowFollowUp(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Status Modal */}
      <Modal isOpen={showStatus} onClose={() => setShowStatus(false)} title="Change Status" size="sm">
        <div className="grid grid-cols-2 gap-2">
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => handleStatusChange(s)}
              className={cn('px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors', lead.status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={showAssign} onClose={() => setShowAssign(false)} title="Assign Employee" size="sm">
        <div className="space-y-2">
          {employees.filter(e => e.status === 'ACTIVE').map(e => (
            <button key={e.id} onClick={() => handleAssign(e.id)}
              className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors border', lead.assignedEmployeeId === e.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-gray-100')}>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">{e.name.charAt(0)}</div>
              <div className="text-left">
                <p className="font-medium text-gray-900">{e.name}</p>
                <p className="text-xs text-gray-500">{e.role.replace(/_/g,' ')}</p>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Lead" size="xl">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Full Name" value={editForm.name} onChange={e => setEditForm(f=>({...f,name:e.target.value}))} />
          <Input label="Phone" value={editForm.phone} onChange={e => setEditForm(f=>({...f,phone:e.target.value}))} />
          <Input label="Email" type="email" value={editForm.email} onChange={e => setEditForm(f=>({...f,email:e.target.value}))} />
          <Input label="College" value={editForm.college} onChange={e => setEditForm(f=>({...f,college:e.target.value}))} />
          <Input label="Course" value={editForm.course} onChange={e => setEditForm(f=>({...f,course:e.target.value}))} />
          <Input label="Year" value={editForm.year} onChange={e => setEditForm(f=>({...f,year:e.target.value}))} />
          <Input label="Location" value={editForm.location} onChange={e => setEditForm(f=>({...f,location:e.target.value}))} />
          <Input label="Expected Value (₹)" type="number" value={editForm.expectedValue} onChange={e => setEditForm(f=>({...f,expectedValue:e.target.value}))} />
          <Select label="Priority" value={editForm.priority} onChange={e => setEditForm(f=>({...f,priority:e.target.value as any}))} options={[{value:'LOW',label:'Low'},{value:'MEDIUM',label:'Medium'},{value:'HIGH',label:'High'},{value:'URGENT',label:'Urgent'}]} />
          <div className="col-span-2"><Textarea label="Notes" value={editForm.notes} onChange={e => setEditForm(f=>({...f,notes:e.target.value}))} /></div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button className="flex-1" onClick={handleEditSave}>Save Changes</Button>
          <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}
