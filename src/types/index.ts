// ============================================
// KARPUTINDO NET — Shared Types
// ============================================

// User Roles
export type UserRole = 'SUPER_ADMIN' | 'ADMIN';

// Customer Status
export type CustomerStatus = 'ACTIVE' | 'INSTALLATION' | 'INACTIVE' | 'TERMINATED' | 'SUSPENDED' | 'ISOLIR';

// Package Status
export type PackageStatus = 'ACTIVE' | 'INACTIVE';

// Audit Actions
export type AuditAction =
  | 'CREATE_CUSTOMER'
  | 'UPDATE_CUSTOMER'
  | 'DELETE_CUSTOMER'
  | 'LOGIN'
  | 'LOGOUT'
  | 'IMPORT'
  | 'IMPORT_CUSTOMERS'
  | 'EXPORT';

// Audit Entities
export type AuditEntity = 'User' | 'Customer' | 'InternetPackage';

// ============================================
// Status Labels (Indonesian)
// ============================================

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  ACTIVE: 'Aktif',
  INSTALLATION: 'Proses Pemasangan',
  INACTIVE: 'Tidak Aktif',
  TERMINATED: 'Berhenti',
  SUSPENDED: 'Ditangguhkan',
  ISOLIR: 'Isolir',
};

export const CUSTOMER_STATUS_OPTIONS: { value: CustomerStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'INSTALLATION', label: 'Proses Pemasangan' },
  { value: 'INACTIVE', label: 'Tidak Aktif' },
  { value: 'TERMINATED', label: 'Berhenti' },
  { value: 'SUSPENDED', label: 'Ditangguhkan' },
  { value: 'ISOLIR', label: 'Isolir' },
];

// ============================================
// NextAuth Extended Types
// ============================================

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
    };
  }

  interface User {
    role?: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  installationCustomers: number;
  terminatedCustomers: number;
  totalPackages: number;
  withCoordinates: number;
  withoutCoordinates: number;
  newInstallationsThisMonth: number;
}

export interface RecentCustomer {
  id: string;
  customerNumber: string | null;
  fullName: string;
  status: CustomerStatus;
  packageExcel: string | null;
  createdAt: string;
}

export interface PackageExcelCategory {
  category: string;
  count: number;
  packages: { name: string; count: number }[];
}

export interface StatusDistribution {
  status: string;
  label: string;
  count: number;
}

export interface CustomerGrowthData {
  month: string;
  total: number;
  aktif: number;
  berhenti: number;
}
