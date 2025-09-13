import React from 'react';
import { useActiveDeal } from '../lib/deals/useActiveDeal';
import DealGuard from '../components/common/DealGuard';
import ShareBar from '../components/common/ShareBar';
import ExecSummaryCard from '../components/summary/ExecSummaryCard';
import DealSnapshot from '../components/summary/DealSnapshot';
import ReturnsOverview from '../components/summary/ReturnsOverview';
import SourcesUsesBlock from '../components/summary/SourcesUsesBlock';
import OperatingPlanDigest from '../components/summary/OperatingPlanDigest';
import StaffingDigest from '../components/summary/StaffingDigest';
import RisksMitigations from '../components/summary/RisksMitigations';
import UpsideLevers from '../components/summary/UpsideLevers';
import SensitivityMini from '../components/summary/SensitivityMini';
import ExitPlanCard from '../components/summary/ExitPlanCard';
import ChecklistNextActions from '../components/summary/ChecklistNextActions';
import { usePLData } from '../hooks/usePLData';
import { buildCashFlowStatement } from '../lib/finance/cashflow';
import { calculateRequiredStaffing, createDefaultAssumptions } from '../lib/staffing/model';
import { totalRooms } from '../lib/rooms';
import { computeProjectIrrs } from '../lib/finance/cashflow';

