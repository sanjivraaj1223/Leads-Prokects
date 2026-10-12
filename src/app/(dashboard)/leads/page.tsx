'use client';
import { useMemo, useState } from 'react';
import { Plus, Download, Filter, Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { useCRMStore } from '@/lib/store';
import { LeadTable } from '@/components/leads/LeadTable';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { ALL_STATUSES, STATUS_LABELS, filterLeadsByDate, generateId } from '@/lib/utils';
import type { Lead, LeadStatus, LeadPriority, LeadSource } from '@/types';
import { DateFilter } from '@/components/dashboard/DateFilter';

export default function LeadsPage() {
  const { leads, employees, courses, forms, addLead, updateLead, dateFilter, searchQuery } = useCRMStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [formFilter, setFormFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 25;

  const [form, setForm] = useState({ name:'', phone:'', email:'', college:'', course:'', year:'', location:'', leadSource:'GOOGLE_FORM' as LeadSource, status:'NEW' as LeadStatus, priority:'MEDIUM' as LeadPriority, expectedValue:'', notes:'' });

  const filtered = useMemo(() => {
    let l = filterLeadsByDate(leads, dateFilter);
    if (statusFilter !== 'all') l = l.filter(x => x.status === statusFilter);
    if (courseFilter !== 'all') l = l.filter(x => x.course === courseFilter);
    if (employeeFilter !== 'all') l = l.filter(x => x.assignedEmployeeId === employeeFilter);
    if (formFilter !== 'all') l = l.filter(x => x.sourceFormId === formFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      l = l.filter(x => x.name.toLowerCase().includes(q) || x.phone.includes(q) || (x.email?.toLowerCase().includes(q)) || x.leadId.toLowerCase().includes(q) || (x.college?.toLowerCase().includes(q)));
    }
    return l;
  }, [leads, dateFilter, statusFilter, courseFilter, employeeFilter, formFilter, searchQuery]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const handleAdd = () => {
    if (!form.name || !form.phone) return;
    addLead({
      id: generateId(), leadId: `GUH${String(leads.length + 1001).padStart(5,'0')}`,
      name: form.name, phone: form.phone, email: form.email || undefined, college: form.college || undefined,
      course: form.course || undefined, year: form.year || undefined, location: form.location || undefined,
      leadSource: form.leadSource, status: form.status, priority: form.priority,
      expectedValue: form.expectedValue ? Number(form.expectedValue) : undefined,
      notes: form.notes || undefined, createdAt: new Date().toISOString(),
      submissionCount: 1, isDuplicate: false,
    });
    setShowAdd(false);
    setForm({ name:'', phone:'', email:'', college:'', course:'', year:'', location:'', leadSource:'GOOGLE_FORM', status:'NEW', priority:'MEDIUM', expectedValue:'', notes:'' });
  };

  const handleStatusChange = (newStatus: LeadStatus) => {
    if (!selectedLead) return;
    updateLead(selectedLead.id, { status: newStatus, lastContacted: new Date().toISOString() });
    setShowStatusModal(false);
  };

  const handleAssign = (employeeId: string) => {
    if (!selectedLead) return;
    const emp = employees.find(e => e.id === employeeId);
    updateLead(selectedLead.id, { assignedEmployeeId: employeeId, assignedEmployeeName: emp?.name });
    setShowAssignModal(false);
  };

  const exportCSV = () => {
    const headers = 'Lead ID,Name,Phone,Email,College,Course,Source Form,Status,Priority,Employee,Created,Value\n';
    const rows = filtered.map(l => [l.leadId,l.name,l.phone,l.email||'',l.college||'',l.course||'',l.sourceForm||'',l.status,l.priority,l.assignedEmployeeName||'',l.createdAt,l.expectedValue||''].join(',')).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'leads.csv'; a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500">{filtered.length} leads found</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4" /> Export CSV</Button>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Lead</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <DateFilter />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-blue-400">
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select value={courseFilter} onChange={e => { setCourseFilter(e.target.value); setPage(1); }} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-blue-400">
            <option value="all">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select value={employeeFilter} onChange={e => { setEmployeeFilter(e.target.value); setPage(1); }} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-blue-400">
            <option value="all">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select value={formFilter} onChange={e => { setFormFilter(e.target.value); setPage(1); }} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-blue-400">
            <option value="all">All Forms</option>
            {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button onClick={() => { setStatusFilter('all'); setCourseFilter('all'); setEmployeeFilter('all'); setFormFilter('all'); }} className="text-xs text-gray-500 hover:text-gray-700">Clear filters</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 && leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="text-5xl">👥</div>
            <p className="text-xl font-semibold text-gray-700">No leads yet</p>
            <p className="text-sm text-gray-400 max-w-sm text-center">
              Connect a Google Form and leads will appear here automatically when someone submits the form.
            </p>
            <Link href="/google-forms">
              <Button size="sm">Connect Google Form</Button>
            </Link>
          </div>
        ) : (
          <LeadTable
          leads={paged}
          onEdit={(lead) => { setSelectedLead(lead); }}
          onStatusChange={(lead) => { setSelectedLead(lead); setShowStatusModal(true); }}
          onAssign={(lead) => { setSelectedLead(lead); setShowAssignModal(true); }}
        />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Showing {(page-1)*perPage+1}–{Math.min(page*perPage,filtered.length)} of {filtered.length}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="xs" disabled={page === 1} onClick={() => setPage(p => p-1)}>Prev</Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <Button key={p} variant={p === page ? 'primary' : 'outline'} size="xs" onClick={() => setPage(p)}>{p}</Button>
                );
              })}
              <Button variant="outline" size="xs" disabled={page === totalPages} onClick={() => setPage(p => p+1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Lead" size="xl">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Full Name *" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Student name" />
          <Input label="Phone *" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="Mobile number" />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="Email address" />
          <Input label="College" value={form.college} onChange={e => setForm(f=>({...f,college:e.target.value}))} placeholder="College name" />
          <Select label="Course" value={form.course} onChange={e => setForm(f=>({...f,course:e.target.value}))} options={[{value:'',label:'Select course'},...courses.map(c=>({value:c.name,label:c.name}))]} />
          <Select label="Year of Study" value={form.year} onChange={e => setForm(f=>({...f,year:e.target.value}))} options={[{value:'',label:'Select year'},{value:'1',label:'1st Year'},{value:'2',label:'2nd Year'},{value:'3',label:'3rd Year'},{value:'4',label:'4th Year'},{value:'Pass out',label:'Pass out'}]} />
          <Input label="Location" value={form.location} onChange={e => setForm(f=>({...f,location:e.target.value}))} placeholder="City" />
          <Select label="Lead Source" value={form.leadSource} onChange={e => setForm(f=>({...f,leadSource:e.target.value as LeadSource}))} options={[{value:'GOOGLE_FORM',label:'Google Form'},{value:'WEBSITE',label:'Website'},{value:'WHATSAPP',label:'WhatsApp'},{value:'INSTAGRAM',label:'Instagram'},{value:'LINKEDIN',label:'LinkedIn'},{value:'COLLEGE_SEMINAR',label:'College Seminar'},{value:'WORKSHOP',label:'Workshop'},{value:'REFERRAL',label:'Referral'},{value:'DIRECT',label:'Direct'}]} />
          <Select label="Status" value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value as LeadStatus}))} options={ALL_STATUSES.map(s=>({value:s,label:STATUS_LABELS[s]}))} />
          <Select label="Priority" value={form.priority} onChange={e => setForm(f=>({...f,priority:e.target.value as LeadPriority}))} options={[{value:'LOW',label:'Low'},{value:'MEDIUM',label:'Medium'},{value:'HIGH',label:'High'},{value:'URGENT',label:'Urgent'}]} />
          <Input label="Expected Value (₹)" type="number" value={form.expectedValue} onChange={e => setForm(f=>({...f,expectedValue:e.target.value}))} placeholder="35000" />
          <div className="col-span-2">
            <Textarea label="Notes" value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} placeholder="Any notes about this lead..." />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button className="flex-1" onClick={handleAdd}>Add Lead</Button>
          <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* Status Change Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title={`Change Status — ${selectedLead?.name}`} size="sm">
        <div className="grid grid-cols-2 gap-2">
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => handleStatusChange(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${selectedLead?.status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title={`Assign Lead — ${selectedLead?.name}`} size="sm">
        <div className="space-y-2">
          {employees.filter(e => e.status === 'ACTIVE').map(e => (
            <button key={e.id} onClick={() => handleAssign(e.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${selectedLead?.assignedEmployeeId === e.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-gray-100'}`}>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">{e.name.charAt(0)}</div>
              <div className="text-left">
                <p className="font-medium text-gray-900">{e.name}</p>
                <p className="text-xs text-gray-500">{e.role.replace('_',' ')}</p>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
