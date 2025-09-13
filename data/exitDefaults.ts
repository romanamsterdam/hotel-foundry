import { ExitSettings } from '../types/exitStrategy';

export function createDefaultExitSettings(): ExitSettings {
  return {
    strategy: "SALE",
    sale: {
      exitYear: 5,
      exitCapRate: 6.5,
      sellingCostsPct: 3
    },
    refinance: {
      refinanceYear: 5,
      ltvAtRefinance: 70,
      refinanceCostsPct: 2
    },
    estimatedReturns: {
      irrLevered: 15.0,      // Dummy placeholder
      irrUnlevered: 12.0,    // Dummy placeholder
      developmentProfit: 2300000  // Dummy placeholder €2.3M
    }
  };
}

export const exitYearPresets = [3, 5, 7, 10];
export const capRatePresets = [5.5, 6.0, 6.5, 7.0, 7.5];
export const ltvPresets = [50, 60, 70, 80];