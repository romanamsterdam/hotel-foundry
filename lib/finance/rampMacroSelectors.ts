import { getDeal } from "../dealStore";
import { sortYearKeys, SeriesByYear, YearKey, buildIndexFromRates } from "./factors";

function yearsFor(deal: any): YearKey[] {
  // Default to Y0-Y10 for consistency
  return ["y0","y1","y2","y3","y4","y5","y6","y7","y8","y9","y10"] as YearKey[];
}

function expandRate(rate: number, years: YearKey[]): SeriesByYear {
  const out: Partial<SeriesByYear> = {};
  years.forEach((y, i) => out[y] = i === 0 ? 0 : rate);
  return out as SeriesByYear;
}

function expandMult(mult: number, years: YearKey[]): SeriesByYear {
  const out: Partial<SeriesByYear> = {};
  years.forEach((y, i) => out[y] = i === 0 ? 1 : mult);
  return out as SeriesByYear;
}

export function selectToplineGrowthRateByYear(dealId: string): SeriesByYear {
  const d = getDeal(dealId);
  const years = yearsFor(d);
  const map = d?.assumptions?.macro?.toplineGrowthRateByYear as SeriesByYear | undefined;
  const flat = Number(d?.assumptions?.rampSettings?.toplineGrowthPct ?? d?.assumptions?.macro?.toplineGrowthRate ?? 3) / 100;
  return map && Object.keys(map).length ? map : expandRate(flat, years);
}

export function selectInflationRateByYear(dealId: string): SeriesByYear {
  const d = getDeal(dealId);
  const years = yearsFor(d);
  const map = d?.assumptions?.macro?.inflationRateByYear as SeriesByYear | undefined;
  const flat = Number(d?.assumptions?.rampSettings?.inflationPct ?? d?.assumptions?.macro?.inflation ?? d?.assumptions?.macro?.inflationRate ?? 2) / 100;
  return map && Object.keys(map).length ? map : expandRate(flat, years);
}

export function selectToplineRampByYear(dealId: string): SeriesByYear {
  const d = getDeal(dealId);
  const years = yearsFor(d);
  const map = d?.assumptions?.ramp?.toplineByYear as SeriesByYear | undefined;
  
  if (map && Object.keys(map).length) {
    const out: Partial<SeriesByYear> = {};
    years.forEach((y, i) => {
      if (i === 0) out[y] = 1;
      else out[y] = map[y] ?? (Number(y.slice(1)) >= 5 ? 1 : map[`y${i}` as YearKey] ?? 1);
    });
    return out as SeriesByYear;
  }
  
  // Use rampSettings revenueRamp array
  const revenueRamp = d?.assumptions?.rampSettings?.revenueRamp || [0.80, 0.90, 1.00, 1.00];
  const out: Partial<SeriesByYear> = {};
  years.forEach((y, i) => {
    if (i === 0) {
      out[y] = 1;
    } else {
      const yearNum = Number(y.slice(1));
      if (yearNum <= 4) {
        out[y] = revenueRamp[yearNum - 1] || 1;
      } else {
        out[y] = 1;
      }
    }
  });
  return out as SeriesByYear;
}

export function selectCostRampByYear(dealId: string): SeriesByYear {
  const d = getDeal(dealId);
  const years = yearsFor(d);
  const map = d?.assumptions?.ramp?.costsByYear as SeriesByYear | undefined;
  
  if (map && Object.keys(map).length) {
    const out: Partial<SeriesByYear> = {};
    years.forEach((y, i) => {
      if (i === 0) out[y] = 1;
      else out[y] = map[y] ?? (Number(y.slice(1)) >= 5 ? 1 : map[`y${i}` as YearKey] ?? 1);
    });
    return out as SeriesByYear;
  }
  
  // Use rampSettings costRamp array
  const costRamp = d?.assumptions?.rampSettings?.costRamp || [1.10, 1.05, 1.00, 1.00];
  const out: Partial<SeriesByYear> = {};
  years.forEach((y, i) => {
    if (i === 0) {
      out[y] = 1;
    } else {
      const yearNum = Number(y.slice(1));
      if (yearNum <= 4) {
        out[y] = costRamp[yearNum - 1] || 1;
      } else {
        out[y] = 1;
      }
    }
  });
  return out as SeriesByYear;
}

export function selectExitYearIndex(dealId: string): number {
  const d = getDeal(dealId);
  const exitSettings = d?.assumptions?.exitSettings;
  
  if (exitSettings?.strategy === "SALE") {
    return exitSettings.sale.exitYear;
  } else if (exitSettings?.strategy === "REFINANCE") {
    return exitSettings.refinance.refinanceYear;
  }
  
  return 10; // Default hold forever
}