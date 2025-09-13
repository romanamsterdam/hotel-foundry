import { selectRevenueByYear, selectEbitdaByYear } from './pnlSelectors';
import { getDeal } from '../dealStore';
import { safeIrr } from './irr';
import { buildDebtSchedule } from '../debt';
import { clampPreOpToZero, sortYearKeys, SeriesByYear, YearKey } from './series';
import { getTotalRooms } from '../rooms';

export type CashFlowRow = {
  id: string;
  label: string;
  section: 'memo' | 'unlevered' | 'levered';
  type: 'line' | 'subtotal' | 'total' | 'section';
  years: Array<{
    year: number;
    value: number;
  }>;
};

export type CashFlowKPIs = {
  unlevered10y: number;
  levered10y: number;
  tax10y: number;
  avgEbitdaMargin: number;
  unleveredIRR: number | null;
  leveredIRR: number | null;
};

export type CashFlowResult = {
  rows: CashFlowRow[];
  kpis: CashFlowKPIs;
  exitYear: number | null;
};

export function getYearsForDeal(dealId: string): YearKey[] {
  const ebitdaByYear = selectEbitdaByYear(dealId);
  const keys = Object.keys(ebitdaByYear) as YearKey[];
  // Sort them y0, y1, y2, etc.
  return keys.sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

/** + = inflow, - = outflow (UI can format negatives with parentheses) */
export function computeUnleveredCashflowByYear(dealId: string): {
  years: YearKey[];
  ebitda: SeriesByYear;
  cashTaxes: SeriesByYear;
  capex: SeriesByYear;
  netSaleProceeds: SeriesByYear;
  unleveredCF: SeriesByYear;
} {
  // Pull from P&L
  const rawRevenue = selectRevenueByYear(dealId);
  const rawEbitda = selectEbitdaByYear(dealId);
  
  // Enforce pre-op: y0 = 0 for operating series
  const revenue: SeriesByYear = clampPreOpToZero(rawRevenue);
  const ebitda: SeriesByYear = clampPreOpToZero(rawEbitda);
  
  const years: YearKey[] = sortYearKeys(revenue ?? rawEbitda);
  
  const deal = getDeal(dealId);
  if (!deal) {
    const emptyData = Object.fromEntries(years.map(y => [y, 0])) as SeriesByYear;
    return {
      years,
      ebitda: emptyData,
      cashTaxes: emptyData,
      capex: emptyData,
      netSaleProceeds: emptyData,
      unleveredCF: emptyData
    };
  }

  // Cash taxes (simplified for now)
  const financingSettings = deal.assumptions?.financingSettings;
  const taxRate = (financingSettings?.taxRateOnEBT || 25) / 100;
  const projectCost = deal.budget?.grandTotal || 0;
  
  // Get depreciation and interest for tax calculation
  const rampSettings = deal.assumptions?.rampSettings;
  const depreciationPct = rampSettings?.depreciationPctOfCapex || 3;
  const annualDepreciation = (depreciationPct / 100) * projectCost;
  
  let annualInterest = 0;
  if (financingSettings && projectCost > 0) {
    try {
      const debtSchedule = buildDebtSchedule(financingSettings, projectCost);
      annualInterest = debtSchedule.annualDebtService * 0.8; // Approximate interest portion
    } catch (error) {
      annualInterest = 0;
    }
  }

  const cashTaxes: SeriesByYear = clampPreOpToZero(Object.fromEntries(
    years.map(y => {
      const yearNum = Number(y.slice(1));
      if (yearNum === 0) return [y, 0];
      
      const ebitdaValue = ebitda[y] || 0;
      const ebt = ebitdaValue - annualDepreciation - annualInterest;
      const tax = Math.max(0, ebt * taxRate);
      return [y, -tax]; // Negative outflow
    })
  )) as SeriesByYear;

  // CapEx: negative outflow in year 0, others 0 unless specified
  const capex: SeriesByYear = Object.fromEntries(
    years.map(y => {
      const yearNum = Number(y.slice(1));
      if (yearNum === 0) return [y, -projectCost]; // Negative outflow
      return [y, 0];
    })
  ) as SeriesByYear;

  // Exit assumptions
  const exitSettings = deal.assumptions?.exitSettings;
  const exitYear = exitSettings?.strategy === 'SALE' ? exitSettings.sale.exitYear : 
                   exitSettings?.strategy === 'REFINANCE' ? exitSettings.refinance.refinanceYear : 
                   null;

  let netSaleProceeds: SeriesByYear = Object.fromEntries(years.map(y => [y, 0])) as SeriesByYear;
  
  if (exitYear && exitSettings?.strategy === 'SALE') {
    const exitKey = `y${exitYear}` as YearKey;
    if (years.includes(exitKey)) {
      const noiExit = ebitda[exitKey] || 0;
      const exitCapRate = exitSettings.sale.exitCapRate / 100;
      const sellingCostsPct = exitSettings.sale.sellingCostsPct / 100;
      
      if (noiExit > 0 && exitCapRate > 0) {
        const grossSalePrice = noiExit / exitCapRate;
        const sellingCosts = grossSalePrice * sellingCostsPct;
        const netProceeds = grossSalePrice - sellingCosts;
        netSaleProceeds[exitKey] = Math.max(0, netProceeds); // Positive inflow
      }
    }
  }

  // Unlevered CF = EBITDA + cash taxes + CapEx + Net Sale Proceeds
  // (cash taxes and capex are already negative, so we add them)
  const unleveredCF: SeriesByYear = Object.fromEntries(
    years.map(y => [y, (ebitda[y] || 0) + (cashTaxes[y] || 0) + (capex[y] || 0) + (netSaleProceeds[y] || 0)])
  ) as SeriesByYear;

  return { years, ebitda, cashTaxes, capex, netSaleProceeds, unleveredCF };
}

/** Equity CF = Unlevered CF + debt effects */
export function computeLeveredCashflowByYear(dealId: string): {
  years: YearKey[];
  leveredCF: SeriesByYear;
  debtDraw: SeriesByYear;
  interestExpense: SeriesByYear;
  principalRepayment: SeriesByYear;
} {
  const { years, unleveredCF } = computeUnleveredCashflowByYear(dealId);
  const deal = getDeal(dealId);
  
  if (!deal) {
    const emptyData = Object.fromEntries(years.map(y => [y, 0])) as SeriesByYear;
    return {
      years,
      leveredCF: emptyData,
      debtDraw: emptyData,
      interestExpense: emptyData,
      principalRepayment: emptyData
    };
  }

  const projectCost = deal.budget?.grandTotal || 0;
  const financingSettings = deal.assumptions?.financingSettings;
  const exitSettings = deal.assumptions?.exitSettings;
  const exitYear = exitSettings?.strategy === 'SALE' ? exitSettings.sale.exitYear : 
                   exitSettings?.strategy === 'REFINANCE' ? exitSettings.refinance.refinanceYear : 
                   null;

  let debtDraw: SeriesByYear = Object.fromEntries(years.map(y => [y, 0])) as SeriesByYear;
  let interestExpense: SeriesByYear = clampPreOpToZero(Object.fromEntries(years.map(y => [y, 0]))) as SeriesByYear;
  let principalRepayment: SeriesByYear = clampPreOpToZero(Object.fromEntries(years.map(y => [y, 0]))) as SeriesByYear;

  if (financingSettings && projectCost > 0) {
    try {
      const debtSchedule = buildDebtSchedule(financingSettings, projectCost);
      const loanAmount = projectCost * (financingSettings.ltcPct / 100);
      
      // Debt draw in year 0
      const y0Key = 'y0' as YearKey;
      if (years.includes(y0Key)) {
        debtDraw[y0Key] = loanAmount; // Positive inflow
      }
      
      // Annual debt service for operating years
      const annualInterest = debtSchedule.annualDebtService * 0.8; // Approximate interest portion
      const annualPrincipal = debtSchedule.annualDebtService * 0.2; // Approximate principal portion
      
      years.forEach(y => {
        const yearNum = Number(y.slice(1));
        if (yearNum > 0 && (!exitYear || yearNum <= exitYear)) {
          interestExpense[y] = -annualInterest; // Negative outflow
          principalRepayment[y] = -annualPrincipal; // Negative outflow
        }
      });

      // Debt payoff at exit (if any remaining balance)
      if (exitYear && debtSchedule.hasBalloon) {
        const exitKey = `y${exitYear}` as YearKey;
        if (years.includes(exitKey)) {
          principalRepayment[exitKey] = (principalRepayment[exitKey] || 0) - debtSchedule.balloonPayment;
        }
      }
    } catch (error) {
      // Keep all debt flows at 0 if calculation fails
    }
  }

  // Levered CF = Unlevered CF + debt effects
  const leveredCF: SeriesByYear = Object.fromEntries(
    years.map(y => [y, (unleveredCF[y] || 0) + (debtDraw[y] || 0) + (interestExpense[y] || 0) + (principalRepayment[y] || 0)])
  ) as SeriesByYear;

  return { years, leveredCF, debtDraw, interestExpense, principalRepayment };
}

export function computeProjectIrrs(dealId: string): {
  unleveredIrr: number | null;
  leveredIrr: number | null;
} {
  return computeProjectIrrsWithHorizon(dealId);
}

export function computeProjectIrrsWithHorizon(
  dealId: string,
  opts?: { throughYearIndex?: number }
): {
  unleveredIrr: number | null;
  leveredIrr: number | null;
} {
  const { years, unleveredCF } = computeUnleveredCashflowByYear(dealId);
  const { leveredCF } = computeLeveredCashflowByYear(dealId);

  // Apply horizon if specified
  const idx = opts?.throughYearIndex ?? years.length - 1;
  const horizonYears = years.slice(0, idx + 1);
  
  const unleveredCashflows = horizonYears.map(y => unleveredCF[y] || 0);
  const leveredCashflows = horizonYears.map(y => leveredCF[y] || 0);

  return {
    unleveredIrr: safeIrr(unleveredCashflows),
    leveredIrr: safeIrr(leveredCashflows)
  };
}

export function buildCashFlowStatement(dealId: string): CashFlowResult {
  const deal = getDeal(dealId);
  if (!deal) {
    return {
      rows: [],
      kpis: {
        unlevered10y: 0,
        levered10y: 0,
        tax10y: 0,
        avgEbitdaMargin: 0,
        unleveredIRR: null,
        leveredIRR: null
      },
      exitYear: null
    };
  }

  const { years, ebitda, cashTaxes, capex, netSaleProceeds, unleveredCF } = computeUnleveredCashflowByYear(dealId);
  const { leveredCF, debtDraw, interestExpense, principalRepayment } = computeLeveredCashflowByYear(dealId);
  const rawRevenueByYear = selectRevenueByYear(dealId);
  const revenueByYear = clampPreOpToZero(rawRevenueByYear);

  // Get exit year
  const exitSettings = deal.assumptions?.exitSettings;
  const exitYear = exitSettings?.strategy === 'SALE' ? exitSettings.sale.exitYear : 
                   exitSettings?.strategy === 'REFINANCE' ? exitSettings.refinance.refinanceYear : 
                   null;

  // Build rows
  const rows: CashFlowRow[] = [
    // Income Statement (Memo)
    {
      id: 'memo-section',
      label: 'INCOME STATEMENT (Memo)',
      section: 'memo',
      type: 'section',
      years: years.map(y => ({ year: Number(y.slice(1)), value: 0 }))
    },
    {
      id: 'total-revenue',
      label: 'Total Revenue',
      section: 'memo',
      type: 'line',
      years: years.map(y => ({ year: Number(y.slice(1)), value: revenueByYear[y] || 0 }))
    },
    {
      id: 'ebitda',
      label: 'EBITDA / NOI',
      section: 'memo',
      type: 'line',
      years: years.map(y => ({ year: Number(y.slice(1)), value: ebitda[y] || 0 }))
    },

    // Unlevered Cash Flow
    {
      id: 'unlevered-section',
      label: 'UNLEVERED CASH FLOW',
      section: 'unlevered',
      type: 'section',
      years: years.map(y => ({ year: Number(y.slice(1)), value: 0 }))
    },
    {
      id: 'ebitda-ucf',
      label: 'EBITDA / NOI',
      section: 'unlevered',
      type: 'line',
      years: years.map(y => ({ year: Number(y.slice(1)), value: ebitda[y] || 0 }))
    },
    {
      id: 'cash-taxes',
      label: 'Cash Taxes',
      section: 'unlevered',
      type: 'line',
      years: years.map(y => ({ year: Number(y.slice(1)), value: cashTaxes[y] || 0 }))
    },
    {
      id: 'capex',
      label: 'CapEx',
      section: 'unlevered',
      type: 'line',
      years: years.map(y => ({ year: Number(y.slice(1)), value: capex[y] || 0 }))
    },
    {
      id: 'net-sale-proceeds',
      label: 'Net Sale Proceeds',
      section: 'unlevered',
      type: 'line',
      years: years.map(y => ({ year: Number(y.slice(1)), value: netSaleProceeds[y] || 0 }))
    },
    {
      id: 'unlevered-cf',
      label: 'Unlevered Cash Flow',
      section: 'unlevered',
      type: 'total',
      years: years.map(y => ({ year: Number(y.slice(1)), value: unleveredCF[y] || 0 }))
    },

    // Levered Cash Flow
    {
      id: 'levered-section',
      label: 'LEVERED CASH FLOW',
      section: 'levered',
      type: 'section',
      years: years.map(y => ({ year: Number(y.slice(1)), value: 0 }))
    },
    {
      id: 'ucf-lcf',
      label: 'Unlevered Cash Flow',
      section: 'levered',
      type: 'line',
      years: years.map(y => ({ year: Number(y.slice(1)), value: unleveredCF[y] || 0 }))
    },
    {
      id: 'debt-draw',
      label: 'Debt Draw',
      section: 'levered',
      type: 'line',
      years: years.map(y => ({ year: Number(y.slice(1)), value: debtDraw[y] || 0 }))
    },
    {
      id: 'interest-expense',
      label: 'Interest Expense',
      section: 'levered',
      type: 'line',
      years: years.map(y => ({ year: Number(y.slice(1)), value: interestExpense[y] || 0 }))
    },
    {
      id: 'principal-repayment',
      label: 'Principal Repayment',
      section: 'levered',
      type: 'line',
      years: years.map(y => ({ year: Number(y.slice(1)), value: principalRepayment[y] || 0 }))
    },
    {
      id: 'levered-cf',
      label: 'Levered Cash Flow',
      section: 'levered',
      type: 'total',
      years: years.map(y => ({ year: Number(y.slice(1)), value: leveredCF[y] || 0 }))
    }
  ];

  // Calculate KPIs
  const { unleveredIrr, leveredIrr } = computeProjectIrrs(dealId);
  
  const unlevered10y = Object.values(unleveredCF).reduce((sum, cf) => sum + cf, 0);
  const levered10y = Object.values(leveredCF).reduce((sum, cf) => sum + cf, 0);
  const tax10y = Math.abs(Object.values(cashTaxes).reduce((sum, tax) => sum + tax, 0));
  
  const totalRevenue = Object.values(revenueByYear).reduce((sum, rev) => sum + rev, 0);
  const totalEbitda = Object.values(ebitda).reduce((sum, ebitda) => sum + ebitda, 0);
  const avgEbitdaMargin = totalRevenue > 0 ? totalEbitda / totalRevenue : 0;

  return {
    rows,
    kpis: {
      unlevered10y,
      levered10y,
      tax10y,
      avgEbitdaMargin,
      unleveredIRR: unleveredIrr,
      leveredIRR: leveredIrr
    },
    exitYear
  };
}