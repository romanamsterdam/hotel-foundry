export type DeptKey =
  | "rooms"
  | "fnb"
  | "wellness"
  | "ag"         // Admin & General
  | "sales"
  | "maintenance";

export type Role = {
  id: string;
  dept: DeptKey;
  title: string;
  ftes: number;          // FTE count
  baseSalary: number;    // annual gross per FTE (€, before employer on-costs)
  employerCostPct: number; // % applied to base
};

export type PayrollAdvanced = Role[];

export type ServiceLevel = "economy" | "midscale" | "upscale" | "luxury";
export type CompStrategy = "cost" | "market" | "premium";

export type PayrollSimple = {
  serviceLevel: ServiceLevel;             // staffing multiplier
  compStrategy: CompStrategy;             // salary multiplier
  countryCode: string;                    // affects salary baselines (static for now)
  employerCostPct: number;                // 20–35% typical
  baseReceptionSalary: number;            // anchor salary; other roles use multipliers
  ftePerRoom: number;                     // overall benchmark after service level
  roomsCount: number;                     // read-only from Rooms module
};

export type PayrollState = {
  mode: "simple" | "advanced";
  simple: PayrollSimple;
  advanced: PayrollAdvanced;
  // role salary multipliers relative to receptionist baseline
  roleSalaryFactors: Record<string, number>;
  // baseline org (FTE per 30–40 room boutique, serviceLevel="upscale" → 1.0x)
  baselineFtes: Record<DeptKey, { title: string; factorOfFtePerRoom: number; minUnits?: number }[]>;
};

export type PayrollResults = {
  totalAnnual: number;
  monthlyPayroll: number;
  perRoomAnnual: number;
  totalFtes: number;
  byDepartment: Record<DeptKey, { total: number; ftes: number }>;
  byRole: Record<string, { total: number; ftes: number; baseSalary: number }>;
};