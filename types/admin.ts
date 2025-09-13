// Import unified property types
import { SampleProperty } from '../types/property';
export { SampleProperty } from '../types/property';

export type AdminUser = {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
  lastActiveAt?: string;
  dealsCount: number;
  role: 'user' | 'admin';
};

export type AdminDeal = {
  id: string;
  userId: string;
  userEmail?: string;
  title: string;
  lastEditedAt: string;
  totalProjectCost?: number;   // currency number
  projectIRR?: number;         // decimal e.g., 0.17
  
  // Key inputs (subset for Inspect page)
  kpis?: {
    rooms?: number;
    adr?: number;
    occ?: number; // 0..1
    revpar?: number;
  };
  payroll?: Record<string, number>;
  opex?: Record<string, number>;
  capex?: { 
    year0?: number; 
    items?: Array<{name: string; amount: number}> 
  };
  financing?: { 
    ltv?: number; 
    rate?: number; 
    termYears?: number 
  };
  exit?: { 
    year?: number; 
    exitCapRate?: number; 
    salePrice?: number 
  };
};

export type ListParams = {
  search?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  userId?: string; // for filtering deals by user
};

export type ListResult<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};