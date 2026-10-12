'use client';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { SyncProvider } from './SyncProvider';
import { useCRMStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useCRMStore();

  return (
    <SyncProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className={cn('flex flex-col transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-64')}>
          <TopBar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SyncProvider>
  );
}