export default function UnderwritingSummaryPage() {
  const { dealId, deal, status } = useActiveDeal();

  if (status !== "ready") return <DealGuard status={status} />;

  const { allRows, exitYear } = usePLData(dealId);
  const cashFlowResult = buildCashFlowStatement(dealId!);
  
  const horizon = exitYear || 10;
  const rooms = totalRooms(deal.roomTypes);

  // Extract key data from P&L and Cash Flow
  const getRowValues = (rowId: string) => {
    const row = allRows.find(r => r.id === rowId);
    return row?.years.map(y => y.total) || Array(10).fill(0);
  };

  const totalRevenueByYear = getRowValues('total-revenue');
  const ebitdaByYear = getRowValues('ebitda');
  const gopByYear = getRowValues('goi');
  const occupancyByYear = getRowValues('occupancy');
  const adrByYear = getRowValues('adr');
  const revparByYear = getRowValues('revpar');
  const fnbRevenueByYear = getRowValues('fnb-revenue');

  // Cash flow data
  const leveredCFRow = cashFlowResult.rows.find(r => r.id === 'levered-cf');
  const unleveredCFRow = cashFlowResult.rows.find(r => r.id === 'unlevered-cf');
  const saleProceedsRow = cashFlowResult.rows.find(r => r.id === 'sale-proceeds');
  
  const leveredCFByYear = leveredCFRow?.years.map(y => y.value) || Array(11).fill(0);
  const unleveredCFByYear = unleveredCFRow?.years.map(y => y.value) || Array(11).fill(0);
  const netSaleProceeds = saleProceedsRow?.years.find(y => y.year === horizon)?.value || 0;

  // Calculate key metrics
  const projectCost = deal.budget?.grandTotal || 0;
  const financingSettings = deal.assumptions?.financingSettings;
  const hasDebt = financingSettings && financingSettings.ltcPct > 0;
  
  const leveredCFSum = leveredCFByYear.slice(0, horizon + 1).reduce((sum, cf) => sum + cf, 0);
  const unleveredCFSum = unleveredCFByYear.slice(0, horizon + 1).reduce((sum, cf) => sum + cf, 0);
  
  // Use centralized IRR calculations
  const { unleveredIrr, leveredIrr } = computeProjectIrrs(dealId!);
  
  const equityInvestment = hasDebt ? projectCost * (1 - financingSettings!.ltcPct / 100) : projectCost;
  const equityMultiple = equityInvestment > 0 ? Math.abs(leveredCFSum) / equityInvestment : 0;
  
  // Year 3 and 4 metrics
  const occY3 = occupancyByYear[2] || 0;
  const adrY3 = adrByYear[2] || 0;
  const revparY3 = revparByYear[2] || 0;
  const gopPctY3 = totalRevenueByYear[2] > 0 ? (gopByYear[2] || 0) / totalRevenueByYear[2] : 0;
  const yocY4 = projectCost > 0 ? (ebitdaByYear[3] || 0) / projectCost : 0;
  
  const fnbRevenueY3 = fnbRevenueByYear[2] || 0;
  const fnbMarginY3 = 0.15; // Placeholder - would need F&B cost breakdown
  
  // Staffing analysis
  const staffingData = calculateRequiredStaffing(dealId!, 3, createDefaultAssumptions());
  const providedFTE = staffingData.reduce((sum, s) => sum + s.providedFTE, 0);
  const requiredFTE = staffingData.reduce((sum, s) => sum + s.requiredFTE, 0);
  const topGaps = staffingData
    .filter(s => s.gapFTE > 0)
    .sort((a, b) => b.gapFTE - a.gapFTE)
    .slice(0, 3)
    .map(s => ({ role: s.role, gap: s.gapFTE, dept: s.dept }));

  // Calculate DSCR for Year 3
  const ebitdaY3 = ebitdaByYear[2] || 0;
  const annualDebtService = hasDebt ? (cashFlowResult.kpis.levered10y - cashFlowResult.kpis.unlevered10y) / horizon : 0;
  const dscrY3 = annualDebtService > 0 ? ebitdaY3 / Math.abs(annualDebtService) : 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 max-w-6xl py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Underwriting Summary</h1>
            <p className="text-slate-600">
              Numbers shown for Years 1–{horizon}
              {exitYear && `, sale assumed end of Year ${exitYear}`}.
            </p>
          </div>
          <ShareBar title="Underwriting Summary" />
        </div>

        <div className="space-y-8">
          {/* 1. Executive Summary */}
          <ExecSummaryCard
            dealName={deal.name}
            irr={leveredIrr || 0}
            multiple={equityMultiple}
            yocY4={yocY4}
            isLevered={hasDebt || false}
          />

          {/* 2. Deal Snapshot */}
          <DealSnapshot
            deal={deal}
            revparByYear={revparByYear}
            ebitdaByYear={ebitdaByYear}
            leveredCFByYear={leveredCFByYear}
            exitYear={horizon}
            netSaleProceeds={netSaleProceeds}
          />

          {/* 3. Returns Overview */}
          <ReturnsOverview
            leveredIRR={leveredIrr || 0}
            unleveredIRR={unleveredIrr || 0}
            equityMultiple={equityMultiple}
            leveredCFSum={leveredCFSum}
            unleveredCFSum={unleveredCFSum}
            currency={deal.currency}
            hasDebt={hasDebt || false}
          />

          {/* 4. Sources & Uses */}
          <SourcesUsesBlock deal={deal} />

          {/* 5. Operating Plan Digest */}
          <OperatingPlanDigest
            occY3={occY3}
            adrY3={adrY3}
            revparY3={revparY3}
            gopPctY3={gopPctY3}
            fnbRevenueY3={fnbRevenueY3}
            fnbMarginY3={fnbMarginY3}
            currency={deal.currency}
          />

          {/* 6. Staffing Digest */}
          <StaffingDigest
            providedFTE={providedFTE}
            requiredFTE={requiredFTE}
            topGaps={topGaps}
          />

          {/* 7. Risks & Mitigations */}
          <RisksMitigations
            gopPct={gopPctY3}
            dscr={dscrY3}
            contingencyPct={deal.budget?.contingencyPct ? deal.budget.contingencyPct / 100 : 0.10}
            fnbMargin={fnbMarginY3}
            staffingGap={requiredFTE - providedFTE}
            exitCapRate={deal.assumptions?.exitSettings?.strategy === 'SALE' ? 
              deal.assumptions.exitSettings.sale.exitCapRate : 6.5}
          />

          {/* 8. Upside Levers */}
          <UpsideLevers
            roomsRevenue={getRowValues('rooms-revenue')[2] || 0}
            fnbRevenue={fnbRevenueY3}
            totalRevenue={totalRevenueByYear[2] || 0}
            currency={deal.currency}
            rooms={rooms}
          />

          {/* 9. Sensitivity Mini */}
          <SensitivityMini
            baselineIRR={leveredIrr || 0}
            deltaPercent={10}
          />

          {/* 10. Exit Plan */}
          <ExitPlanCard
            deal={deal}
            exitYear={horizon}
            impliedExitValue={netSaleProceeds + (deal.budget?.grandTotal || 0)}
            netSaleProceeds={netSaleProceeds}
          />

          {/* 11. Checklist & Next Actions */}
          <ChecklistNextActions
            dealId={dealId!}
            staffingGap={requiredFTE - providedFTE}
            contingencyPct={deal.budget?.contingencyPct ? deal.budget.contingencyPct / 100 : 0.10}
            gopPct={gopPctY3}
            dscr={dscrY3}
          />
        </div>
      </div>
    </div>
  );
}