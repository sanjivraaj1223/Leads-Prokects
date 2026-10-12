export type LeadStatus =
  | 'NEW' | 'CONTACTED' | 'CALLBACK' | 'INTERESTED' | 'FOLLOW_UP'
  | 'DEMO_SCHEDULED' | 'PAYMENT_PENDING' | 'CONVERTED' | 'NOT_INTERESTED' | 'LOST';

export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type LeadSource =
  | 'GOOGLE_FORM' | 'CRM_FORM' | 'WEBSITE' | 'WHATSAPP'
  | 'INSTAGRAM' | 'LINKEDIN' | 'COLLEGE_SEMINAR' | 'WORKSHOP'
  | 'WEBINAR' | 'REFERRAL' | 'DIRECT';

export type ActivityType =
  | 'LEAD_CREATED' | 'STATUS_CHANGED' | 'CALL' | 'WHATSAPP' | 'EMAIL'
  | 'MEETING' | 'FOLLOW_UP_ADDED' | 'FOLLOW_UP_COMPLETED' | 'NOTE_ADDED'
  | 'ASSIGNED' | 'PAYMENT' | 'CONVERTED' | 'DEMO';

export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'RESCHEDULED' | 'MISSED';

export type EmployeeRole = 'ADMIN' | 'MANAGER' | 'SALES_EXECUTIVE' | 'COUNSELLOR' | 'EMPLOYEE';

export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'CHEQUE' | 'ONLINE';

// ── Form Builder ─────────────────────────────────────────────────────────────

export type FormFieldType =
  | 'text' | 'email' | 'phone' | 'number' | 'textarea'
  | 'select' | 'radio' | 'checkbox' | 'date';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];          // for select / radio / checkbox
  mapTo?: string;              // CRM lead field it maps to
}

export interface CRMForm {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
  status: 'ACTIVE' | 'INACTIVE';
  submissions: number;
  accentColor?: string;
  logoUrl?: string;
  successMessage?: string;
  // Firebase collection path: crm_forms/{formId}/submissions/{docId}
}

// ── Firebase config ───────────────────────────────────────────────────────────

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// ── Other existing types ──────────────────────────────────────────────────────

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: EmployeeRole;
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  avatar?: string;
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  duration?: string;
  fee?: number;
  category?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface GoogleForm {
  id: string;
  name: string;
  formUrl: string;
  sheetUrl: string;
  spreadsheetId: string;
  connectedDate: string;
  lastSync?: string;
  leadCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  fieldMappings?: FieldMapping[];
  syncLogs?: SyncLog[];
}

export interface FieldMapping {
  formField: string;
  leadField: string;
  isRequired: boolean;
}

export interface SyncLog {
  id: string;
  formId: string;
  formName: string;
  syncedAt: string;
  recordsFound: number;
  newLeads: number;
  duplicates: number;
  updated: number;
  errors: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  errorMessage?: string;
}

export interface Activity {
  id: string;
  leadId: string;
  type: ActivityType;
  title: string;
  notes?: string;
  createdAt: string;
  employeeId: string;
  employeeName: string;
  metadata?: Record<string, unknown>;
}

export interface FollowUp {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  scheduledDate: string;
  scheduledTime: string;
  reason: string;
  notes?: string;
  status: FollowUpStatus;
  completedAt?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  leadId: string;
  courseId: string;
  courseName: string;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  employeeId: string;
  notes?: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  leadId: string;
  name: string;
  phone: string;
  email?: string;
  college?: string;
  course?: string;
  year?: string;
  location?: string;
  sourceForm?: string;
  sourceFormId?: string;
  leadSource: LeadSource;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  status: LeadStatus;
  priority: LeadPriority;
  createdAt: string;
  lastContacted?: string;
  nextFollowUp?: string;
  expectedValue?: number;
  notes?: string;
  submissionCount: number;
  isDuplicate: boolean;
  activities?: Activity[];
  followUps?: FollowUp[];
  payment?: Payment;
  customFields?: Record<string, string>;
}

export interface Notification {
  id: string;
  type: 'NEW_LEAD' | 'FOLLOW_UP_DUE' | 'FOLLOW_UP_OVERDUE' | 'ASSIGNED' | 'PAYMENT' | 'CONVERTED' | 'SYNC_FAILURE';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  leadId?: string;
}
