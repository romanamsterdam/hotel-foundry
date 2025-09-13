import { getDeal } from '../dealStore';
import { buildMultipliers } from '../applyMultipliers';

import { getDeal } from '../dealStore';
import { buildMultipliers } from '../applyMultipliers';

export type MealPeriod = 'breakfast' | 'lunch' | 'dinner' | 'bar';

export function getMealPeriodAssumptions(dealId: string) {
  const deal = getDeal(dealId);
  
  if (!deal?.fnbRevenue) {
    return {
      capturePct: { breakfast: 0, lunch: 0, dinner: 0, bar: 0 },
      avgCheckGuest: 0,
      externalCustomersPerDay: { breakfast: 0, lunch: 0, dinner: 0, bar: 0 },
      avgCheckExternal: 0
    };
  }

  const { fnbRevenue } = deal;
  
  if (fnbRevenue.mode === 'advanced') {
    return {
      capturePct: {
        breakfast: fnbRevenue.advanced.breakfast.guestCapturePct / 100,
        lunch: fnbRevenue.advanced.lunch.guestCapturePct / 100,
        dinner: fnbRevenue.advanced.dinner.guestCapturePct / 100,
        bar: fnbRevenue.advanced.bar.guestCapturePct / 100
      },
      avgCheckGuest: fnbRevenue.simple.avgCheckGuest,
      externalCustomersPerDay: {
        breakfast: fnbRevenue.advanced.breakfast.externalCoversPerDay,
        lunch: fnbRevenue.advanced.lunch.externalCoversPerDay,
        dinner: fnbRevenue.advanced.dinner.externalCoversPerDay,
        bar: fnbRevenue.advanced.bar.externalCoversPerDay
      },
      avgCheckExternal: fnbRevenue.simple.avgCheckExternal
    };
  } else {
    // Simple mode - distribute across meals using weights
    const weights = fnbRevenue.distributionWeights;
    const totalCapture = fnbRevenue.simple.totalGuestCapturePct / 100;
    const totalExternal = fnbRevenue.simple.externalCoversPerDay;
    
    return {
      capturePct: {
        breakfast: totalCapture * (weights.breakfast / 100),
        lunch: totalCapture * (weights.lunch / 100),
        dinner: totalCapture * (weights.dinner / 100),
        bar: totalCapture * (weights.bar / 100)
      },
      avgCheckGuest: fnbRevenue.simple.avgCheckGuest,
      externalCustomersPerDay: {
        breakfast: totalExternal * (weights.breakfast / 100),
        lunch: totalExternal * (weights.lunch / 100),
        dinner: totalExternal * (weights.dinner / 100),
        bar: totalExternal * (weights.bar / 100)
      },
      avgCheckExternal: fnbRevenue.simple.avgCheckExternal
    };
  }
}

export function getRoomsSoldByYear(dealId: string): number[] {
  const deal = getDeal(dealId);
  if (!deal?.roomRevenue) {
    return Array(10).fill(0);
  }

  const baseSold = deal.roomRevenue.totals.roomsSold;
  const rampSettings = deal.assumptions?.rampSettings;
  const revenueRamp = rampSettings?.revenueRamp || [0.8, 0.9, 1.0, 1.0];
  const toplineGrowthPct = rampSettings?.toplineGrowthPct || 3;
  
  const multipliers = buildMultipliers(
    10,
    revenueRamp as [number,number,number,number],
    [1.0, 1.0, 1.0, 1.0] as [number,number,number,number], // Don't need cost ramp
    toplineGrowthPct / 100,
    0 // Don't need inflation
  );

  return Array.from({ length: 10 }, (_, i) => {
    const year = i + 1;
    if (year <= 4) {
      return baseSold * multipliers.revenueRamp[i];
    } else {
      return baseSold * multipliers.toplineGrowth[i];
    }
  });
}

export function getGuestsPerOccRoom(dealId: string): number {
  const deal = getDeal(dealId);
  
  // Try to get from F&B revenue model
  if (deal?.fnbRevenue?.simple?.avgGuestsPerOccRoom) {
    return deal.fnbRevenue.simple.avgGuestsPerOccRoom;
  }
  
  // Default for leisure hotels
  return 2.0;
}

export function getSpaAssumptions(dealId: string) {
  const deal = getDeal(dealId);
  
  if (!deal?.otherRevenue?.spa) {
    return {
      treatmentsPerDay: 0,
      avgPrice: 0,
      openHours: 10
    };
  }

  return {
    treatmentsPerDay: deal.otherRevenue.spa.treatmentsPerDay,
    avgPrice: deal.otherRevenue.spa.avgPricePerTreatment,
    openHours: 10 // Default - could be added to otherRevenue model later
  };
}