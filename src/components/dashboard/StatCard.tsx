import { cn } from '@/lib/utils';
import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'teal' | 'amber' | 'indigo';
  subtitle?: string;
}

const colorMap = {
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-600',   text: 'text-blue-600' },
  green:  { bg: 'bg-green-50',  icon: 'bg-green-600',  text: 'text-green-600' },
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-600', text: 'text-orange-600' },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-600',    text: 'text-red-600' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-600', text: 'text-purple-600' },
  teal:   { bg: 'bg-teal-50',   icon: 'bg-teal-600',   text: 'text-teal-600' },
  amber:  { bg: 'bg-amber-50',  icon: 'bg-amber-600',  text: 'text-amber-600' },
  indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-600', text: 'text-indigo-600' },
};

export function StatCard({ title, value, icon: Icon, trend, color = 'blue', subtitle }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', c.icon)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-50">
          {trend >= 0
            ? <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
          <span className={cn('text-xs font-medium', trend >= 0 ? 'text-green-600' : 'text-red-600')}>
            {trend >= 0 ? '+' : ''}{trend}% vs last period
          </span>
        </div>
      )}
    </div>
  );
}
