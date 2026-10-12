'use client';
import { useState, useMemo } from 'react';
import { useCRMStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { cn, formatDate, generateId } from '@/lib/utils';
import type { Employee, EmployeeRole } from '@/types';
import { Plus, Edit, Trash2, UserCheck, Phone, Mail, Award, TrendingUp } from 'lucide-react';

const ROLES: { value: EmployeeRole; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'SALES_EXECUTIVE', label: 'Sales Executive' },
  { value: 'COUNSELLOR', label: 'Counsellor' },
  { value: 'EMPLOYEE', label: 'Employee' },
];

const ROLE_COLORS: Record<EmployeeRole, string> = {
  ADMIN:           'bg-purple-100 text-purple-700',
  MANAGER:         'bg-blue-100 text-blue-700',
  SALES_EXECUTIVE: 'bg-teal-100 text-teal-700',
  COUNSELLOR:      'bg-amber-100 text-amber-700',
  EMPLOYEE:        'bg-gray-100 text-gray-700',
};

const emptyForm: { name: string; employeeId: string; email: string; phone: string; department: string; role: EmployeeRole; joiningDate: string; status: 'ACTIVE' | 'INACTIVE' } = { name: '', employeeId: '', email: '', phone: '', department: '', role: 'SALES_EXECUTIVE', joiningDate: '', status: 'ACTIVE' };

export default function EmployeesPage() {
  const { employees, leads, addEmployee, updateEmployee, deleteEmployee } = useCRMStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);

  const performance = useMemo(() => employees.map(emp => {
    const assigned = leads.filter(l => l.assignedEmployeeId === emp.id);
    const contacted = assigned.filter(l => ['CONTACTED','CALLBACK','INTERESTED','FOLLOW_UP','DEMO_SCHEDULED','PAYMENT_PENDING','CONVERTED'].includes(l.status)).length;
    const interested = assigned.filter(l => ['INTERESTED','DEMO_SCHEDULED','PAYMENT_PENDING','CONVERTED'].includes(l.status)).length;
    const converted = assigned.filter(l => l.status === 'CONVERTED').length;
    const revenue = assigned.filter(l => l.status === 'CONVERTED').reduce((s, l) => s + (l.payment?.amount || l.expectedValue || 0), 0);
    return { ...emp, assigned: assigned.length, contacted, interested, converted, revenue, convRate: assigned.length ? ((converted / assigned.length) * 100).toFixed(1) : '0' };
  }), [employees, leads]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({ name: emp.name, employeeId: emp.employeeId, email: emp.email, phone: emp.phone, department: emp.department, role: emp.role, joiningDate: emp.joiningDate, status: emp.status });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email) return;
    if (editing) {
      updateEmployee(editing.id, form);
    } else {
      addEmployee({ id: generateId(), ...form });
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500 mt-0.5">{employees.filter(e => e.status === 'ACTIVE').length} active team members</p>
        </div>
        <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Add Employee</Button>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-600" />Team Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Employee','Role','Leads','Contacted','Interested','Converted','Conv.%','Revenue','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {performance.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">{emp.name.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-gray-900">{emp.name}</p>
                        <p className="text-xs text-gray-400">{emp.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ROLE_COLORS[emp.role])}>{emp.role.replace(/_/g,' ')}</span></td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{emp.assigned}</td>
                  <td className="px-4 py-3 text-purple-700 font-medium">{emp.contacted}</td>
                  <td className="px-4 py-3 text-teal-700 font-medium">{emp.interested}</td>
                  <td className="px-4 py-3 text-green-700 font-bold">{emp.converted}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, parseFloat(emp.convRate))}%` }} />
                      </div>
                      <span className="text-xs font-medium text-blue-600">{emp.convRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-gray-700">₹{emp.revenue.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {performance.map(emp => (
          <div key={emp.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white text-lg font-bold">{emp.name.charAt(0)}</div>
                <div>
                  <h3 className="font-semibold text-gray-900">{emp.name}</h3>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ROLE_COLORS[emp.role])}>{emp.role.replace(/_/g,' ')}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(emp)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                <button onClick={() => deleteEmployee(emp.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-gray-500 mb-4">
              <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{emp.email}</div>
              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{emp.phone}</div>
              <div className="flex items-center gap-2"><Award className="w-3.5 h-3.5" />{emp.department} · Joined {formatDate(emp.joiningDate)}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{emp.assigned}</p>
                <p className="text-xs text-gray-400">Leads</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">{emp.converted}</p>
                <p className="text-xs text-gray-400">Converted</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">{emp.convRate}%</p>
                <p className="text-xs text-gray-400">Rate</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Employee' : 'Add Employee'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Full Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Employee name" />
          <Input label="Employee ID" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} placeholder="GUH001" />
          <Input label="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@guhanix.com" />
          <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Mobile number" />
          <Input label="Department" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="Sales, Counseling..." />
          <Select label="Role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as EmployeeRole }))} options={ROLES} />
          <Input label="Joining Date" type="date" value={form.joiningDate} onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))} />
          <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'ACTIVE' | 'INACTIVE' }))} options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]} />
        </div>
        <div className="flex gap-2 mt-5">
          <Button className="flex-1" onClick={handleSave}>{editing ? 'Save Changes' : 'Add Employee'}</Button>
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
