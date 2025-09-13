// src/lib/staffing/benchmarks.ts
// Canonical, single-source exports for staffing benchmarks & thresholds.
// Do NOT redeclare or re-export these names elsewhere in this file.

export const UTILIZATION = {
  hoursPerWeek: 40,
  utilizationFactor: 0.8, // ~80% productive after PTO/sick/training
} as const;

export const THRESHOLDS = {
  gapCriticalFTE: 0.5,   // red if shortfall ≥ 0.5 FTE
  gapWarningFTE: 0.2,    // amber if 0.2–0.5 FTE short
  overstaffAmberFTE: -0.3, // amber if >0.3 FTE excess
  dscr: { green: 1.35, amber: 1.20 },   // DSCR color bands
  icr:  { green: 2.0,  amber: 1.5  },   // ICR color bands
  hkRoomsPerAttendant: { low: 10, high: 25 }, // <10 low, >25 unrealistic
} as const;

export const CAPACITIES = {
  fbService:   { coversPerServerPerHour: 12 }, // diners/server/hr
  bar:         { coversPerBartenderPerHour: 25 },
  kitchen:     { coversPerChefPerHour: 20 },
  housekeeping:{ roomsPerAttendantPerShift: 15, shiftHours: 8 },
  spa:         { treatmentsPerTherapistPerHour: 1, defaultOpenHours: 10 },
} as const;

export const BENCHMARKS = {
  housekeeping: "12–18 rooms/attendant per 8h shift (10 low, 25+ unrealistic)",
  frontOffice:  "≈5.25 FTE per 24/7 post (168 hrs/week ÷ ~32 productive hrs/FTE)",
  fbService:    "10–14 diners per server per hour",
  kitchen:      "15–25 diners per chef per hour",
  bar:          "20–30 drinks/covers per bartender per hour",
  spa:          "5–7 treatments/therapist/day (bookable ~6 hrs/day)",
} as const;

export function getBenchmarkText(dept: string, role: string): string {
  switch (dept) {
    case 'frontOffice':
      return BENCHMARKS.frontOffice;
    case 'housekeeping':
      return BENCHMARKS.housekeeping;
    case 'fbService':
      return BENCHMARKS.fbService;
    case 'kitchen':
      return BENCHMARKS.kitchen;
    case 'bar':
      return BENCHMARKS.bar;
    case 'wellness':
      return BENCHMARKS.spa;
    default:
      return "Industry standard productivity benchmarks";
  }
}

export function getCalculationSummary(
  dept: string,
  assumptions: any,
  roomsSoldPerDay?: number,
  overrides: any = {}
): string {
  switch (dept) {
    case 'frontOffice':
      return `24/7 coverage = ${assumptions.dayPosts} day post + ${assumptions.nightPosts} night post`;
    case 'housekeeping':
      const roomsPerAttendant = overrides.housekeeping?.roomsPerAttendant ?? assumptions.roomsPerAttendant;
      return `${roomsSoldPerDay?.toFixed(0) || 0} rooms/day ÷ ${roomsPerAttendant} per attendant`;
    case 'fbService':
      const activePeriods = [
        assumptions.breakfastActive && 'Breakfast',
        assumptions.lunchActive && 'Lunch', 
        assumptions.dinnerActive && 'Dinner'
      ].filter(Boolean);
      return `Service for ${activePeriods.join(', ')} periods`;
    case 'kitchen':
      const breakfastCovers = overrides.breakfast?.coversPerDay ?? assumptions.breakfastCovers;
      const lunchCovers = overrides.lunch?.coversPerDay ?? assumptions.lunchCovers;
      const dinnerCovers = overrides.dinner?.coversPerDay ?? assumptions.dinnerCovers;
      const totalCovers = (assumptions.breakfastActive ? breakfastCovers : 0) +
                         (assumptions.lunchActive ? lunchCovers : 0) +
                         (assumptions.dinnerActive ? dinnerCovers : 0);
      return `${totalCovers} covers/day across active periods`;
    case 'bar':
      const barCovers = overrides.bar?.coversPerDay ?? assumptions.barCovers;
      return `${barCovers} covers/day over ${assumptions.barHours} hours`;
    case 'wellness':
      const treatmentsPerDay = overrides.spa?.treatmentsPerDay ?? assumptions.treatmentsPerDay;
      return `${treatmentsPerDay} treatment${treatmentsPerDay === 1 ? '' : 's'}/day over ${assumptions.spaHours} hours`;
    default:
      return "Based on operational requirements";
  }
}

// Optional aggregator (safe):
const staffingBenchmarks = { UTILIZATION, THRESHOLDS, CAPACITIES, BENCHMARKS };
export default staffingBenchmarks;