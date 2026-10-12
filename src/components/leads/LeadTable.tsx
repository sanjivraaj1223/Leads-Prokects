'use client';
import { useState } from 'react';
import { Eye, Edit, Phone, MessageCircle, Mail, MoreVertical, Trash2, UserCheck, Plus } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { cn, formatDate, formatCurrency, PRIORITY_COLORS } from '@/lib/utils';
import type { Lead } from '@/types';
import Link from 'next/link';
import { useCRMStore } from '@/lib/store';

interface LeadTableProps {
  leads: Lead[];
  onEdit?: (lead: Lead) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (lead: Lead) => void;
  onAssign?: (lead: Lead) => void;
}

export function LeadTable({ leads, onEdit, onDelete, onStatusChange, onAssign }: LeadTableProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { deleteLead } = useCRMStore();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {['Lead ID','Name','Phone','Email','College','Course','Source Form','Employee','Status','Priority','Created','Next Follow-up','Value','Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {leads.length === 0 && (
            <tr><td colSpan={14} className="px-4 py-12 text-center text-gray-400">No leads found</td></tr>
          )}
          {leads.map(lead => {
            const pc = PRIORITY_COLORS[lead.priority];
            return (
              <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-blue-600 font-medium">{lead.leadId}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-xs flex-shrink-0">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <Link href={`/leads/${lead.id}`} className="font-medium text-gray-900 hover:text-blue-600 whitespace-nowrap">{lead.name}</Link>
                      {lead.submissionCount > 1 && (
                        <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1 rounded">×{lead.submissionCount}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{lead.phone}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-32 truncate">{lead.email || '-'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs max-w-24 truncate">{lead.college || '-'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs max-w-32 truncate">{lead.course || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-24 truncate" title={lead.sourceForm}>{lead.sourceForm || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{lead.assignedEmployeeName || <span className="text-red-400">Unassigned</span>}</td>
                <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', pc.bg, pc.text)}>{lead.priority}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(lead.createdAt)}</td>
                <td className="px-4 py-3 text-xs whitespace-nowrap">
                  {lead.nextFollowUp ? (
                    <span className={cn(new Date(lead.nextFollowUp) < new Date() ? 'text-red-600 font-medium' : 'text-gray-600')}>
                      {formatDate(lead.nextFollowUp)}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-xs font-medium text-gray-700 whitespace-nowrap">
                  {lead.expectedValue ? formatCurrency(lead.expectedValue) : '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/leads/${lead.id}`} title="View">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                    </Link>
                    <a href={`tel:${lead.phone}`} title="Call">
                      <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Phone className="w-3.5 h-3.5" /></button>
                    </a>
                    <a href={`https://wa.me/91${lead.phone}`} target="_blank" rel="noreferrer" title="WhatsApp">
                      <button className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><MessageCircle className="w-3.5 h-3.5" /></button>
                    </a>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === lead.id ? null : lead.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                      {openMenu === lead.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                          <div className="absolute right-0 top-7 bg-white border border-gray-100 rounded-xl shadow-xl z-20 w-40 overflow-hidden">
                            <button onClick={() => { onEdit?.(lead); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 text-gray-700"><Edit className="w-3 h-3" /> Edit Lead</button>
                            <button onClick={() => { onStatusChange?.(lead); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 text-gray-700"><Plus className="w-3 h-3" /> Change Status</button>
                            <button onClick={() => { onAssign?.(lead); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 text-gray-700"><UserCheck className="w-3 h-3" /> Assign</button>
                            {lead.email && (
                              <a href={`mailto:${lead.email}`} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 text-gray-700"><Mail className="w-3 h-3" /> Send Email</a>
                            )}
                            <button onClick={() => { deleteLead(lead.id); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-50 text-red-600 border-t border-gray-100"><Trash2 className="w-3 h-3" /> Delete</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
