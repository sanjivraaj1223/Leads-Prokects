'use client';
import { useState, useMemo } from 'react';
import { useCRMStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { cn, formatCurrency, generateId } from '@/lib/utils';
import type { Course } from '@/types';
import { Plus, Edit, BookOpen, Users, DollarSign, TrendingUp, Star } from 'lucide-react';

export default function CoursesPage() {
  const { courses, leads, addCourse, updateCourse, deleteCourse } = useCRMStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<{ name: string; description: string; duration: string; fee: string; category: string; status: 'ACTIVE' | 'INACTIVE' }>({ name: '', description: '', duration: '', fee: '', category: '', status: 'ACTIVE' });

  const stats = useMemo(() => courses.map(c => {
    const courseLeads = leads.filter(l => l.course === c.name);
    const interested = courseLeads.filter(l => ['INTERESTED','DEMO_SCHEDULED','PAYMENT_PENDING','CONVERTED'].includes(l.status)).length;
    const paymentPending = courseLeads.filter(l => l.status === 'PAYMENT_PENDING').length;
    const converted = courseLeads.filter(l => l.status === 'CONVERTED').length;
    const revenue = courseLeads.filter(l => l.status === 'CONVERTED').reduce((s, l) => s + (l.payment?.amount || c.fee || 0), 0);
    const convRate = courseLeads.length ? ((converted / courseLeads.length) * 100).toFixed(1) : '0';
    return { ...c, totalLeads: courseLeads.length, interested, paymentPending, converted, revenue, convRate };
  }), [courses, leads]);

  const openAdd = () => { setEditing(null); setForm({ name: '', description: '', duration: '', fee: '', category: '', status: 'ACTIVE' }); setShowModal(true); };
  const openEdit = (c: Course) => { setEditing(c); setForm({ name: c.name, description: c.description || '', duration: c.duration || '', fee: String(c.fee || ''), category: c.category || '', status: c.status }); setShowModal(true); };

  const handleSave = () => {
    if (!form.name) return;
    const data = { ...form, fee: form.fee ? Number(form.fee) : undefined };
    if (editing) updateCourse(editing.id, data);
    else addCourse({ id: generateId(), ...data });
    setShowModal(false);
  };

  const totalRevenue = stats.reduce((s, c) => s + c.revenue, 0);
  const totalConverted = stats.reduce((s, c) => s + c.converted, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{courses.filter(c => c.status === 'ACTIVE').length} active courses</p>
        </div>
        <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Add Course</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard icon={<BookOpen className="w-5 h-5 text-blue-600" />} label="Total Courses" value={courses.length} bg="bg-blue-50" />
        <SummaryCard icon={<Users className="w-5 h-5 text-purple-600" />} label="Total Leads" value={stats.reduce((s,c) => s+c.totalLeads, 0)} bg="bg-purple-50" />
        <SummaryCard icon={<TrendingUp className="w-5 h-5 text-green-600" />} label="Converted" value={totalConverted} bg="bg-green-50" />
        <SummaryCard icon={<DollarSign className="w-5 h-5 text-amber-600" />} label="Revenue" value={formatCurrency(totalRevenue)} bg="bg-amber-50" />
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map(course => (
          <div key={course.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className={cn('h-1.5', course.status === 'ACTIVE' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gray-200')} />
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">{course.name}</h3>
                  {course.category && <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-1 inline-block">{course.category}</span>}
                </div>
                <button onClick={() => openEdit(course)} className="p-1 text-gray-400 hover:text-blue-600 rounded-lg ml-2 flex-shrink-0"><Edit className="w-3.5 h-3.5" /></button>
              </div>
              {course.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{course.description}</p>}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                {course.duration && <span>⏱ {course.duration}</span>}
                {course.fee && <span className="font-semibold text-gray-800">{formatCurrency(course.fee)}</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{course.totalLeads}</p>
                  <p className="text-xs text-gray-400">Leads</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{course.converted}</p>
                  <p className="text-xs text-gray-400">Enrolled</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-amber-600">{course.paymentPending}</p>
                  <p className="text-xs text-gray-400">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-blue-600">{course.convRate}%</p>
                  <p className="text-xs text-gray-400">Rate</p>
                </div>
              </div>
              {course.revenue > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-400">Revenue</p>
                  <p className="text-sm font-bold text-green-600">{formatCurrency(course.revenue)}</p>
                </div>
              )}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Conversion</span><span>{course.convRate}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, parseFloat(course.convRate))}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table View */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Course Performance Table</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Course','Category','Fee','Leads','Interested','Pending','Converted','Revenue','Conv.%','Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.category || '—'}</td>
                  <td className="px-4 py-3 text-xs font-medium text-gray-700">{c.fee ? formatCurrency(c.fee) : '—'}</td>
                  <td className="px-4 py-3 font-semibold">{c.totalLeads}</td>
                  <td className="px-4 py-3 text-teal-600 font-medium">{c.interested}</td>
                  <td className="px-4 py-3 text-amber-600 font-medium">{c.paymentPending}</td>
                  <td className="px-4 py-3 text-green-600 font-bold">{c.converted}</td>
                  <td className="px-4 py-3 text-xs font-medium">{c.revenue > 0 ? formatCurrency(c.revenue) : '—'}</td>
                  <td className="px-4 py-3 text-blue-600 font-medium">{c.convRate}%</td>
                  <td className="px-4 py-3"><span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Course' : 'Add Course'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Input label="Course Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Full Stack Web Development" /></div>
          <div className="col-span-2"><Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." /></div>
          <Input label="Duration" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="6 months" />
          <Input label="Fee (₹)" type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} placeholder="35000" />
          <Input label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Web Development, AI/ML..." />
          <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'ACTIVE'|'INACTIVE' }))} options={[{value:'ACTIVE',label:'Active'},{value:'INACTIVE',label:'Inactive'}]} />
        </div>
        <div className="flex gap-2 mt-5">
          <Button className="flex-1" onClick={handleSave}>{editing ? 'Save Changes' : 'Add Course'}</Button>
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}

function SummaryCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string | number; bg: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>{icon}</div>
      <div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
