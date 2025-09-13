export type RampCurve = [number, number, number, number]; // Y1..Y4 as decimals, e.g. [0.8,0.9,1,1]

export type RampSettings = {
  // Revenue ramp applies to all topline streams (Rooms, F&B, Other)
  revenueRamp: RampCurve;          // default Standard: [0.8, 0.9, 1, 1]
  // Cost ramp is a premium multiplier vs stabilized ( >1 in Y1/Y2 ), applied to Opex groups
  costRamp: RampCurve;             // default Standard: [1.10, 1.05, 1.0, 1.0]

  // Which cost groups receive the cost ramp (all checked by default)
  applyCostRamp: {
    departmental: boolean;         // Rooms/F&B/Other direct costs (COGS, commissions, etc.)
    undistributed: boolean;        // A&G, S&M, Maintenance, Utilities, Tech, etc.
    otherOpex: boolean;            // Mgmt fees, insurance, taxes
    payroll: boolean;              // apply premium to payroll totals (default true)
    exclude: Array<"depreciation"|"interest"|"capex"|"rent">; // always excluded from ramp
  };

  // Macro settings (apply from stabilized year onward)
  toplineGrowthPct: number;        // annual % for revenues after stabilization (default 3)
  inflationPct: number;            // annual % for operating costs and payroll after stabilization (default 2)

  // Depreciation (annual)
  depreciationPctOfCapex: number;  // default 3 (% of Grand Total excl. VAT)
};