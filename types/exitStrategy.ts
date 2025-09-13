export type ExitStrategy = "HOLD_FOREVER" | "SALE" | "REFINANCE";

export type ExitSettings = {
  strategy: ExitStrategy;
  
  // Sale-specific settings
  sale: {
    exitYear: number;           // 3, 5, 7, 10, or custom
    exitCapRate: number;        // % (e.g., 6.5)
    sellingCostsPct: number;    // % of sale price (default 3)
  };
  
  // Refinance-specific settings
  refinance: {
    refinanceYear: number;      // year to refinance
    ltvAtRefinance: number;     // % debt at refinance
    refinanceCostsPct: number;  // % fees
  };
  
  // Calculated outputs (dummy for now)
  estimatedReturns: {
    irrLevered: number;         // %
    irrUnlevered: number;       // %
    developmentProfit: number;  // €
  };
};