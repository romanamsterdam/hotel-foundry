export const THRESHOLDS = {
  // Yield on Cost (EBITDA / Total Investment)
  yoc: {
    good: 0.10,    // ≥10% green
    ok: 0.07,      // 7-10% amber
    // <7% red
  },
  
  // GOP Percentage (GOP / Total Revenue)
  gop: {
    low: 0.20,     // <20% red (too tight)
    high: 0.55,    // >55% amber (may be optimistic)
    // 20-55% green (typical range)
  },
  
  // IRR Bands
  irr: {
    excellent: 0.18,  // ≥18% excellent
    good: 0.12,       // 12-18% good
    ok: 0.08,         // 8-12% ok
    // <8% weak
  },
  
  // Equity Multiple
  multiple: {
    excellent: 2.5,   // ≥2.5x excellent
    good: 2.0,        // 2.0-2.5x good
    ok: 1.5,          // 1.5-2.0x ok
    // <1.5x weak
  },
  
  // DSCR (Debt Service Coverage Ratio)
  dscr: {
    good: 1.35,       // ≥1.35 green
    ok: 1.20,         // 1.20-1.35 amber
    // <1.20 red
  },
  
  // F&B Margin
  fnbMargin: {
    good: 0.15,       // ≥15% good
    ok: 0.10,         // 10-15% ok
    // <10% weak
  },
  
  // Contingency
  contingency: {
    low: 0.05,        // <5% amber (low buffer)
    high: 0.15,       // >15% amber (may be excessive)
    // 5-15% green
  },
  
  // Staffing Gap
  staffingGap: {
    critical: 0.5,    // ≥0.5 FTE short = red
    warning: 0.2,     // 0.2-0.5 FTE short = amber
    overstaffed: -0.3, // ≤-0.3 FTE excess = amber
    // -0.3 to 0.2 = green
  }
} as const;

export type ThresholdStatus = 'excellent' | 'good' | 'ok' | 'weak' | 'critical';

export function assessYoC(yoc: number): ThresholdStatus {
  if (yoc >= THRESHOLDS.yoc.good) return 'good';
  if (yoc >= THRESHOLDS.yoc.ok) return 'ok';
  return 'weak';
}

export function assessGOP(gopPct: number): ThresholdStatus {
  if (gopPct < THRESHOLDS.gop.low) return 'weak';
  if (gopPct > THRESHOLDS.gop.high) return 'ok'; // optimistic
  return 'good';
}

export function assessIRR(irr: number): ThresholdStatus {
  if (irr >= THRESHOLDS.irr.excellent) return 'excellent';
  if (irr >= THRESHOLDS.irr.good) return 'good';
  if (irr >= THRESHOLDS.irr.ok) return 'ok';
  return 'weak';
}

export function assessMultiple(multiple: number): ThresholdStatus {
  if (multiple >= THRESHOLDS.multiple.excellent) return 'excellent';
  if (multiple >= THRESHOLDS.multiple.good) return 'good';
  if (multiple >= THRESHOLDS.multiple.ok) return 'ok';
  return 'weak';
}

export function assessDSCR(dscr: number): ThresholdStatus {
  if (dscr >= THRESHOLDS.dscr.good) return 'good';
  if (dscr >= THRESHOLDS.dscr.ok) return 'ok';
  return 'weak';
}

export function getStatusColor(status: ThresholdStatus): string {
  switch (status) {
    case 'excellent': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'good': return 'text-green-600 bg-green-50 border-green-200';
    case 'ok': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'weak': return 'text-red-600 bg-red-50 border-red-200';
    case 'critical': return 'text-red-700 bg-red-100 border-red-300';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

export function getStatusIcon(status: ThresholdStatus): string {
  switch (status) {
    case 'excellent': return '🌟';
    case 'good': return '✅';
    case 'ok': return '⚠️';
    case 'weak': return '⛔';
    case 'critical': return '🚨';
    default: return '❓';
  }
}