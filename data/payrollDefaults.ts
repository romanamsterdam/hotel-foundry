import { PayrollState, DeptKey, ServiceLevel, CompStrategy } from '../types/payroll';

export const serviceLevelMultipliers: Record<ServiceLevel, number> = {
  economy: 0.7,
  midscale: 0.85,
  upscale: 1.0,
  luxury: 1.3
};

export const compStrategyMultipliers: Record<CompStrategy, number> = {
  cost: 0.8,
  market: 1.0,
  premium: 1.2
};

export const roleSalaryFactors: Record<string, number> = {
  "Receptionist": 1.0,
  "Front Office Manager": 2.25,
  "Housekeeping": 0.9,
  "Night Shift": 1.3,
  "F&B Manager": 1.6,
  "Executive Chef": 2.4,
  "Cooks": 1.6,
  "Stewarding": 1.1,
  "Waiter": 1.25,
  "Head of Wellness": 1.9,
  "Spa & Wellness attendant": 1.3,
  "Hotel Manager": 3.25,
  "Finance Manager": 2.5,
  "HR Manager": 2.25,
  "Sales & Marketing Manager": 1.6,
  "Content Creator Intern": 0.45,
  "Maintenance Clerk": 1.0
};

export const baselineFtes: Record<DeptKey, { title: string; factorOfFtePerRoom: number; minUnits?: number }[]> = {
  rooms: [
    { title: "Front Office Manager", factorOfFtePerRoom: 0.071 },
    { title: "Receptionist", factorOfFtePerRoom: 0.143 },
    { title: "Housekeeping", factorOfFtePerRoom: 0.143 },
    { title: "Night Shift", factorOfFtePerRoom: 0.054 }
  ],
  fnb: [
    { title: "F&B Manager", factorOfFtePerRoom: 0.036 },
    { title: "Executive Chef", factorOfFtePerRoom: 0.036 },
    { title: "Cooks", factorOfFtePerRoom: 0.214 },
    { title: "Stewarding", factorOfFtePerRoom: 0.143 },
    { title: "Waiter", factorOfFtePerRoom: 0.286 }
  ],
  wellness: [
    { title: "Head of Wellness", factorOfFtePerRoom: 0.018 },
    { title: "Spa & Wellness attendant", factorOfFtePerRoom: 0.071 }
  ],
  ag: [
    { title: "Hotel Manager", factorOfFtePerRoom: 0.036 },
    { title: "Finance Manager", factorOfFtePerRoom: 0.018 },
    { title: "HR Manager", factorOfFtePerRoom: 0.018 }
  ],
  sales: [
    { title: "Sales & Marketing Manager", factorOfFtePerRoom: 0.029 },
    { title: "Content Creator Intern", factorOfFtePerRoom: 0.036 }
  ],
  maintenance: [
    { title: "Maintenance Clerk", factorOfFtePerRoom: 0.036 }
  ]
};

export function createDefaultPayrollState(roomsCount: number): PayrollState {
  const simple = {
    serviceLevel: "upscale" as ServiceLevel,
    compStrategy: "market" as CompStrategy,
    countryCode: "PT",
    employerCostPct: 25,
    baseReceptionSalary: 20000,
    ftePerRoom: 1.3,
    roomsCount
  };

  // Generate advanced roles from baseline
  const serviceLevelMult = serviceLevelMultipliers[simple.serviceLevel];
  const compMult = compStrategyMultipliers[simple.compStrategy];
  
  const advanced = Object.entries(baselineFtes).flatMap(([dept, roles]) =>
    roles.map(role => ({
      id: crypto.randomUUID(),
      dept: dept as DeptKey,
      title: role.title,
      ftes: Math.round((role.factorOfFtePerRoom * roomsCount * serviceLevelMult) * 10) / 10,
      baseSalary: Math.round(simple.baseReceptionSalary * roleSalaryFactors[role.title] * compMult),
      employerCostPct: simple.employerCostPct
    }))
  );

  return {
    mode: "simple",
    simple,
    advanced,
    roleSalaryFactors,
    baselineFtes
  };
}