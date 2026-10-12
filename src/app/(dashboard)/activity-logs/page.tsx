'use client';
import { useMemo, useState } from 'react';
import { useCRMStore } from '@/lib/store';
import { formatDateTime } from '@/lib/utils';
import { sampleActivities, sampleSyncLogs } from '@/data/sampleData';
import { Activity, RefreshCw, Filter } from 'lucide-react';

const ACTIVITY_ICONS: Record<string, string> = {
  LEAD_CREATED: '🟢', CALL: '📞', WHATSAPP: '💬', EMAIL: '📧',
  MEETING: '🤝', FOLLOW_UP_ADDED: '📅', FOLLOW_UP_COMPLETED: '✅',
  NOTE_ADDED: '📝', STATUS_CHANGED: '🔄', ASSIGNED: '👤',
  PAYMENT: '💰', CONVERTED: '🎉', DEMO: '🖥️',
};

type Tab = 'activity' | 'sync';

export default function ActivityLogsPage() {
  const { leads, syncLogs } = useCRMStore();
  const [tab, setTab] = useState<Tab>('activity');
  const [typeFilter, setTypeFilter] = useState('all');

  // Build activity log from all leads
  const allActivities = useMemo(() => {
    const base = [...sampleActivities];
    // Add status-change activities for converted leads
    leads.filter(l => l.status === 'CONVERTED').slice(0, 10).forEach(l => {
      base.push({ id: `gen_${l.id}`, leadId: l.id, type: 'CONVERTED', title: `${l.name} Converted`, notes: `Enrolled in ${l.course}`, createdAt: l.createdAt, employeeId: l.assignedEmployeeId || 'emp1', employeeName: l.assignedEmployeeName || 'System' });
    });
    return base.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [leads]);

  const filtered = useMemo(() =>
    typeFilter === 'all' ? allActivities : allActivities.filter(a => a.type === typeFilter),
    [allActivities, typeFilter]
  );

  const types = Array.from(new Set(allActivities.map(a => a.type)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track all CRM activities and system events</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('activity')} className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${tab === 'activity' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Activity className="w-4 h-4" />Activity Log
        </button>
        <button onClick={() => setTab('sync')} className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${tab === 'sync' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <RefreshCw className="w-4 h-4" />Sync Logs
        </button>
      </div>

      {tab === 'activity' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400" />
            <button onClick={() => setTypeFilter('all')} className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${typeFilter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
            {types.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${typeFilter === t ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {ACTIVITY_ICONS[t]} {t.replace(/_/g,' ')}
              </button>
            ))}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />
              <div className="space-y-3">
                {filtered.map(act => (
                  <div key={act.id} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-base z-10">
                      {ACTIVITY_ICONS[act.type] || '📌'}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className="font-medium text-sm text-gray-900">{act.title}</p>
                        <span className="text-xs text-gray-400 flex-shrink-0">{formatDateTime(act.createdAt)}</span>
                      </div>
                      {act.notes && <p className="text-xs text-gray-600 mt-1">{act.notes}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">by {act.employeeName}</span>
                        <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{act.type.replace(/_/g,' ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'sync' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Google Form Sync History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['Date & Time','Form','Records Found','New Leads','Duplicates','Updated','Errors','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {syncLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{formatDateTime(log.syncedAt)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-40 truncate">{log.formName}</td>
                    <td className="px-4 py-3 text-center text-xs font-medium text-gray-700">{log.recordsFound}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-green-600">{log.newLeads}</td>
                    <td className="px-4 py-3 text-center text-xs font-medium text-amber-600">{log.duplicates}</td>
                    <td className="px-4 py-3 text-center text-xs font-medium text-blue-600">{log.updated}</td>
                    <td className="px-4 py-3 text-center text-xs font-medium text-red-600">{log.errors}</td>
                    <td className="px-4 py-3">
                      <div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.status==='SUCCESS'?'bg-green-100 text-green-700':log.status==='PARTIAL'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{log.status}</span>
                        {log.errorMessage && <p className="text-xs text-red-500 mt-0.5 max-w-48 truncate" title={log.errorMessage}>{log.errorMessage}</p>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
