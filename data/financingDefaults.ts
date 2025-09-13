import { FinancingSettings } from '../types/financing';

export function createDefaultFinancingSettings(): FinancingSettings {
  return {
    ltcPct: 40,
    investmentOrder: "EQUITY_FIRST",
    interestRatePct: 5.5,
    loanTermYears: 20,
    amortYears: 25,
    ioPeriodYears: 0,
    taxRateOnEBT: 25,
    loanAmount: 0,
    equityRequired: 0
  };
}

export const ltcPresets = [0, 20, 30, 40, 50, 60, 70];
export const interestRatePresets = [4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5];
export const loanTermPresets = [15, 20, 25, 30];