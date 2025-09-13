import { FnBState, MealKey } from '../types/fnb';

export type RoomsSelectors = {
  roomsAvailableByMonth: number[];
  roomsSoldByMonth: number[];
  roomsAvailableYearTotal: number;
  roomsSoldYearTotal: number;
};

export type FnBResults = {
  internalTotal: number;
  externalTotal: number;
  totalFnb: number;
  fnbRevPAR: number;
  byMeal: Record<MealKey, { internal: number; external: number; total: number }>;
};

export type MonthlyFnBResults = {
  month: number;
  byMeal: Record<MealKey, { internal: number; external: number; total: number }>;
  monthTotal: number;
};

export function computeAdvancedAnnual(state: FnBState, rooms: RoomsSelectors): FnBResults {
  const { advanced, simple } = state;
  const { roomsAvailableYearTotal, roomsSoldYearTotal } = rooms;
  
  let internalTotal = 0;
  let externalTotal = 0;
  const byMeal: Record<MealKey, { internal: number; external: number; total: number }> = {} as any;
  
  Object.entries(advanced).forEach(([key, meal]) => {
    const mealKey = key as MealKey;
    
    // Internal Revenue (meal) = roomsSold × avgGuestsPerOccRoom × (guestCapturePct/100) × avgCheckGuest
    const internal = roomsSoldYearTotal * simple.avgGuestsPerOccRoom * (meal.guestCapturePct / 100) * meal.avgCheckGuest;
    
    // External Revenue (meal) = externalCoversPerDay × 365 × avgCheckExternal
    const external = meal.externalCoversPerDay * 365 * meal.avgCheckExternal;
    
    const total = internal + external;
    
    byMeal[mealKey] = { internal, external, total };
    internalTotal += internal;
    externalTotal += external;
  });
  
  const totalFnb = internalTotal + externalTotal;
  const fnbRevPAR = roomsAvailableYearTotal > 0 ? totalFnb / roomsAvailableYearTotal : 0;
  
  return {
    internalTotal,
    externalTotal,
    totalFnb,
    fnbRevPAR,
    byMeal
  };
}

export function monthlySeries(state: FnBState, rooms: RoomsSelectors): MonthlyFnBResults[] {
  const { advanced, simple } = state;
  const { roomsSoldByMonth } = rooms;
  
  return roomsSoldByMonth.map((roomsSold, index) => {
    const month = index + 1;
    const daysInMonth = new Date(new Date().getFullYear(), month, 0).getDate();
    
    const byMeal: Record<MealKey, { internal: number; external: number; total: number }> = {} as any;
    let monthTotal = 0;
    
    Object.entries(advanced).forEach(([key, meal]) => {
      const mealKey = key as MealKey;
      
      // Monthly internal = roomsSoldByMonth[m] × avgGuestsPerOccRoom × (guestCapturePct/100) × avgCheckGuest
      const internal = roomsSold * simple.avgGuestsPerOccRoom * (meal.guestCapturePct / 100) * meal.avgCheckGuest;
      
      // Monthly external = externalCoversPerDay × daysInMonth[m] × avgCheckExternal
      const external = meal.externalCoversPerDay * daysInMonth * meal.avgCheckExternal;
      
      const total = internal + external;
      
      byMeal[mealKey] = { internal, external, total };
      monthTotal += total;
    });
    
    return {
      month,
      byMeal,
      monthTotal
    };
  });
}