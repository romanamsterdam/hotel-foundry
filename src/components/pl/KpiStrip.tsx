import { Info } from "lucide-react";
import { Card } from "../ui/card";
import { formatCurrency } from "../../lib/utils";
import { selectKpisForYear } from "../../lib/finance/kpis";

type Props = { 
  dealId: string; 
  yearIndex: number;
  currency: string;
};

const KpiItem = ({ 
  label, 
  value, 
  hint 
}: { 
  label: string; 
  value: string; 
  hint?: string; 
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {hint && (
        <div className="group relative">
          <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            {hint}
          </div>
        </div>
      )}
    </div>
    <div className="text-sm font-semibold text-slate-900 tabular-nums">{value}</div>
  </div>
);

const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

const formatMultiplier = (value: number): string => {
  return `${value.toFixed(2)}×`;
};

export default function KpiStrip({ dealId, yearIndex, currency }: Props) {
  const { adr, occ, revpar, inflation, rampCosts, rampTopline, toplineGrowth } =
    selectKpisForYear(dealId, yearIndex);

  return (
    <Card className="border-slate-200 bg-slate-50/50">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          Key KPIs - Year {yearIndex}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <KpiItem 
            label="ADR" 
            value={formatCurrency(adr, currency)} 
            hint="Average daily rate for this year" 
          />
          <KpiItem 
            label="Occupancy" 
            value={formatPercent(occ / 100)} 
            hint="Percentage of rooms occupied" 
          />
          <KpiItem 
            label="RevPAR" 
            value={formatCurrency(revpar, currency)} 
            hint="Revenue per available room (ADR × Occupancy)" 
          />
          <KpiItem 
            label="Inflation Factor" 
            value={formatPercent(inflation)} 
            hint="Annual inflation rate applied to costs" 
          />
          <KpiItem 
            label="Ramp-up Factor (Costs)" 
            value={formatMultiplier(rampCosts)} 
            hint="Cost multiplier vs steady state (>1.0 = premium)" 
          />
          <KpiItem 
            label="Ramp-up Factor (Topline)" 
            value={formatMultiplier(rampTopline)} 
            hint="Revenue multiplier vs steady state (<1.0 = ramp-up)" 
          />
          <KpiItem 
            label="Topline Growth Factor" 
            value={formatPercent(toplineGrowth)} 
            hint="Year-over-year revenue growth rate" 
          />
        </div>
      </div>
    </Card>
  );
}