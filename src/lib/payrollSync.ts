import { PayrollSimple, PayrollAdvanced, PayrollState, DeptKey } from '../types/payroll';
import { serviceLevelMultipliers, compStrategyMultipliers, roleSalaryFactors, baselineFtes } from '../data/payrollDefaults';

// Management roles that should be capped at 1 FTE when auto-generated
const MANAGEMENT_ROLES = [
  "Front Office Manager",
  "F&B Manager", 
  "Executive Chef",
  "Head of Wellness",
  "Hotel Manager",
  "Finance Manager",
  "HR Manager",
  "Sales & Marketing Manager"
];

export function simpleToAdvanced(simple: PayrollSimple, state: PayrollState): PayrollAdvanced {
  const serviceLevelMult = serviceLevelMultipliers[simple.serviceLevel];
  const compMult = compStrategyMultipliers[simple.compStrategy];
  
  return Object.entries(baselineFtes).flatMap(([dept, roles]) =>
    roles.map(role => ({
      id: crypto.randomUUID(),
      dept: dept as DeptKey,
      title: role.title,
      ftes: (() => {
        const calculatedFte = Math.round((role.factorOfFtePerRoom * simple.roomsCount * serviceLevelMult) * 10) / 10;
        // Cap management roles at 1 FTE for initial generation
        if (MANAGEMENT_ROLES.includes(role.title) && calculatedFte > 1) {
          return 1;
        }
        return calculatedFte;
      })(),
      baseSalary: Math.round(simple.baseReceptionSalary * roleSalaryFactors[role.title] * compMult),
      employerCostPct: simple.employerCostPct
    }))
  );
}

export function advancedToSimple(advanced: PayrollAdvanced, roomsCount: number): PayrollSimple {
  if (advanced.length === 0) {
    return {
      serviceLevel: "upscale",
      compStrategy: "market",
      countryCode: "PT",
      employerCostPct: 25,
      baseReceptionSalary: 20000,
      ftePerRoom: 1.3,
      roomsCount
    };
  }

  // Calculate totals
  const totalFtes = advanced.reduce((sum, role) => sum + role.ftes, 0);
  const ftePerRoom = roomsCount > 0 ? totalFtes / roomsCount : 1.3;
  
  // Use median employer cost percentage
  const employerCosts = advanced.map(r => r.employerCostPct).sort((a, b) => a - b);
  const employerCostPct = employerCosts[Math.floor(employerCosts.length / 2)] || 25;
  
  // Find receptionist role or use closest to factor 1.0
  const receptionistRole = advanced.find(r => r.title === "Receptionist");
  let baseReceptionSalary = 20000;
  
  if (receptionistRole) {
    baseReceptionSalary = receptionistRole.baseSalary;
  } else {
    // Find role closest to factor 1.0
    const closestRole = advanced.reduce((closest, role) => {
      const factor = roleSalaryFactors[role.title] || 1.0;
      const closestFactor = roleSalaryFactors[closest.title] || 1.0;
      return Math.abs(factor - 1.0) < Math.abs(closestFactor - 1.0) ? role : closest;
    }, advanced[0]);
    
    const factor = roleSalaryFactors[closestRole.title] || 1.0;
    baseReceptionSalary = Math.round(closestRole.baseSalary / factor);
  }
  
  // Infer service level and comp strategy by minimizing error
  let bestServiceLevel: ServiceLevel = "upscale";
  let bestCompStrategy: CompStrategy = "market";
  let minError = Infinity;
  
  for (const serviceLevel of Object.keys(serviceLevelMultipliers) as ServiceLevel[]) {
    for (const compStrategy of Object.keys(compStrategyMultipliers) as CompStrategy[]) {
      const serviceMult = serviceLevelMultipliers[serviceLevel];
      const compMult = compStrategyMultipliers[compStrategy];
      
      // Calculate expected FTE per room for this combination
      const expectedFtePerRoom = Object.values(baselineFtes)
        .flat()
        .reduce((sum, role) => sum + role.factorOfFtePerRoom, 0) * serviceMult;
      
      const fteError = Math.abs(ftePerRoom - expectedFtePerRoom);
      if (fteError < minError) {
        minError = fteError;
        bestServiceLevel = serviceLevel;
        bestCompStrategy = compStrategy;
      }
    }
  }
  
  return {
    serviceLevel: bestServiceLevel,
    compStrategy: bestCompStrategy,
    countryCode: "PT",
    employerCostPct,
    baseReceptionSalary,
    ftePerRoom,
    roomsCount
  };
}