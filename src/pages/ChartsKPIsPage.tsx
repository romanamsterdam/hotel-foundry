import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { TrendingUp, BarChart3, Target, ExternalLink } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useActiveDeal } from '../lib/deals/useActiveDeal';
import DealGuard from '../components/common/DealGuard';
import { usePLData } from '../hooks/usePLData';
import { buildCashFlowStatement } from '../lib/finance/cashflow';
import { Scale, scaleSuffix } from '../lib/pl/format';
import CapexCashflowExitWaterfall from '../components/charts/CapexCashflowExitWaterfall';
import OccAdrRevparYoY from '../components/charts/OccAdrRevparYoY';
import KPIYieldOnCostStrip from '../components/kpi/KPIYieldOnCostStrip';
import RatioFlagsTable from '../components/kpi/RatioFlagsTable';

export default function ChartsKPIsPage() {
  const { dealId, deal, status } = useActiveDeal();
  const [selectedYear, setSelectedYear] = useState<number>(3);
  const [scale, setScale] = useState<Scale>('full');

  if (status !== "ready") return <DealGuard status={status} />;

  const { allRows, exitYear } = usePLData(dealId);
  const cashFlowResult = dealId ? buildCashFlowStatement(dealId) : null;

  if (!allRows?.length) {
    return <DealGuard status="notFound" />;
  }

  const horizon = exitYear || 10;
  const totalInvestment = deal.budget?.grandTotal || 0;

  // Extract data arrays from P&L
  const getRowValues = (rowId: string) => {
    const row = allRows.find(r => r.id === rowId);
    return row?.years.map(y => y.total) || Array(10).fill(0);
  };

  const occupancyByYear = getRowValues('occupancy');
  const adrByYear = getRowValues('adr');
  const revparByYear = getRowValues('revpar');
  const ebitdaByYear = getRowValues('ebitda');
  const totalRevenueByYear = getRowValues('total-revenue');
  const goiByYear = getRowValues('goi');

  // Extract cash flow data
  const unleveredCFRow = cashFlowResult?.rows.find(r => r.id === 'unlevered-cf');
  const annualUnleveredCF = unleveredCFRow?.years.map(y => y.value) || Array(11).fill(0);
  
  const saleProceedsRow = cashFlowResult?.rows.find(r => r.id === 'sale-proceeds');
  const netSaleProceeds = saleProceedsRow?.years.find(y => y.year === horizon)?.value || 0;

  // Build ratio data for selected year
  const ratioData = React.useMemo(() => {
    const yearIdx = selectedYear - 1;
    
    // Get departmental cost breakdowns (simplified for now)
    const fbRevenue = getRowValues('fnb-revenue')[yearIdx] || 0;
    const fbCOGS = getRowValues('cost-of-goods-sold')[yearIdx] || 0;
    const fbDirectPayroll = getRowValues('fnb-direct-payroll')[yearIdx] || 0;
    const fbDirectCosts = getRowValues('fnb-direct-costs')[yearIdx] || 0;
    
    const wellnessRevenue = getRowValues('spa-revenue')[yearIdx] || 0;
    const wellnessDirectPayroll = getRowValues('wellness-direct-payroll')[yearIdx] || 0;
    const wellnessDirectCosts = getRowValues('wellness-direct-costs')[yearIdx] || 0;
    const wellnessOtherCosts = getRowValues('wellness-other-costs')[yearIdx] || 0;
    
    const roomsRevenue = getRowValues('rooms-revenue')[yearIdx] || 0;
    const roomsDirectPayroll = getRowValues('rooms-direct-payroll')[yearIdx] || 0;
    const roomsDirectCosts = getRowValues('rooms-direct-costs')[yearIdx] || 0;
    const roomsCommission = getRowValues('rooms-commission')[yearIdx] || 0;
    const guestSupplies = getRowValues('guest-supplies-cleaning')[yearIdx] || 0;
    
    return {
      fbRevenue,
      fbCOGS,
      fbDirectPayroll,
      fbDirectCosts,
      wellnessRevenue,
      wellnessDirectPayroll,
      wellnessDirectCosts,
      wellnessOtherCosts,
      roomsRevenue,
      roomsDirectPayroll,
      roomsDirectCosts,
      roomsCommission,
      guestSupplies,
      totalRevenue: totalRevenueByYear[yearIdx] || 0,
      goi: goiByYear[yearIdx] || 0
    };
  }, [selectedYear, allRows]);

  return (
    <div className="w-full max-w-[95vw] mx-auto space-y-6">
      {/* Header with Controls */}
      <div className="w-full rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Charts & Key KPIs</h1>
            <p className="text-sm text-slate-600">
              Investment analysis, performance trends, and operational ratio validation
            </p>
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
              <span className="text-sm text-slate-600">Analysis Year</span>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="h-9 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: Math.min(horizon, 10)}, (_, i) => i + 1).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      Year {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* KPI Strip - Investment & Yield on Cost */}
      <KPIYieldOnCostStrip
        totalInvestment={totalInvestment}
        ebitdaByYear={ebitdaByYear}
        exitYear={horizon}
        currency={deal.currency}
        scale={scale}
      />

      {/* Investment Waterfall */}
      <CapexCashflowExitWaterfall
        totalInvestment={totalInvestment}
        annualUnleveredCF={annualUnleveredCF.slice(1, horizon + 1)}
        netSaleProceeds={netSaleProceeds}
        exitYear={horizon}
        currency={deal.currency}
        scale={scale}
      />

      {/* YoY Growth Chart */}
      <OccAdrRevparYoY
        occupancyByYear={occupancyByYear}
        adrByYear={adrByYear}
        revparByYear={revparByYear}
        exitYear={horizon}
        currency={deal.currency}
      />

      {/* Ratio & Sanity Flags */}
      <RatioFlagsTable
        ratioData={ratioData}
        selectedYear={selectedYear}
        currency={deal.currency}
        scale={scale}
      />

      {/* Footer Note */}
      <div className="w-full rounded-lg bg-slate-50 border border-slate-200 p-4">
        <div className="text-sm text-slate-600">
          <strong>Note:</strong> Charts and KPIs are calculated from your P&L projections and cash flow analysis. 
          {exitYear && (
            <span> Analysis covers {exitYear}-year investment horizon with exit in Year {exitYear}.</span>
          )}
          {!exitYear && (
            <span> Analysis assumes 10-year hold period (no exit configured).</span>
          )}
        </div>
      </div>
    </div>
  );
}