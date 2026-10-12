'use client';
import { useMemo } from 'react';
import { useCRMStore } from '@/lib/store';
import { DateFilter } from '@/components/dashboard/DateFilter';
import { RevenueChart } from '@/components/charts/LeadsChart';
import { filterLeadsByDate, formatCurrency, formatDate } from '@/lib/utils';
import { DollarSign, TrendingUp, Users, Award } from 'lucide-react';

export default function RevenuePage() {
  const { leads, employees, courses, dateFilter } = useCRMStore();
  const filtered = useMemo(() => filterLeadsByDate(leads, dateFilter).filter(l => l.status === 'CONVERTED'), [leads, dateFilter]);

  const totalRevenue = filtered.reduce((s, l) => s + (l.payment?.amount || l.expectedValue || 0), 0);

  const today = new Date(); today.setHours(0,0,0,0);
  const todayRevenue = leads.filter(l => l.status === 'CONVERTED' && new Date(l.createdAt) >= today).reduce((s, l) => s + (l.payment?.amount || l.expectedValue || 0), 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthRevenue = leads.filter(l => l.status === 'CONVERTED' && new Date(l.createdAt) >= monthStart).reduce((s, l) => s + (l.payment?.amount || l.expectedValue || 0), 0);

  const byCourse = useMemo(() => {
    const map: Record<string, { leads: number; revenue: number }> = {};
    filtered.forEach(l => {
      const key = l.course || 'Unknown';
      if (!map[key]) map[key] = { leads: 0, revenue: 0 };
      map[key].leads++;
      map[key].revenue += l.payment?.amount || l.expectedValue || 0;
    });
    return Object.entries(map).sort((a,b) => b[1].revenue - a[1].revenue);
  }, [filtered]);

  const byEmployee = useMemo(() => employees.map(emp => {
    const empLeads = filtered.filter(l => l.assignedEmployeeId === emp.id);
    const revenue = empLeads.reduce((s, l) => s + (l.payment?.amount || l.expectedValue || 0), 0);
    return { ...emp, converted: empLeads.length, revenue };
  }).filter(e => e.revenue > 0).sort((a, b) => b.revenue - a.revenue), [filtered, employees]);

  const revenueByMonth = [
    { month: 'May', revenue: 85000 },
    { month: 'Jun', revenue: 120000 },
    { month: 'Jul', revenue: 95000 },
    { month: 'Aug', revenue: 145000 },
    { month: 'Sep', revenue: 175000 },
    { month: 'Oct', revenue: totalRevenue > 0 ? totalRevenue : 210000 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track revenue from converted leads</p>
        </div>
        <DateFilter />
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <RevCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={<DollarSign className="w-5 h-5 text-green-600" />} bg="bg-green-50" sub={`${filtered.length} conversions`} />
        <RevCard label="Today's Revenue" value={formatCurrency(todayRevenue)} icon={<TrendingUp className="w-5 h-5 text-blue-600" />} bg="bg-blue-50" />
        <RevCard label="This Month" value={formatCurrency(monthRevenue)} icon={<Award className="w-5 h-5 text-purple-600" />} bg="bg-purple-50" />
        <RevCard label="Avg. Deal Size" value={filtered.length ? formatCurrency(Math.round(totalRevenue / filtered.length)) : '₹0'} icon={<Users className="w-5 h-5 text-amber-600" />} bg="bg-amber-50" />
      </div>

      {/* Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart data={revenueByMonth} />

        {/* By Course */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue by Course</h3>
          <div className="space-y-3">
            {byCourse.map(([course, data]) => {
              const pct = totalRevenue ? Math.round(data.revenue / totalRevenue * 100) : 0;
              return (
                <div key={course}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700 truncate max-w-48">{course}</span>
                    <span className="text-gray-500 ml-2 flex-shrink-0">{data.leads} enrolled · {formatCurrency(data.revenue)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Employee Revenue */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Revenue by Employee</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Employee','Role','Conversions','Revenue','Share'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {byEmployee.map((emp, i) => (
                <tr key={emp.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {i === 0 && <span className="text-lg">🥇</span>}
                      {i === 1 && <span className="text-lg">🥈</span>}
                      {i === 2 && <span className="text-lg">🥉</span>}
                      {i > 2 && <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">{emp.name.charAt(0)}</div>}
                      <span className="font-medium text-gray-900">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{emp.role.replace(/_/g,' ')}</td>
                  <td className="px-4 py-3 font-semibold text-green-600">{emp.converted}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(emp.revenue)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${totalRevenue ? (emp.revenue/totalRevenue*100) : 0}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{totalRevenue ? (emp.revenue/totalRevenue*100).toFixed(1) : 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {byEmployee.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No revenue data for selected period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Converted Leads Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">Converted Leads</h2>
          <span className="text-xs text-gray-400">{filtered.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Lead','Course','Amount','Payment','Method','Employee','Date'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.slice(0, 20).map(l => (
                <tr key={l.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{l.name}</p>
                    <p className="text-xs text-gray-400">{l.leadId}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-32 truncate">{l.course}</td>
                  <td className="px-4 py-3 font-semibold text-green-600">{l.payment ? formatCurrency(l.payment.amount) : l.expectedValue ? formatCurrency(l.expectedValue) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{l.payment?.paymentStatus || 'PAID'}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{l.payment?.paymentMethod || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{l.assignedEmployeeName || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{formatDate(l.payment?.paymentDate || l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RevCard({ label, value, icon, bg, sub }: { label: string; value: string; icon: React.ReactNode; bg: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>{icon}</div>
      </div>
    </div>
  );
}
