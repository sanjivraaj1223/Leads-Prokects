'use client';
import { useMemo } from 'react';
import { Users, UserPlus, Phone, Star, RefreshCw, CheckCircle, XCircle, TrendingUp, Clock, DollarSign, AlertTriangle, Calendar, Plus } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { DateFilter } from '@/components/dashboard/DateFilter';
import { LeadsOverTimeChart, LeadsByStatusChart, LeadsBySourceChart, EmployeePerformanceChart, ConversionFunnelChart, RevenueChart } from '@/components/charts/LeadsChart';
import { useCRMStore } from '@/lib/store';
import { filterLeadsByDate, formatCurrency, STATUS_LABELS } from '@/lib/utils';
import { StatusBadge } from '@/components/leads/StatusBadge';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const { leads, employees, forms, followUps, dateFilter } = useCRMStore();

  const filtered = useMemo(() => filterLeadsByDate(leads, dateFilter), [leads, dateFilter]);

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const todayLeads = leads.filter(l => new Date(l.createdAt) >= today).length;
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const converted = filtered.filter(l => l.status === 'CONVERTED');
    const revenue = converted.reduce((s, l) => s + (l.payment?.amount || l.expectedValue || 0), 0);
    const overdueFollowUps = followUps.filter(fu => fu.status === 'PENDING' && new Date(fu.scheduledDate) < today).length;
    return {
      total: filtered.length,
      today: todayLeads,
      week: leads.filter(l => new Date(l.createdAt) >= weekAgo).length,
      month: leads.filter(l => new Date(l.createdAt) >= monthStart).length,
      new: filtered.filter(l => l.status === 'NEW').length,
      contacted: filtered.filter(l => l.status === 'CONTACTED').length,
      interested: filtered.filter(l => l.status === 'INTERESTED').length,
      followUp: filtered.filter(l => l.status === 'FOLLOW_UP').length,
      converted: converted.length,
      lost: filtered.filter(l => l.status === 'LOST' || l.status === 'NOT_INTERESTED').length,
      conversionRate: filtered.length ? ((converted.length / filtered.length) * 100).toFixed(1) : '0',
      revenue,
      pendingFollowUps: followUps.filter(fu => fu.status === 'PENDING').length,
      overdueFollowUps,
    };
  }, [filtered, leads, followUps]);

  const leadsOverTime = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days[d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })] = 0;
    }
    leads.forEach(l => {
      const d = new Date(l.createdAt);
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([date, leads]) => ({ date, leads }));
  }, [leads]);

  const leadsbyStatus = useMemo(() => {
    const counts: Partial<Record<string, number>> = {};
    filtered.forEach(l => { counts[STATUS_LABELS[l.status]] = (counts[STATUS_LABELS[l.status]] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value: value! }));
  }, [filtered]);

  const leadsByForm = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(l => { if (l.sourceForm) counts[l.sourceForm] = (counts[l.sourceForm] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace(' Registration','').replace(' Course',''), value }));
  }, [filtered]);

  const empPerf = useMemo(() => employees.map(e => ({
    name: e.name.split(' ')[0],
    leads: filtered.filter(l => l.assignedEmployeeId === e.id).length,
    converted: filtered.filter(l => l.assignedEmployeeId === e.id && l.status === 'CONVERTED').length,
  })), [filtered, employees]);

  const funnelData = useMemo(() => [
    { name: 'New',            value: filtered.filter(l => l.status === 'NEW').length,             fill: '#3b82f6' },
    { name: 'Contacted',      value: filtered.filter(l => l.status === 'CONTACTED').length,        fill: '#8b5cf6' },
    { name: 'Interested',     value: filtered.filter(l => l.status === 'INTERESTED').length,       fill: '#06b6d4' },
    { name: 'Demo/Follow-up', value: filtered.filter(l => ['FOLLOW_UP','DEMO_SCHEDULED'].includes(l.status)).length, fill: '#f59e0b' },
    { name: 'Payment',        value: filtered.filter(l => l.status === 'PAYMENT_PENDING').length,  fill: '#f97316' },
    { name: 'Converted',      value: filtered.filter(l => l.status === 'CONVERTED').length,        fill: '#10b981' },
  ], [filtered]);

  const revenueByMonth = useMemo(() => {
    const months = ['Jun','Jul','Aug','Sep','Oct'];
    const converted = leads.filter(l => l.status === 'CONVERTED');
    return months.map(m => ({
      month: m,
      revenue: converted.filter(l => new Date(l.createdAt).toLocaleString('en-IN',{month:'short'}) === m)
        .reduce((s,l) => s + (l.payment?.amount || l.expectedValue || 0), 0),
    }));
  }, [leads]);

  const recentLeads = useMemo(() => [...leads].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [leads]);

  return (
    <div className="space-y-6">
      {/* ── Empty state ── */}
      {leads.length === 0 && forms.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Guhanix CRM</h2>
            <p className="text-gray-500 max-w-md">Your dashboard is empty. Connect a Google Form and every submission will appear here as a new lead automatically.</p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Link href="/google-forms"><Button size="lg"><Plus className="w-5 h-5" /> Connect Google Form</Button></Link>
            <Link href="/employees"><Button variant="outline" size="lg"><UserPlus className="w-5 h-5" /> Add Employees First</Button></Link>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md text-sm text-blue-700 text-center">
            <strong>Tip:</strong> Add team employees first so new leads can be auto-assigned via round-robin.
          </div>
        </div>
      )}

      {leads.length > 0 && (<>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back — here's your lead overview</p>
        </div>
        <DateFilter />
      </div>
      {/* Main Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard title="Total Leads"      value={stats.total}         icon={Users}        color="blue"   trend={12} />
        <StatCard title="Today's Leads"    value={stats.today}         icon={UserPlus}     color="indigo" />
        <StatCard title="This Week"        value={stats.week}          icon={Calendar}     color="purple" />
        <StatCard title="This Month"       value={stats.month}         icon={TrendingUp}   color="teal"   />
        <StatCard title="Conversion Rate"  value={`${stats.conversionRate}%`} icon={TrendingUp} color="green" trend={3.2} />
      </div>

      {/* Status Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard title="New Leads"        value={stats.new}           icon={UserPlus}     color="blue"   />
        <StatCard title="Contacted"        value={stats.contacted}     icon={Phone}        color="purple" />
        <StatCard title="Interested"       value={stats.interested}    icon={Star}         color="teal"   />
        <StatCard title="Follow-up"        value={stats.followUp}      icon={RefreshCw}    color="orange" />
        <StatCard title="Converted"        value={stats.converted}     icon={CheckCircle}  color="green"  />
        <StatCard title="Lost/Not Int."    value={stats.lost}          icon={XCircle}      color="red"    />
        <StatCard title="Total Revenue"    value={formatCurrency(stats.revenue)} icon={DollarSign} color="green" trend={8} />
        <StatCard title="Pending Follow-ups" value={stats.pendingFollowUps} icon={Clock}  color="amber"  />
        <StatCard title="Overdue"          value={stats.overdueFollowUps} icon={AlertTriangle} color="red" />
        <StatCard title="Forms Connected"  value={forms.filter(f => f.status === 'ACTIVE').length} icon={RefreshCw} color="indigo" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><LeadsOverTimeChart data={leadsOverTime} /></div>
        <LeadsByStatusChart data={leadsbyStatus} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <LeadsBySourceChart data={leadsByForm} />
        <EmployeePerformanceChart data={empPerf} />
        <ConversionFunnelChart data={funnelData} />
      </div>

      {/* Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart data={revenueByMonth} />

        {/* Form Performance */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Google Form Performance</h3>
          <div className="space-y-3">
            {forms.map(form => {
              const formLeads = leads.filter(l => l.sourceFormId === form.id);
              const converted = formLeads.filter(l => l.status === 'CONVERTED').length;
              const pct = formLeads.length ? Math.round(converted / formLeads.length * 100) : 0;
              return (
                <div key={form.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 truncate">{form.name}</span>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{formLeads.length} leads · {converted} conv.</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-blue-600 w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Recent Leads</h3>
          <Link href="/leads" className="text-xs text-blue-600 hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Lead','Phone','Course','Source','Status','Assigned','Created'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentLeads.map(l => (
                <tr key={l.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <Link href={`/leads/${l.id}`} className="font-medium text-gray-900 hover:text-blue-600">{l.name}</Link>
                    <div className="text-xs text-gray-400">{l.leadId}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{l.phone}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-32 truncate">{l.course}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-28 truncate">{l.sourceForm?.split(' ')[0]}</td>
                  <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-600">{l.assignedEmployeeName?.split(' ')[0] || <span className="text-red-400">—</span>}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>)}
    </div>
  );
}
