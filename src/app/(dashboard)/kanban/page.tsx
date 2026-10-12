'use client';
import { useMemo, useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useCRMStore } from '@/lib/store';
import { STATUS_LABELS, STATUS_COLORS, KANBAN_COLUMNS, cn, formatDate } from '@/lib/utils';
import type { LeadStatus } from '@/types';
import { Phone, MessageCircle, User, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function KanbanPage() {
  const { leads, updateLead } = useCRMStore();
  const [filter, setFilter] = useState('all');

  const filteredLeads = useMemo(() =>
    filter === 'all' ? leads : leads.filter(l => l.assignedEmployeeId === filter),
    [leads, filter]
  );

  const columns = useMemo(() =>
    KANBAN_COLUMNS.reduce((acc, status) => {
      acc[status] = filteredLeads.filter(l => l.status === status);
      return acc;
    }, {} as Record<LeadStatus, typeof leads>),
    [filteredLeads]
  );

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as LeadStatus;
    updateLead(draggableId, { status: newStatus, lastContacted: new Date().toISOString() });
  };

  return (
    <div className="space-y-5 h-[calc(100vh-9rem)] flex flex-col">
      <div className="flex items-center justify-between flex-wrap gap-3 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
          <p className="text-sm text-gray-500 mt-0.5">Drag cards to move leads between stages</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{filteredLeads.length} leads</span>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
          {KANBAN_COLUMNS.map(status => {
            const c = STATUS_COLORS[status];
            const col = columns[status] || [];
            return (
              <div key={status} className="flex-shrink-0 w-64 flex flex-col">
                <div className={cn('flex items-center justify-between px-3 py-2 rounded-t-xl border-t border-x', c.bg, c.border)}>
                  <span className={cn('text-xs font-semibold uppercase tracking-wide', c.text)}>{STATUS_LABELS[status]}</span>
                  <span className={cn('text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center', c.bg, c.text, 'border', c.border)}>{col.length}</span>
                </div>
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'flex-1 min-h-64 overflow-y-auto p-2 rounded-b-xl border border-t-0 space-y-2 transition-colors',
                        c.border,
                        snapshot.isDraggingOver ? 'bg-blue-50/50' : 'bg-gray-50/80'
                      )}
                    >
                      {col.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                'kanban-card bg-white rounded-xl border border-gray-100 p-3 cursor-grab active:cursor-grabbing',
                                snapshot.isDragging && 'shadow-2xl ring-2 ring-blue-400 rotate-1'
                              )}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <Link href={`/leads/${lead.id}`} className="font-semibold text-sm text-gray-900 hover:text-blue-600 leading-tight">{lead.name}</Link>
                                <span className={cn('text-xs px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0',
                                  lead.priority === 'URGENT' ? 'bg-red-100 text-red-600' :
                                  lead.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                                  lead.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-600' :
                                  'bg-gray-100 text-gray-500'
                                )}>{lead.priority[0]}</span>
                              </div>
                              {lead.course && <p className="text-xs text-gray-500 mb-2 truncate">{lead.course}</p>}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                  <User className="w-3 h-3" />
                                  <span className="truncate max-w-20">{lead.assignedEmployeeName?.split(' ')[0] || '—'}</span>
                                </div>
                                <div className="flex gap-1">
                                  <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}>
                                    <button className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-green-50 text-gray-400 hover:text-green-600">
                                      <Phone className="w-3 h-3" />
                                    </button>
                                  </a>
                                  <a href={`https://wa.me/91${lead.phone}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                                    <button className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-emerald-50 text-gray-400 hover:text-emerald-600">
                                      <MessageCircle className="w-3 h-3" />
                                    </button>
                                  </a>
                                </div>
                              </div>
                              {lead.nextFollowUp && (
                                <div className={cn('flex items-center gap-1 mt-2 text-xs pt-2 border-t border-gray-50',
                                  new Date(lead.nextFollowUp) < new Date() ? 'text-red-500' : 'text-gray-400'
                                )}>
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(lead.nextFollowUp)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {col.length === 0 && (
                        <div className="text-center py-8 text-xs text-gray-400">Drop leads here</div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
