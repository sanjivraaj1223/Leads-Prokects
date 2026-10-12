import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Lead, Employee, Course, GoogleForm, FollowUp, SyncLog,
  Notification, Activity, CRMForm, FirebaseConfig
} from '@/types';

interface CRMState {
  // Data
  leads: Lead[];
  employees: Employee[];
  courses: Course[];
  forms: GoogleForm[];     // Google Sheets forms
  crmForms: CRMForm[];     // Built-in form builder
  followUps: FollowUp[];
  syncLogs: SyncLog[];
  notifications: Notification[];
  activities: Activity[];

  // Firebase
  firebaseConfig: FirebaseConfig | null;
  firebaseConnected: boolean;

  // UI
  dateFilter: string;
  searchQuery: string;
  sidebarCollapsed: boolean;

  // Leads
  setLeads: (leads: Lead[]) => void;
  addLead: (lead: Lead) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;

  // Employees
  addEmployee: (e: Employee) => void;
  updateEmployee: (id: string, u: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // Courses
  addCourse: (c: Course) => void;
  updateCourse: (id: string, u: Partial<Course>) => void;
  deleteCourse: (id: string) => void;

  // Google Sheets forms
  addForm: (f: GoogleForm) => void;
  updateForm: (id: string, u: Partial<GoogleForm>) => void;
  deleteForm: (id: string) => void;

  // CRM built-in forms
  addCRMForm: (f: CRMForm) => void;
  updateCRMForm: (id: string, u: Partial<CRMForm>) => void;
  deleteCRMForm: (id: string) => void;
  incrementFormSubmissions: (id: string) => void;

  // Follow-ups
  addFollowUp: (fu: FollowUp) => void;
  updateFollowUp: (id: string, u: Partial<FollowUp>) => void;

  // Sync / Activity / Notifications
  addSyncLog: (l: SyncLog) => void;
  addActivity: (a: Activity) => void;
  addNotification: (n: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Firebase
  setFirebaseConfig: (cfg: FirebaseConfig) => void;
  setFirebaseConnected: (v: boolean) => void;

  // UI
  setDateFilter: (f: string) => void;
  setSearchQuery: (q: string) => void;
  toggleSidebar: () => void;
}

export const useCRMStore = create<CRMState>()(
  persist(
    (set) => ({
      leads: [],
      employees: [],
      courses: [],
      forms: [],
      crmForms: [],
      followUps: [],
      syncLogs: [],
      notifications: [],
      activities: [],
      firebaseConfig: null,
      firebaseConnected: false,
      dateFilter: 'all',
      searchQuery: '',
      sidebarCollapsed: false,

      setLeads: (leads) => set({ leads }),
      addLead: (lead) => set((s) => ({ leads: [lead, ...s.leads] })),
      updateLead: (id, u) => set((s) => ({ leads: s.leads.map((l) => l.id === id ? { ...l, ...u } : l) })),
      deleteLead: (id) => set((s) => ({ leads: s.leads.filter((l) => l.id !== id) })),

      addEmployee: (e) => set((s) => ({ employees: [...s.employees, e] })),
      updateEmployee: (id, u) => set((s) => ({ employees: s.employees.map((e) => e.id === id ? { ...e, ...u } : e) })),
      deleteEmployee: (id) => set((s) => ({ employees: s.employees.filter((e) => e.id !== id) })),

      addCourse: (c) => set((s) => ({ courses: [...s.courses, c] })),
      updateCourse: (id, u) => set((s) => ({ courses: s.courses.map((c) => c.id === id ? { ...c, ...u } : c) })),
      deleteCourse: (id) => set((s) => ({ courses: s.courses.filter((c) => c.id !== id) })),

      addForm: (f) => set((s) => ({ forms: [...s.forms, f] })),
      updateForm: (id, u) => set((s) => ({ forms: s.forms.map((f) => f.id === id ? { ...f, ...u } : f) })),
      deleteForm: (id) => set((s) => ({ forms: s.forms.filter((f) => f.id !== id) })),

      addCRMForm: (f) => set((s) => ({ crmForms: [...s.crmForms, f] })),
      updateCRMForm: (id, u) => set((s) => ({ crmForms: s.crmForms.map((f) => f.id === id ? { ...f, ...u } : f) })),
      deleteCRMForm: (id) => set((s) => ({ crmForms: s.crmForms.filter((f) => f.id !== id) })),
      incrementFormSubmissions: (id) => set((s) => ({
        crmForms: s.crmForms.map((f) => f.id === id ? { ...f, submissions: f.submissions + 1 } : f)
      })),

      addFollowUp: (fu) => set((s) => ({ followUps: [fu, ...s.followUps] })),
      updateFollowUp: (id, u) => set((s) => ({ followUps: s.followUps.map((f) => f.id === id ? { ...f, ...u } : f) })),

      addSyncLog: (l) => set((s) => ({ syncLogs: [l, ...s.syncLogs] })),
      addActivity: (a) => set((s) => ({ activities: [a, ...s.activities] })),
      addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications] })),
      markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n) })),
      markAllNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      setFirebaseConfig: (cfg) => set({ firebaseConfig: cfg }),
      setFirebaseConnected: (v) => set({ firebaseConnected: v }),

      setDateFilter: (f) => set({ dateFilter: f }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: 'guhanix-crm-v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
