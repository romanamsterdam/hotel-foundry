import { PayrollAdvanced, PayrollResults, DeptKey } from '../types/payroll';

export function calcAdvanced(roles: PayrollAdvanced, roomsCount: number): PayrollResults {
  const byDepartment: Record<DeptKey, { total: number; ftes: number }> = {
    rooms: { total: 0, ftes: 0 },
    fnb: { total: 0, ftes: 0 },
    wellness: { total: 0, ftes: 0 },
    ag: { total: 0, ftes: 0 },
    sales: { total: 0, ftes: 0 },
    maintenance: { total: 0, ftes: 0 }
  };

  const byRole: Record<string, { total: number; ftes: number; baseSalary: number }> = {};
  
  let totalAnnual = 0;
  let totalFtes = 0;

  roles.forEach(role => {
    const roleTotal = role.ftes * role.baseSalary * (1 + role.employerCostPct / 100);
    
    byRole[role.id] = {
      total: roleTotal,
      ftes: role.ftes,
      baseSalary: role.baseSalary
    };
    
    byDepartment[role.dept].total += roleTotal;
    byDepartment[role.dept].ftes += role.ftes;
    
    totalAnnual += roleTotal;
    totalFtes += role.ftes;
  });

  const monthlyPayroll = totalAnnual / 12;
  const perRoomAnnual = roomsCount > 0 ? totalAnnual / roomsCount : 0;

  return {
    totalAnnual,
    monthlyPayroll,
    perRoomAnnual,
    totalFtes,
    byDepartment,
    byRole
  };
}