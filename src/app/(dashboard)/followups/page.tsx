'use client';
import { useMemo, useState } from 'react';
import { useCRMStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { cn, formatDate, generateId } from '@/lib/utils';
import type { FollowUp } from '@/types';
import { Phone, MessageCircle, CheckCircle, Calendar, AlertTriangle, Clock, RefreshCw, Filter } from 'lucide-react';

type Tab = 'today' | 'overdue' | 'upcoming' | 'completed';

export default function FollowUpsPage() {
  const { followUps, leads, updateFollowUp, addFollowUp } = useCRMStore();
  const [tab, setTab] = useState<Tab>('today');
  const [showReschedule, setShowReschedule] = useState(false);
  const [selected, setSelected] = useState<FollowUp | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:00');

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const categorized = useMemo(() => ({
    today: followUps.filter(f => f.status === 'PENDING' && f.scheduledDate === todayStr),
    overdue: followUps.filter(f => f.status === 'PENDING' && f.scheduledDate < todayStr),
    upcoming: followUps.filter(f => f.status === 'PENDING' && f.scheduledDate > todayStr),
    completed: followUps.filter(f => f.status === 'COMPLETED'),
  }), [followUps, todayStr]);

  const current = categorized[tab];

  const handleComplete = (fu: FollowUp) => {
    updateFollowUp(fu.id, { status: 'COMPLETED', completedAt: new Date().toISOString() });
  };

  const handleReschedule = () => {
    if (!selected || !rescheduleDate) return;
    updateFollowUp(selected.id, { status: 'RESCHEDULED', scheduledDate: rescheduleDate, scheduledTime: rescheduleTime });
    // add new pending follow-up
    addFollowUp({ ...selected, id: generateId(), scheduledDate: rescheduleDate, scheduledTime: rescheduleTime, status: 'PENDING', createdAt: new Date().toISOString() });
    setShowReschedule(false);
  };

  const tabs: { key: Tab; label: string; color: string }[] = [
    { key: 'today',     label: `Today (${categorized.today.length})`,       color: 'blue' },
    { key: 'overdue',   label: `Overdue (${categorized.overdue.length})`,   color: 'red' },
    { key: 'upcoming',  label: `Upcoming (${categorized.upcoming.length})`, color: 'teal' },
    { key: 'completed', label: `Completed (${categorized.completed.length})`, color: 'green' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
          <p className="text-sm text-gray-500 mt-0.5">{categorized.overdue.length > 0 && <span className="text-red-600 font-medium">{categorized.overdue.length} overdue · </span>}{categorized.today.length} due today</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="Today" count={categorized.today.length} icon={<Clock className="w-5 h-5 text-blue-600" />} bg="bg-blue-50" />
        <SummaryCard label="Overdue" count={categorized.overdue.length} icon={<AlertTriangle className="w-5 h-5 text-red-600" />} bg="bg-red-50" />
        <SummaryCard label="Upcoming" count={categorized.upcoming.length} icon={<Calendar className="w-5 h-5 text-teal-600" />} bg="bg-teal-50" />
        <SummaryCard label="Completed" count={categorized.completed.length} icon={<CheckCircle className="w-5 h-5 text-green-600" />} bg="bg-green-50" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('px-4 py-1.5 text-sm font-medium rounded-lg transition-all', tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Follow-up List */}
      <div className="space-y-3">
        {current.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <CheckCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No follow-ups in this category</p>
          </div>
        )}
        {current.map(fu => {
          const isOverdue = fu.status === 'PENDING' && fu.scheduledDate < todayStr;
          return (
            <div key={fu.id} className={cn('bg-white rounded-xl border shadow-sm p-4', isOverdue ? 'border-red-200 bg-red-50/30' : 'border-gray-100')}>
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {isOverdue && <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium"><AlertTriangle className="w-3 h-3" /> Overdue</span>}
                    <h3 className="font-semibold text-gray-900">{fu.leadName}</h3>
                    <span className="text-sm text-gray-500">{fu.leadPhone}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(fu.scheduledDate)} at {fu.scheduledTime}</span>
                    <span className="flex items-center gap-1"><Filter className="w-3.5 h-3.5" />{fu.reason}</span>
                    <span className="flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" />{fu.assignedEmployeeName}</span>
                  </div>
                  {fu.notes && <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded-lg px-3 py-1.5">{fu.notes}</p>}
                </div>
                {fu.status !== 'COMPLETED' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a href={`tel:${fu.leadPhone}`}>
                      <Button variant="success" size="xs"><Phone className="w-3.5 h-3.5" /> Call</Button>
                    </a>
                    <a href={`https://wa.me/91${fu.leadPhone}`} target="_blank" rel="noreferrer">
                      <Button variant="secondary" size="xs"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</Button>
                    </a>
                    <Button size="xs" onClick={() => handleComplete(fu)}>
                      <CheckCircle className="w-3.5 h-3.5" /> Complete
                    </Button>
                    <Button variant="outline" size="xs" onClick={() => { setSelected(fu); setShowReschedule(true); }}>
                      <Calendar className="w-3.5 h-3.5" /> Reschedule
                    </Button>
                  </div>
                )}
                {fu.status === 'COMPLETED' && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Done</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reschedule Modal */}
      <Modal isOpen={showReschedule} onClose={() => setShowReschedule(false)} title="Reschedule Follow-up" size="sm">
        <div className="space-y-4">
          <Input label="New Date" type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} />
          <Input label="Time" type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleReschedule}>Reschedule</Button>
            <Button variant="outline" onClick={() => setShowReschedule(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SummaryCard({ label, count, icon, bg }: { label: string; count: number; icon: React.ReactNode; bg: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>{icon}</div>
      <div>
        <p className="text-xl font-bold text-gray-900">{count}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
