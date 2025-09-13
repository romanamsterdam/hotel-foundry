export type BenchmarkStatus = "draft" | "published" | "archived";
export type BenchmarkCategory = "capex" | "opex_usali" | "payroll";
export type LevelBand = "low" | "medium" | "high";

export interface BenchmarkSet {
  id: string;                // e.g., "global-default" or "eu-2025-q3"
  title: string;             // "Global Defaults v1"
  status: BenchmarkStatus;
  version: number;           // auto++ on publish
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  notes?: string;
}

export interface CapexBenchmark {
  id: string;
  setId: string;             // BenchmarkSet.id
  itemCode: string;          // e.g., "FF&E_GUESTROOM_STD"
  itemName: string;          // "FF&E – Standard Room"
  unit: "per_room" | "per_sqm" | "per_item";
  country?: string | null;   // optional locality
  low?: number | null;
  medium?: number | null;
  high?: number | null;
  currency?: string;         // "EUR", "USD"
  tags?: string[];           // ["rooms","ff&e"]
}

export interface OpexUsaliBenchmark {
  id: string;
  setId: string;
  department: string;        // "Rooms", "F&B", "Utilities", "Admin & General"
  metric: string;            // "pct_of_total_revenue" | "per_available_room" etc.
  country?: string | null;
  band: LevelBand;           // low/medium/high
  value: number;             // e.g., 12 (means 12%)
  valueType: "percent" | "absolute";
  currency?: string;         // if absolute
  notes?: string;
}

export interface PayrollBenchmark {
  id: string;
  setId: string;
  country: string;           // "PT", "ES", "IT", etc.
  role: string;              // "Receptionist", "Housekeeper", "Chef de Partie"
  seniority?: "junior" | "mid" | "senior";
  monthlyGrossLow?: number | null;
  monthlyGrossMed?: number | null;
  monthlyGrossHigh?: number | null;
  currency: string;          // "EUR"
  includesBenefits?: boolean;
}

export interface BenchmarkSnapshot {
  set: BenchmarkSet;
  capex: CapexBenchmark[];
  opex: OpexUsaliBenchmark[];
  payroll: PayrollBenchmark[];
  generatedAt: string;
}