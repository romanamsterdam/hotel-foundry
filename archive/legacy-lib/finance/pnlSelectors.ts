export type PnlTotalsByYear = Record<string, number>;

import { getDeal } from '../dealStore';
import { calculatePLData } from '../pl/plCalculations';

export function selectRevenueByYear(dealId: string): PnlTotalsByYear {
  const deal = getDeal(dealId);
  if (!deal) return {};

  // Get P&L data using the same calculation as P&L page
  const plRows = calculatePLData(dealId, 10);
  const totalRevenueRow = plRows.find(row => row.id === 'total-revenue');
  
  if (!totalRevenueRow) return {};

  // Convert to year-based object
  const result: PnlTotalsByYear = {};
  totalRevenueRow.years.forEach((yearData, index) => {
    result[`y${yearData.year}`] = yearData.total;
  });

  return result;
}

export function selectEbitdaByYear(dealId: string): PnlTotalsByYear {
  const deal = getDeal(dealId);
  if (!deal) return {};

  // Get P&L data using the same calculation as P&L page
  const plRows = calculatePLData(dealId, 10);
  const ebitdaRow = plRows.find(row => row.id === 'ebitda');
  
  if (!ebitdaRow) return {};

  // Convert to year-based object
  const result: PnlTotalsByYear = {};
  ebitdaRow.years.forEach((yearData, index) => {
    result[`y${yearData.year}`] = yearData.total;
  });

  return result;
}

export function getYearsFromPnl(dealId: string): string[] {
  const revenueByYear = selectRevenueByYear(dealId);
  return Object.keys(revenueByYear).sort((a, b) => {
    const yearA = parseInt(a.substring(1));
    const yearB = parseInt(b.substring(1));
    return yearA - yearB;
  });
}