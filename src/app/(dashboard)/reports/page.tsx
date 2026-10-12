'use client';
import { useMemo, useState } from 'react';
import { useCRMStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { LeadsOverTimeChart, EmployeePerformanceChart, LeadsByStatusChart } from '@/components/charts/LeadsChart';
import { formatCurrency, formatDate, STATUS_LABELS } from '@/lib/utils';
import { Download, BarChart3, FileText, Users, BookOpen, TrendingUp, RefreshCw } from 'lucide-react';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'employee' | 'course' | 'form' | 'conversion' | 'revenue';

const REPORT_TYPES = [
  { key: 'daily' as ReportType,       icon: FileText,   label: 'Daily Lead Report',          desc: 'Leads received today with status breakdown' },
  { key: 'weekly' as ReportType,      icon: FileText,   label: 'Weekly Lead Report',         desc: 'This week\'s lead activity summary' },
  { key: 'monthly' as ReportType,     icon: FileText,   label: 'Monthly Lead Report',        desc: 'Full month lead generation overview' },
  { key: 'employee' as ReportType,    icon: Users,      label: 'Employee Performance',       desc: 'Individual team member performance metrics' },
  { key: 'course' as ReportType,      icon: BookOpen,   label: 'Course Performance',         desc: 'Lead & conversion stats per course' },
  { key: 'form' as ReportType,        icon: RefreshCw,  label: 'Google Form Performance',    desc: 'Leads and conversions by form source' },
  { key: 'conversion' as ReportType,  icon: TrendingUp, label: 'Conversion Report',          desc: 'Funnel analysis and conversion rates' },
  { key: 'revenue' as ReportType,     icon: BarChart3,  label: 'Revenue Report',             desc: 'Income from converted leads by period' },
];

export default function ReportsPage() {
  const { leads, employees, courses, forms } = useCRMStore();
  const [activeReport, setActiveReport] = useState<ReportType>('monthly');

  const today = new Date(); today.setHours(0,0,0,0);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const reportData = useMemo(() => {
    switch (activeReport) {
      case 'daily': return leads.filter(l => new Date(l.createdAt) >= today);
      case 'weekly': return leads.filter(l => new Date(l.createdAt) >= weekAgo);
      case 'monthly': return leads.filter(l => new Date(l.createdAt) >= monthStart);
      default: return leads;
    }
  }, [activeReport, leads]);

  const leadsOverTime = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days[d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })] = 0;
    }
    leads.forEach(l => {
      const key = new Date(l.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([date, leads]) => ({ date, leads }));
  }, [leads]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    reportData.forEach(l => { const k = STATUS_LABELS[l.status]; counts[k] = (counts[k] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [reportData]);

  const empPerf = useMemo(() => employees.map(e => ({
    name: e.name.split(' ')[0],
    leads: reportData.filter(l => l.assignedEmployeeId === e.id).length,
    converted: reportData.filter(l => l.assignedEmployeeId === e.id && l.status === 'CONVERTED').length,
  })), [reportData, employees]);

  const exportCSV = () => {
    let csv = '';
    if (activeReport === 'employee') {
      csv = 'Employee,Leads,Contacted,Interested,Converted,Conv%\n';
      employees.forEach(emp => {
        const el = leads.filter(l => l.assignedEmployeeId === emp.id);
        const conv = el.filter(l => l.status === 'CONVERTED').length;
        csv += `${emp.name},${el.length},${el.filter(l=>['CONTACTED','CALLBACK','INTERESTED','FOLLOW_UP','DEMO_SCHEDULED','PAYMENT_PENDING','CONVERTED'].includes(l.status)).length},${el.filter(l=>['INTERESTED','DEMO_SCHEDULED','PAYMENT_PENDING','CONVERTED'].includes(l.status)).length},${conv},${el.length?(conv/el.length*100).toFixed(1):0}%\n`;
      });
    } else {
      csv = 'Lead ID,Name,Phone,Email,College,Course,Source,Status,Priority,Employee,Created\n';
      reportData.forEach(l => {
        csv += `${l.leadId},${l.name},${l.phone},${l.email||''},${l.college||''},${l.course||''},${l.sourceForm||''},${l.status},${l.priority},${l.assignedEmployeeName||''},${l.createdAt}\n`;
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${activeReport}_report.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate and export comprehensive reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4" /> Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Report Selector */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Report Types</p>
            </div>
            <div className="p-2 space-y-1">
              {REPORT_TYPES.map(rt => (
                <button key={rt.key} onClick={() => setActiveReport(rt.key)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${activeReport === rt.key ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                  <rt.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${activeReport === rt.key ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <p className={`text-xs font-semibold ${activeReport === rt.key ? 'text-blue-800' : 'text-gray-700'}`}>{rt.label}</p>
                    <p className="text-xs text-gray-400 leading-tight mt-0.5">{rt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{reportData.length}</p>
              <p className="text-xs text-gray-500">Total Leads</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{reportData.filter(l => l.status === 'CONVERTED').length}</p>
              <p className="text-xs text-gray-500">Converted</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {reportData.length ? ((reportData.filter(l => l.status === 'CONVERTED').length / reportData.length) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-gray-500">Conversion Rate</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LeadsOverTimeChart data={leadsOverTime} />
            <LeadsByStatusChart data={statusData} />
          </div>

          {['daily','weekly','monthly'].includes(activeReport) && <EmployeePerformanceChart data={empPerf} />}

          {/* Data Table */}
          {['daily','weekly','monthly'].includes(activeReport) && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 text-sm">Lead Data ({reportData.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>{['Lead ID','Name','Phone','Course','Source','Status','Employee','Created'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reportData.slice(0, 15).map(l => (
                      <tr key={l.id} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 font-mono text-blue-600">{l.leadId}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">{l.name}</td>
                        <td className="px-3 py-2 text-gray-600">{l.phone}</td>
                        <td className="px-3 py-2 text-gray-500 max-w-24 truncate">{l.course || '—'}</td>
                        <td className="px-3 py-2 text-gray-500 max-w-20 truncate">{l.sourceForm?.split(' ')[0] || '—'}</td>
                        <td className="px-3 py-2"><span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{STATUS_LABELS[l.status]}</span></td>
                        <td className="px-3 py-2 text-gray-500">{l.assignedEmployeeName?.split(' ')[0] || '—'}</td>
                        <td className="px-3 py-2 text-gray-400">{formatDate(l.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.length > 15 && <p className="text-xs text-center text-gray-400 py-2">Showing 15 of {reportData.length} — export for full data</p>}
              </div>
            </div>
          )}

          {activeReport === 'employee' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100"><h3 className="font-semibold text-gray-900 text-sm">Employee Performance</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>{['Employee','Leads','Contacted','Interested','Converted','Conv%','Revenue'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {employees.map(emp => {
                      const el = leads.filter(l => l.assignedEmployeeId === emp.id);
                      const conv = el.filter(l => l.status === 'CONVERTED').length;
                      const rev = el.filter(l => l.status === 'CONVERTED').reduce((s,l) => s + (l.payment?.amount || l.expectedValue || 0), 0);
                      return (
                        <tr key={emp.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                          <td className="px-4 py-3">{el.length}</td>
                          <td className="px-4 py-3">{el.filter(l=>['CONTACTED','CALLBACK','INTERESTED','FOLLOW_UP','DEMO_SCHEDULED','PAYMENT_PENDING','CONVERTED'].includes(l.status)).length}</td>
                          <td className="px-4 py-3">{el.filter(l=>['INTERESTED','DEMO_SCHEDULED','PAYMENT_PENDING','CONVERTED'].includes(l.status)).length}</td>
                          <td className="px-4 py-3 text-green-600 font-bold">{conv}</td>
                          <td className="px-4 py-3 text-blue-600 font-medium">{el.length?(conv/el.length*100).toFixed(1):0}%</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{formatCurrency(rev)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeReport === 'course' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100"><h3 className="font-semibold text-gray-900 text-sm">Course Performance</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>{['Course','Leads','Interested','Payment Pending','Converted','Conv%','Revenue'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {courses.map(c => {
                      const cl = leads.filter(l => l.course === c.name);
                      const conv = cl.filter(l => l.status === 'CONVERTED').length;
                      const rev = cl.filter(l => l.status === 'CONVERTED').reduce((s,l) => s + (l.payment?.amount || c.fee || 0), 0);
                      return (
                        <tr key={c.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                          <td className="px-4 py-3">{cl.length}</td>
                          <td className="px-4 py-3 text-teal-600">{cl.filter(l=>['INTERESTED','DEMO_SCHEDULED','PAYMENT_PENDING','CONVERTED'].includes(l.status)).length}</td>
                          <td className="px-4 py-3 text-amber-600">{cl.filter(l=>l.status==='PAYMENT_PENDING').length}</td>
                          <td className="px-4 py-3 text-green-600 font-bold">{conv}</td>
                          <td className="px-4 py-3 text-blue-600 font-medium">{cl.length?(conv/cl.length*100).toFixed(1):0}%</td>
                          <td className="px-4 py-3 font-medium">{formatCurrency(rev)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeReport === 'form' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100"><h3 className="font-semibold text-gray-900 text-sm">Google Form Performance</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>{['Form Name','Total Leads','New','Contacted','Converted','Conv%','Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {forms.map(f => {
                      const fl = leads.filter(l => l.sourceFormId === f.id);
                      const conv = fl.filter(l => l.status === 'CONVERTED').length;
                      return (
                        <tr key={f.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-900">{f.name}</td>
                          <td className="px-4 py-3">{fl.length}</td>
                          <td className="px-4 py-3 text-blue-600">{fl.filter(l=>l.status==='NEW').length}</td>
                          <td className="px-4 py-3 text-purple-600">{fl.filter(l=>l.status==='CONTACTED').length}</td>
                          <td className="px-4 py-3 text-green-600 font-bold">{conv}</td>
                          <td className="px-4 py-3 text-blue-600">{fl.length?(conv/fl.length*100).toFixed(1):0}%</td>
                          <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.status==='ACTIVE'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{f.status}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
