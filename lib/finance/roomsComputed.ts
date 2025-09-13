import { getDeal } from "../dealStore";
import { YearKey, Series, sortYearKeys, buildIndexFromRates, yearsThrough } from "./factors";
import { 
  selectToplineGrowthRateByYear, 
  selectToplineRampByYear, 
  selectExitYearIndex 
} from "./rampMacroSelectors";
import { toFraction } from "./units";
import { getTotalRooms } from "../rooms";
import { Deal, RoomRevenueModel, MonthRow } from "../../types/deal";
import { computeMonthRow, rollupTotals } from "../roomRevenue";
import { seasonalityPresets } from "../../data/seasonalityPresets";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function createDefaultRoomRevenueModel(deal: Deal): RoomRevenueModel {
  const rooms = getTotalRooms(deal);
  const year = new Date().getFullYear();
  const defaultADR = 140;
  const defaultOccupancy = seasonalityPresets.majorCity;
  
  const months = Array.from({ length: 12 }, (_, i) => 
    computeMonthRow(i, year, rooms, defaultADR, defaultOccupancy[i])
  );
  
  const totals = rollupTotals(months);
  
  return {
    seasonalityPreset: 'majorCity',
    months,
    totals,
    currency: deal.currency
  };
}

export function getRoomsKpisByYear(dealId: string): {
  years: YearKey[];
  adrByYear: Series;
  occByYear: Series;
  revparByYear: Series;
  roomsAvailableByYear: Series;
  roomsSoldByYear: Series;
} {
  const deal = getDeal(dealId);
  if (!deal) {
    const emptyYears = ["y0","y1","y2","y3","y4","y5","y6","y7","y8","y9","y10"] as YearKey[];
    const emptySeries = Object.fromEntries(emptyYears.map(y => [y, 0])) as Series;
    return {
      years: emptyYears,
      adrByYear: emptySeries,
      occByYear: emptySeries,
      revparByYear: emptySeries,
      roomsAvailableByYear: emptySeries,
      roomsSoldByYear: emptySeries
    };
  }

  const allYears: YearKey[] = ["y0","y1","y2","y3","y4","y5","y6","y7","y8","y9","y10"];
  const exitYearIndex = selectExitYearIndex(dealId);
  const years = yearsThrough(allYears, exitYearIndex);

  const roomsTotal = getTotalRooms(deal);
  const days = 365;
  
  // Get baseline values from room revenue model or create defaults
  const currentRoomRevenue = deal.roomRevenue || createDefaultRoomRevenueModel(deal);
  const adrBase = currentRoomRevenue.totals.avgADR;
  const occBase = toFraction(currentRoomRevenue.totals.avgOccPct);

  // Get ramp and growth factors (NO INFLATION for topline prices)
  const toplineRamp = selectToplineRampByYear(dealId);
  const toplineGrowthRates = selectToplineGrowthRateByYear(dealId);
  
  // Build growth index ONLY for topline prices (no inflation)
  const toplineIndex = buildIndexFromRates(toplineGrowthRates, allYears, 1);

  const adrByYear: Partial<Series> = {};
  const occByYear: Partial<Series> = {};
  const revparByYear: Partial<Series> = {};
  const roomsAvailableByYear: Partial<Series> = {};
  const roomsSoldByYear: Partial<Series> = {};
  
  years.forEach((y, i) => {
    // Rooms available sticks to capacity
    const RA = roomsTotal * days;
    roomsAvailableByYear[y] = RA;
    
    if (i === 0) {
      adrByYear[y] = 0;
      occByYear[y] = 0;
      roomsSoldByYear[y] = 0;
      revparByYear[y] = 0;
      return;
    }

    // *** SPEC ***
    // ADRᵧ = ADR_base × ToplineRampᵧ × GrowthIndexᵧ (NO INFLATION)
    const ADR = adrBase * (toplineRamp[y] ?? 1) * (toplineIndex[y] ?? 1);
    // OCCᵧ = OCC_base × ToplineRampᵧ (no growth on occupancy) 
    const OCC = clamp01(occBase * (toplineRamp[y] ?? 1));
    
    adrByYear[y] = ADR;
    occByYear[y] = OCC; // Keep as 0..1 fraction
    
    // Rooms sold = RA × OCC (NO ROUNDING)
    const RS = RA * OCC;
    roomsSoldByYear[y] = RS;
    
    // RevPAR = ADR × OCC (NO ROUNDING)
    const RP = ADR * OCC;
    revparByYear[y] = RP;
  });
  
  // Debug log for Y3/Y4 growth verification (temporary)
  if (process.env.NODE_ENV !== "production") {
    const i3 = toplineIndex.y3 ?? 1, i4 = toplineIndex.y4 ?? 1;
    const adr3 = adrByYear.y3, adr4 = adrByYear.y4;
    console.debug("[RoomsKPIs] Y3->Y4 growth check:", { i3, i4, adr3, adr4, diff: (adr4 as number) - (adr3 as number) });
  }
  
  return {
    years,
    adrByYear: adrByYear as Series,
    occByYear: occByYear as Series,
    revparByYear: revparByYear as Series,
    roomsAvailableByYear: roomsAvailableByYear as Series,
    roomsSoldByYear: roomsSoldByYear as Series
  };
}