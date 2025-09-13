import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useActiveDeal } from "../../../lib/deals/useActiveDeal";
import DealGuard from "../../../components/common/DealGuard";
import { buildCashFlowStatement } from "../../../lib/finance/cashflow";
import { Scale, scaleSuffix } from "../../../lib/pl/format";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../../../components/ui/select";
import CashflowHeaderKPIs from "../../../components/cf/CashflowHeaderKPIs";
import CashflowTable from "../../../components/cf/CashflowTable";

export default function CashFlowStatement() {
  const { dealId, deal, status } = useActiveDeal();
  
  const [scale, setScale] = useState<Scale>("full");

  if (status !== "ready") return <DealGuard status={status} />;

  const cashFlowResult = buildCashFlowStatement(dealId!);

  return (
    <div className="w-full max-w-[95vw] mx-auto space-y-6">
      {/* Header with Controls */}
      <div className="w-full rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Cash Flow Statement</h1>
            <p className="text-sm text-slate-600">Unlevered and levered cash flow projections with debt service analysis</p>
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
      <CashflowHeaderKPIs 
        dealId={dealId!}
        exitYear={cashFlowResult.exitYear}
        currency={deal.currency}
      />

      {/* Cash Flow Data Table */}
      <CashflowTable 
        rows={cashFlowResult.rows}
        currency={deal.currency}
        scale={scale}
        exitYear={cashFlowResult.exitYear}
      />

      {/* Footer Note */}
      <div className="w-full rounded-lg bg-slate-50 border border-slate-200 p-4">
        <div className="text-sm text-slate-600">
          <strong>Note:</strong> Cash flows are calculated from your P&L projections, financing structure, and exit assumptions. 
          {cashFlowResult.exitYear && (
            <span> Property disposal occurs at end of Year {cashFlowResult.exitYear}.</span>
          )}
        </div>
      </div>
    </div>
  );
}