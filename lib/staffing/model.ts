import type { StaffingAssumptions, StaffingOverrides, RequiredStaffing } from './types';
import { UTILIZATION, THRESHOLDS } from './benchmarks';
import { COVERAGE, CAPACITIES } from './defaults';
import { coversPerDayFromUnderwriting, spaTreatmentsFromUnderwriting, roomsSoldPerDayFromUnderwriting } from '../underwriting/toStaffing';
import { getDeal } from '../dealStore';
import { totalRooms } from '../rooms';

export function createDefaultAssumptions(): StaffingAssumptions {
  return {
    hoursPerWeek: UTILIZATION.hoursPerWeek,
    utilizationFactor: UTILIZATION.utilizationFactor,
    frontOffice24x7: true,
    dayPosts: COVERAGE.frontOffice.dayPosts,
    nightPosts: COVERAGE.frontOffice.nightPosts,
    security24x7: false,
    securityNightPosts: COVERAGE.security.nightPosts,
    breakfastActive: true,
    breakfastHours: 3,
    breakfastCovers: 40,
    lunchActive: true,
    lunchHours: 4,
    lunchCovers: 25,
    dinnerActive: true,
    dinnerHours: 5,
    dinnerCovers: 35,
    barActive: true,
    barHours: 8,
    barCovers: 60,
    roomsPerAttendant: CAPACITIES.housekeeping.roomsPerAttendantPerShift,
    housekeepingShiftHours: CAPACITIES.housekeeping.shiftHours,
    spaHours: 10,
    treatmentsPerDay: 8
  };
}

