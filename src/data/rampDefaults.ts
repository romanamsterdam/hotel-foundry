import { RampSettings, RampCurve } from '../types/ramp';

export const revenueRampPresets = {
  conservative: [0.70, 0.80, 0.90, 1.00] as RampCurve,
  standard: [0.80, 0.90, 1.00, 1.00] as RampCurve,
  ambitious: [0.85, 1.00, 1.00, 1.00] as RampCurve
};

export const costRampPresets = {
  conservative: [1.15, 1.10, 1.00, 1.00] as RampCurve,
  standard: [1.10, 1.05, 1.00, 1.00] as RampCurve,
  ambitious: [1.08, 1.02, 1.00, 1.00] as RampCurve
};

export const revenueRampLabels = {
  conservative: "Conservative",
  standard: "Standard",
  ambitious: "Ambitious"
};

export const costRampLabels = {
  conservative: "Conservative",
  standard: "Standard", 
  ambitious: "Ambitious"
};

export function createDefaultRampSettings(): RampSettings {
  return {
    revenueRamp: revenueRampPresets.standard,
    costRamp: costRampPresets.standard,
    applyCostRamp: {
      departmental: true,
      undistributed: true,
      otherOpex: true,
      payroll: true,
      exclude: ["depreciation", "interest", "capex", "rent"]
    },
    toplineGrowthPct: 3,
    inflationPct: 2,
    depreciationPctOfCapex: 3
  };
}