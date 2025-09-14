export const THRESHOLDS = {
  yieldOnCost: { good: 0.10, ok: 0.07 },       // ≥good green; ≥ok amber; else red
  gopPct: { low: 0.20, high: 0.55 },           // <low red; >high amber("unrealistic")
  fbMarginPct: { red: 0.00, amber: 0.10 },     // ≤red red; <amber amber; else green
  wellnessMarginPct: { red: 0.00, amber: 0.10 },
  roomsMarginPct: { low: 0.60 }                // <low red; typical range 60-85%
};

export type ThresholdStatus = 'good' | 'ok' | 'weak' | 'unrealistic';

export function assessYieldOnCost(yoc: number): ThresholdStatus {
  if (yoc >= THRESHOLDS.yieldOnCost.good) return 'good';
  if (yoc >= THRESHOLDS.yieldOnCost.ok) return 'ok';
  return 'weak';
}

export function assessGOPPercent(gopPct: number): ThresholdStatus {
  if (gopPct < THRESHOLDS.gopPct.low) return 'weak';
  if (gopPct > THRESHOLDS.gopPct.high) return 'unrealistic';
  return 'good';
}

export function assessDepartmentMargin(marginPct: number, type: 'fb' | 'wellness' | 'rooms'): ThresholdStatus {
  switch (type) {
    case 'fb':
      if (marginPct <= THRESHOLDS.fbMarginPct.red) return 'weak';
      if (marginPct < THRESHOLDS.fbMarginPct.amber) return 'ok';
      return 'good';
    case 'wellness':
      if (marginPct <= THRESHOLDS.wellnessMarginPct.red) return 'weak';
      if (marginPct < THRESHOLDS.wellnessMarginPct.amber) return 'ok';
      return 'good';
    case 'rooms':
      if (marginPct < THRESHOLDS.roomsMarginPct.low) return 'weak';
      return 'good';
    default:
      return 'ok';
  }
}

export function getStatusColor(status: ThresholdStatus): string {
  switch (status) {
    case 'good': return 'text-green-600 bg-green-50 border-green-200';
    case 'ok': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'weak': return 'text-red-600 bg-red-50 border-red-200';
    case 'unrealistic': return 'text-orange-600 bg-orange-50 border-orange-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

export function getStatusIcon(status: ThresholdStatus): string {
  switch (status) {
    case 'good': return '✅';
    case 'ok': return '⚠️';
    case 'weak': return '⛔';
    case 'unrealistic': return '🔶';
    default: return '❓';
  }
}

export function getStatusLabel(status: ThresholdStatus): string {
  switch (status) {
    case 'good': return 'Good';
    case 'ok': return 'OK';
    case 'weak': return 'Weak';
    case 'unrealistic': return 'Unrealistic';
    default: return 'Unknown';
  }
}