import { Card } from "@/components/ui/card";
import { formatCurrency } from "../../lib/utils";
import { formatOccupancyPercent } from "../../lib/finance/units";
import { yearsThrough } from "../../lib/finance/factors";
import {
  selectAdrByYear,
  selectOccByYear,
  selectRevParByYear,
} from "@/lib/finance/roomRevenueSelectors";
import {
  selectInflationRateByYear,
  selectToplineGrowthRateByYear,
  selectCostRampByYear,
  selectToplineRampByYear,
  selectExitYearIndex,
} from "@/lib/finance/rampMacroSelectors";
import { buildIndexFromRates } from "../../lib/finance/factors";

const formatPercent = (v: number) => `${(v * 100).toFixed(1)}%`;

import type { YearKey, SeriesByYear } from "../../lib/finance/factors";

export default function KpiYearTable({ dealId, yearCount, currency }: { 
  dealId: string; 
  yearCount: number; 
  currency: string; 
}) {
  const exitYearIndex = selectExitYearIndex(dealId);
  
  // Use consistent year range
  const allYears: YearKey[] = ["y0","y1","y2","y3","y4","y5","y6","y7","y8","y9","y10"];
  const years = yearsThrough(allYears, exitYearIndex);

  const adrS = selectAdrByYear(dealId);
  const occS = selectOccByYear(dealId);
  const revParS = selectRevParByYear(dealId);

  // rates (per year)
  const growthRateByYear     = selectToplineGrowthRateByYear(dealId);
  const inflationRateByYear  = selectInflationRateByYear(dealId);
  
  // indices (100 = base → 1.00 internally)
  const toplineIndex   = buildIndexFromRates(growthRateByYear,   years, 1, 1); // growth only (no inflation on topline)
  const inflationIndex = buildIndexFromRates(inflationRateByYear, years, 1, 1);
  
  const rampCost = selectCostRampByYear(dealId);
  const rampTop  = selectToplineRampByYear(dealId);

  const fmtMoney = (v?: number) => (v == null ? "—" : formatCurrency(v, currency));
  const fmtPct = (v?: number) => (v == null ? "—" : `${v.toFixed(1)}%`);
  const fmtIdx = (v?: number) => (v == null ? "—" : Math.round((v ?? 0) * 100).toString());

  // Debug log for Y3/Y4 growth verification (temporary)
  if (process.env.NODE_ENV !== "production") {
    const i3 = toplineIndex.y3, i4 = toplineIndex.y4;
    const adr3 = adrS.y3, adr4 = adrS.y4;
    console.debug("[RoomsKPIs] Y3->Y4 growth check:", { i3, i4, adr3, adr4, diff: adr4 - adr3 });
  }

  return (
    <Card className="mt-6 border bg-muted/20">
      <div className="p-4">
        <div className="text-sm font-semibold mb-3">Key KPIs — All Years</div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left py-2 pr-3">KPI</th>
                {years.map((y) => (
                  <th key={y} className="text-right py-2 px-3 whitespace-nowrap">
                    {`Year ${Number(y.slice(1))}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="py-2 pr-3 font-medium">ADR</td>
                {years.map((y) => (
                  <td key={`adr-${y}`} className="text-right py-2 px-3">
                    {fmtMoney(adrS[y])}
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="py-2 pr-3 font-medium">Occupancy</td>
                {years.map((y) => (
                  <td key={`occ-${y}`} className="text-right py-2 px-3">
                    {formatOccupancyPercent(occS[y] || 0)}
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="py-2 pr-3 font-medium">RevPAR</td>
                {years.map((y) => (
                  <td key={`revpar-${y}`} className="text-right py-2 px-3">
                    {fmtMoney(revParS[y])}
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="py-2 pr-3 font-medium">Inflation Index (100 = base)</td>
                {years.map((y) => (
                  <td key={`inflation-${y}`} className="text-right py-2 px-3">
                    {fmtIdx(inflationIndex[y])}
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="py-2 pr-3 font-medium">Topline Index (100 = base)</td>
                {years.map((y) => (
                  <td key={`topline-${y}`} className="text-right py-2 px-3">
                    {fmtIdx(toplineIndex[y])}
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="py-2 pr-3 font-medium">Ramp-up Factor (Costs)</td>
                {years.map((y) => (
                  <td key={`ramp-cost-${y}`} className="text-right py-2 px-3">
                    {(rampCost[y] ?? 1).toFixed(2)}×
                  </td>
                 ))}
              </tr>
              <tr className="border-t">
                <td className="py-2 pr-3 font-medium">Ramp-up Factor (Topline)</td>
                {years.map((y) => (
                  <td key={`ramp-topline-${y}`} className="text-right py-2 px-3">
                    {(rampTop[y] ?? 1).toFixed(2)}×
                  </td>
                 ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Year 0 is pre-operating; ADR/Occupancy/RevPAR are 0 by design. Topline Index shows growth only (no inflation on prices). 
          Inflation Index applies to costs only. Columns stop at the selected Exit Year.
        </p>
      </div>
    </Card>
  );
}