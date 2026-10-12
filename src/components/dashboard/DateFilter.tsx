'use client';
import { useCRMStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const filters = [
  { value: 'all',       label: 'All Time' },
  { value: 'today',     label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7',     label: 'Last 7 Days' },
  { value: 'last30',    label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
];

export function DateFilter() {
  const { dateFilter, setDateFilter } = useCRMStore();
  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
      {filters.map(f => (
        <button
          key={f.value}
          onClick={() => setDateFilter(f.value)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
            dateFilter === f.value
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