export function calculateRequiredStaffing(
  dealId: string,
  year: number,
  assumptions: StaffingAssumptions,
  overrides: StaffingOverrides = {}
): RequiredStaffing[] {
  const deal = getDeal(dealId);
  if (!deal) return [];

  const rooms = totalRooms(deal.roomTypes);
  const productiveHours = assumptions.hoursPerWeek * assumptions.utilizationFactor;
  const results: RequiredStaffing[] = [];

  // Get current payroll data
  const payrollRoles = deal.payrollModel?.advanced || [];
  
  // Get rooms sold per day for selected year from underwriting
  const roomsSoldPerDay = roomsSoldPerDayFromUnderwriting(dealId, year - 1);
  
  // Get covers from underwriting (with overrides)
  const underwritingCovers = coversPerDayFromUnderwriting(dealId, year - 1);
  const spaFromUnderwriting = spaTreatmentsFromUnderwriting(dealId);

  // Front Office
  if (assumptions.frontOffice24x7) {
    const requiredHoursPerWeek = (assumptions.dayPosts * assumptions.hoursPerWeek) + 
                                 (assumptions.nightPosts * (24 * 7 - assumptions.hoursPerWeek));
    const requiredFTE = requiredHoursPerWeek / productiveHours;
    
    const providedFTE = payrollRoles
      .filter(role => role.dept === 'rooms' && (role.title.toLowerCase().includes('reception') || role.title.toLowerCase().includes('front')))
      .reduce((sum, role) => sum + role.ftes, 0);

    results.push({
      dept: 'frontOffice',
      role: 'Reception Staff',
      requiredFTE,
      providedFTE,
      gapFTE: requiredFTE - providedFTE,
      reason: '24/7 coverage with day/night posts'
    });
  }

  // Housekeeping
  const attendantsNeeded = Math.ceil(roomsSoldPerDay / assumptions.roomsPerAttendant);
  const housekeepingHoursPerWeek = attendantsNeeded * assumptions.housekeepingShiftHours * 7;
  const housekeepingRequiredFTE = housekeepingHoursPerWeek / productiveHours;
  
  const housekeepingProvidedFTE = payrollRoles
    .filter(role => role.dept === 'rooms' && role.title.toLowerCase().includes('housekeeping'))
    .reduce((sum, role) => sum + role.ftes, 0);

  results.push({
    dept: 'housekeeping',
    role: 'Room Attendants',
    requiredFTE: housekeepingRequiredFTE,
    providedFTE: housekeepingProvidedFTE,
    gapFTE: housekeepingRequiredFTE - housekeepingProvidedFTE,
    reason: `${roomsSoldPerDay.toFixed(0)} rooms/day ÷ ${assumptions.roomsPerAttendant} per attendant`
  });

  // F&B Service
  const fbPeriods = [
    { 
      active: assumptions.breakfastActive, 
      hours: overrides.breakfast?.hours ?? assumptions.breakfastHours, 
      covers: overrides.breakfast?.coversPerDay ?? underwritingCovers.breakfast, 
      name: 'Breakfast' 
    },
    { 
      active: assumptions.lunchActive, 
      hours: overrides.lunch?.hours ?? assumptions.lunchHours, 
      covers: overrides.lunch?.coversPerDay ?? underwritingCovers.lunch, 
      name: 'Lunch' 
    },
    { 
      active: assumptions.dinnerActive, 
      hours: overrides.dinner?.hours ?? assumptions.dinnerHours, 
      covers: overrides.dinner?.coversPerDay ?? underwritingCovers.dinner, 
      name: 'Dinner' 
    }
  ];

  let totalServiceHours = 0;
  fbPeriods.forEach(period => {
    if (period.active) {
      const serversNeeded = Math.ceil(period.covers / CAPACITIES.fbService.coversPerServerPerHour);
      totalServiceHours += serversNeeded * period.hours;
    }
  });

  const fbServiceRequiredFTE = (totalServiceHours * 7) / productiveHours;
  const fbServiceProvidedFTE = payrollRoles
    .filter(role => role.dept === 'fnb' && (role.title.toLowerCase().includes('waiter') || role.title.toLowerCase().includes('service')))
    .reduce((sum, role) => sum + role.ftes, 0);

  results.push({
    dept: 'fbService',
    role: 'F&B Service Staff',
    requiredFTE: fbServiceRequiredFTE,
    providedFTE: fbServiceProvidedFTE,
    gapFTE: fbServiceRequiredFTE - fbServiceProvidedFTE,
    reason: 'Based on expected covers and service periods'
  });

  // Kitchen
  const totalKitchenCovers = fbPeriods
    .filter(p => p.active)
    .reduce((sum, p) => sum + p.covers, 0);
  
  const kitchenHoursPerDay = Math.max(...fbPeriods.filter(p => p.active).map(p => p.hours));
  const chefsNeeded = Math.ceil(totalKitchenCovers / CAPACITIES.kitchen.coversPerChefPerHour);
  const kitchenRequiredFTE = (chefsNeeded * kitchenHoursPerDay * 7) / productiveHours;
  
  const kitchenProvidedFTE = payrollRoles
    .filter(role => role.dept === 'fnb' && (role.title.toLowerCase().includes('chef') || role.title.toLowerCase().includes('cook')))
    .reduce((sum, role) => sum + role.ftes, 0);

  results.push({
    dept: 'kitchen',
    role: 'Kitchen Staff',
    requiredFTE: kitchenRequiredFTE,
    providedFTE: kitchenProvidedFTE,
    gapFTE: kitchenRequiredFTE - kitchenProvidedFTE,
    reason: `${totalKitchenCovers} covers/day across active periods`
  });

  // Bar
  if (assumptions.barActive) {
    const barCovers = overrides.bar?.coversPerDay ?? underwritingCovers.bar;
    const barHours = overrides.bar?.hours ?? assumptions.barHours;
    const bartendersNeeded = Math.ceil(barCovers / CAPACITIES.bar.coversPerBartenderPerHour);
    const barRequiredFTE = (bartendersNeeded * barHours * 7) / productiveHours;
    
    const barProvidedFTE = payrollRoles
      .filter(role => role.dept === 'fnb' && role.title.toLowerCase().includes('bar'))
      .reduce((sum, role) => sum + role.ftes, 0);

    results.push({
      dept: 'bar',
      role: 'Bar Staff',
      requiredFTE: barRequiredFTE,
      providedFTE: barProvidedFTE,
      gapFTE: barRequiredFTE - barProvidedFTE,
      reason: `${barCovers} covers/day over ${barHours} hours`
    });
  }

  // Wellness/Spa
  const treatmentsPerDay = overrides.spa?.treatmentsPerDay ?? spaFromUnderwriting.treatmentsPerDay;
  const spaOpenHours = overrides.spa?.openHours ?? spaFromUnderwriting.openHours;
  
  if (treatmentsPerDay > 0) {
    const treatmentDurationHrs = 1; // Default 1 hour per treatment
    const therapistHoursPerDay = treatmentsPerDay * treatmentDurationHrs;
    const weeklyHours = therapistHoursPerDay * 7;
    const spaRequiredFTE = weeklyHours / productiveHours;
    
    const spaProvidedFTE = payrollRoles
      .filter(role => role.dept === 'wellness')
      .reduce((sum, role) => sum + role.ftes, 0);

    results.push({
      dept: 'wellness',
      role: 'Spa Therapists',
      requiredFTE: spaRequiredFTE,
      providedFTE: spaProvidedFTE,
      gapFTE: spaRequiredFTE - spaProvidedFTE,
      reason: `${treatmentsPerDay} treatment${treatmentsPerDay === 1 ? '' : 's'}/day over ${spaOpenHours} hours`
    });
  }

  return results;
}

export function getRoomsSoldPerDay(deal: Deal, year: number): number {
  return roomsSoldPerDayFromUnderwriting(deal.id, year - 1);
}