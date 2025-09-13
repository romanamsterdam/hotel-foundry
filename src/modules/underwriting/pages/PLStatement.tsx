import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useActiveDeal } from "../../../lib/deals/useActiveDeal";
import DealGuard from "../../../components/common/DealGuard";
import { Scale, scaleSuffix } from "../../../lib/pl/format";
import { Toggle } from "../../../components/ui/toggle";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../../../components/ui/select";
import { usePLData } from "../../../hooks/usePLData";
import PLHeaderKPIs from "../../../components/pl/PLHeaderKPIs";
import { PLDataTable } from "../../../components/pl/PLDataTable";
import PLLegend from "../../../components/pl/PLLegend";
import KpiStrip from "../../../components/pl/KpiStrip";
import KpiYearTable from "../../../components/pl/KpiYearTable";

export default function PLStatement() {
  const { dealId, deal, status } = useActiveDeal();

  // UI State
  const [showRatios, setShowRatios] = useState<boolean>(true);
  const [scale, setScale] = useState<Scale>("full");
  const [selectedKpiYear, setSelectedKpiYear] = useState<number>(1);

  if (status !== "ready") return <DealGuard status={status} />;

  // Load P&L data
  const { allRows, kpiRows, operatingRows, exitYear } = usePLData(dealId);
  
  // Derive years count from data
  const yearsCount = allRows?.[0]?.years?.length ?? 10;
  const years = Array.from({ length: yearsCount }, (_, idx) => idx + 1);
  
  // Safety check
  if (!allRows?.length) {
    return <DealGuard status="notFound" />;
  }

  return (
    <div className="w-full max-w-[95vw] mx-auto space-y-6">
      {/* Header with Controls */}
      <div className="w-full rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">P&L Statement</h1>
            <p className="text-sm text-slate-600">USALI-compliant profit & loss with 10-year projections</p>
            <div className="mt-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 inline-block">
              Calculated • Read-only
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <Link to={`/underwriting/summary/${dealId}`}>
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4" />
                <span>View Summary</span>
              </Button>
            </Link>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Show ratios</span>
              <Toggle
                pressed={showRatios}
                onPressedChange={setShowRatios}
                className="data-[state=on]:bg-brand-600 data-[state=on]:text-white"
              >
                {showRatios ? "On" : "Off"}
              </Toggle>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Display</span>
              <Select value={scale} onValueChange={(v) => setScale(v as Scale)}>
                <SelectTrigger className="h-9 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="thousands">Thousands</SelectItem>
                  <SelectItem value="millions">Millions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Header Cards */}
      <PLHeaderKPIs 
        kpiRows={kpiRows}
        selectedYear={selectedKpiYear}
        onYearChange={setSelectedKpiYear}
        currency={deal.currency}
        exitYear={exitYear}
        dealId={dealId!}
      />

      {/* Exit Year Banner */}
      {exitYear && exitYear < 10 && (
        <div className="w-full rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center space-x-2">
            <span className="text-blue-800 font-medium text-sm">
              Exit in Year {exitYear}. Periods after sale are zeroed.
            </span>
          </div>
        </div>
      )}

      {/* P&L Data Table */}
      <PLDataTable 
        rows={operatingRows}
        showRatios={showRatios}
        scale={scale}
        currency={deal.currency}
        exitYear={exitYear}
      />

      {/* Legend */}
      <PLLegend showRatios={showRatios} />

      {/* Key KPIs by Year Table */}
      <KpiYearTable 
        dealId={dealId!}
        yearCount={yearsCount - 1}
        currency={deal.currency}
      />
    </div>
  );
}