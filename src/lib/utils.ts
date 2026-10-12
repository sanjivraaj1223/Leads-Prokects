import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Lead, LeadStatus, LeadPriority } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const STATUS_COLORS: Record<LeadStatus, { bg: string; text: string; border: string }> = {
  NEW:             { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-200' },
  CONTACTED:       { bg: 'bg-purple-100',  text: 'text-purple-700',  border: 'border-purple-200' },
  CALLBACK:        { bg: 'bg-yellow-100',  text: 'text-yellow-700',  border: 'border-yellow-200' },
  INTERESTED:      { bg: 'bg-teal-100',    text: 'text-teal-700',    border: 'border-teal-200' },
  FOLLOW_UP:       { bg: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-orange-200' },
  DEMO_SCHEDULED:  { bg: 'bg-indigo-100',  text: 'text-indigo-700',  border: 'border-indigo-200' },
  PAYMENT_PENDING: { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200' },
  CONVERTED:       { bg: 'bg-green-100',   text: 'text-green-700',   border: 'border-green-200' },
  NOT_INTERESTED:  { bg: 'bg-gray-100',    text: 'text-gray-700',    border: 'border-gray-200' },
  LOST:            { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200' },
};

export const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW:             'New',
  CONTACTED:       'Contacted',
  CALLBACK:        'Callback',
  INTERESTED:      'Interested',
  FOLLOW_UP:       'Follow-up',
  DEMO_SCHEDULED:  'Demo Scheduled',
  PAYMENT_PENDING: 'Payment Pending',
  CONVERTED:       'Converted',
  NOT_INTERESTED:  'Not Interested',
  LOST:            'Lost',
};

export const PRIORITY_COLORS: Record<LeadPriority, { bg: string; text: string }> = {
  LOW:    { bg: 'bg-gray-100',   text: 'text-gray-600' },
  MEDIUM: { bg: 'bg-blue-100',   text: 'text-blue-600' },
  HIGH:   { bg: 'bg-orange-100', text: 'text-orange-600' },
  URGENT: { bg: 'bg-red-100',    text: 'text-red-600' },
};

export function filterLeadsByDate(leads: Lead[], dateFilter: string): Lead[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (dateFilter) {
    case 'today':
      return leads.filter(l => new Date(l.createdAt) >= today);
    case 'yesterday': {
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      return leads.filter(l => { const d = new Date(l.createdAt); return d >= yesterday && d < today; });
    }
    case 'last7':
      return leads.filter(l => new Date(l.createdAt) >= new Date(today.getTime() - 7 * 86400000));
    case 'last30':
      return leads.filter(l => new Date(l.createdAt) >= new Date(today.getTime() - 30 * 86400000));
    case 'thisMonth':
      return leads.filter(l => { const d = new Date(l.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    default:
      return leads;
  }
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function detectDuplicate(leads: Lead[], phone: string, email?: string): Lead | null {
  return leads.find(l =>
    l.phone === phone || (email && l.email && l.email.toLowerCase() === email.toLowerCase())
  ) || null;
}

export const ALL_STATUSES: LeadStatus[] = [
  'NEW','CONTACTED','CALLBACK','INTERESTED','FOLLOW_UP',
  'DEMO_SCHEDULED','PAYMENT_PENDING','CONVERTED','NOT_INTERESTED','LOST'
];

export const KANBAN_COLUMNS: LeadStatus[] = [
  'NEW','CONTACTED','INTERESTED','FOLLOW_UP','DEMO_SCHEDULED','PAYMENT_PENDING','CONVERTED'
];
