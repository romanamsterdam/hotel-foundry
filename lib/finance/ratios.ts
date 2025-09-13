import { SeriesByYear, YearKey, yearsThrough, sortYearKeys } from "./factors";
import { selectCostRampByYear, selectExitYearIndex } from "./rampMacroSelectors";
import { getDeal } from "../dealStore";

/** Given a baseline ratio (e.g., Utilities = 0.03), returns ratioByYear with Cost Ramp (Y5+ = 1.00). */
export function ratioWithCostRamp(dealId: string, baselineRatio: number): SeriesByYear {
  const d = getDeal(dealId);
  const yearsAll = ["y0","y1","y2","y3","y4","y5","y6","y7","y8","y9","y10"] as YearKey[];
  const years = yearsThrough(yearsAll, selectExitYearIndex(dealId));
  const ramp = selectCostRampByYear(dealId);
  
  const out: Partial<SeriesByYear> = {};
  years.forEach((y, i) => {
    out[y] = i === 0 ? baselineRatio : baselineRatio * (ramp[y] ?? 1);
  });
  
  return out as SeriesByYear;
}

/** Apply cost ramp to per-room-night costs */
export function perRoomNightWithCostRamp(
  dealId: string, 
  baselineCostPerRoomNight: number,
  roomsSoldByYear: SeriesByYear
): SeriesByYear {
  const d = getDeal(dealId);
  const yearsAll = ["y0","y1","y2","y3","y4","y5","y6","y7","y8","y9","y10"] as YearKey[];
  const years = yearsThrough(yearsAll, selectExitYearIndex(dealId));
  const ramp = selectCostRampByYear(dealId);
  
  const out: Partial<SeriesByYear> = {};
  years.forEach((y, i) => {
    const roomsSold = roomsSoldByYear[y] ?? 0;
    const rampMultiplier = i === 0 ? 1 : (ramp[y] ?? 1);
    out[y] = baselineCostPerRoomNight * roomsSold * rampMultiplier;
  });
  
  return out as SeriesByYear;
}