import { cn, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils';
import type { LeadStatus } from '@/types';

export function StatusBadge({ status }: { status: LeadStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', c.bg, c.text)}>
      {STATUS_LABELS[status]}
    </span>
  );
}
