'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCRMStore } from '@/lib/store';
import {
  LayoutDashboard, Users, CalendarClock, Trello, FormInput, UserCog,
  BookOpen, DollarSign, BarChart3, ScrollText, Settings, ChevronLeft,
  ChevronRight, Zap, PenSquare
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/leads',          icon: Users,           label: 'Leads' },
  { href: '/followups',      icon: CalendarClock,   label: 'Follow-ups' },
  { href: '/kanban',         icon: Trello,          label: 'Kanban Board' },
  { href: '/form-builder',   icon: PenSquare,       label: 'Form Builder', badge: 'NEW' },
  { href: '/google-forms',   icon: FormInput,       label: 'Google Forms' },
  { href: '/employees',      icon: UserCog,         label: 'Employees' },
  { href: '/courses',        icon: BookOpen,        label: 'Courses' },
  { href: '/revenue',        icon: DollarSign,      label: 'Revenue' },
  { href: '/reports',        icon: BarChart3,       label: 'Reports' },
  { href: '/activity-logs',  icon: ScrollText,      label: 'Activity Logs' },
  { href: '/settings',       icon: Settings,        label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useCRMStore();

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen bg-slate-900 flex flex-col transition-all duration-300 z-40',
      sidebarCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-slate-700', sidebarCollapsed && 'justify-center px-2')}>
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-tight">Guhanix</p>
            <p className="text-slate-400 text-xs">Technology CRM</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              title={sidebarCollapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                sidebarCollapsed && 'justify-center px-2'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-sm font-medium flex-1">{item.label}</span>}
              {!sidebarCollapsed && (item as {badge?:string}).badge && (
                <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium">{(item as {badge?:string}).badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-2 pb-4">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : (
            <><ChevronLeft className="w-5 h-5" /><span className="text-sm">Collapse</span></>
          )}
        </button>
      </div>
    </aside>
  );
}
