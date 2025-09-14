// src/lib/finance/kpis.ts
export type YearKey = `y${number}`;

import { clampPreOpToZero } from "./series";
import { getDeal } from "../dealStore";
import { buildMultipliers } from "../applyMultipliers";

export function selectKpisForYear(dealId: string, yearIndex: number) {
  const y: YearKey = `y${yearIndex}`;
  const deal = getDeal(dealId);
  
  if (!deal) {
    return { 
      adr: 0, 
      occ: 0, 
      revpar: 0, 
      inflation: 0, 
      rampCosts: 1, 
      rampTopline: 1, 
      toplineGrowth: 0 
    };
  }

  // Get ADR, Occupancy, RevPAR from room revenue model
  let adr = 0;
  let occ = 0;
  let revpar = 0;

  if (deal.roomRevenue && yearIndex > 0) {
    // Get base values from room revenue model
    const baseAdr = deal.roomRevenue.totals.avgADR;
    const baseOcc = deal.roomRevenue.totals.avgOccPct;
    
    // Apply ramp/growth multipliers
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

    if (yearIndex <= 4) {
      adr = baseAdr * multipliers.revenueRamp[yearIndex - 1];
    } else {
      adr = baseAdr * multipliers.toplineGrowth[yearIndex - 1];
    }
    
    occ = baseOcc; // Occupancy typically doesn't ramp
    revpar = adr * (occ / 100);
  }

  // Get ramp and macro factors
  const rampSettings = deal.assumptions?.rampSettings;
  const revenueRamp = rampSettings?.revenueRamp || [0.8, 0.9, 1.0, 1.0];
  const costRamp = rampSettings?.costRamp || [1.10, 1.05, 1.0, 1.0];
  const toplineGrowthPct = rampSettings?.toplineGrowthPct || 3;
  const inflationPct = rampSettings?.inflationPct || 2;

  let rampTopline = 1;
  let rampCosts = 1;
  let toplineGrowth = 0;
  let inflation = 0;

  if (yearIndex > 0) {
    if (yearIndex <= 4) {
      rampTopline = revenueRamp[yearIndex - 1];
      rampCosts = costRamp[yearIndex - 1];
    } else {
      rampTopline = 1;
      rampCosts = 1;
      // Growth factors compound from Year 5 onward
      const growthYears = yearIndex - 4;
      toplineGrowth = toplineGrowthPct / 100;
      inflation = inflationPct / 100;
    }
  }

  return { 
    adr, 
    occ, 
    revpar, 
    inflation, 
    rampCosts, 
    rampTopline, 
    toplineGrowth 
  };
}