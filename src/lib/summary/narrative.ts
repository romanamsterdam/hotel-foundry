export function shortExec(dealName: string, irr: number, multiple: number, yocY4?: number) {
  const yocText = yocY4 != null ? ` and a Year-4 Yield-on-Cost around ${(yocY4*100).toFixed(0)}%` : "";
  return `${dealName} targets an equity IRR around ${(irr*100).toFixed(0)}% with a ${multiple.toFixed(1)}x multiple${yocText}. The plan assumes a steady ramp in occupancy and price while keeping operating costs in line with typical boutique hotels.`;
}

export function occAdrDigest(occY3: number, adrY3: number, revparY3: number) {
  return `By Year 3, we expect ~${Math.round(occY3)}% occupancy and ~€${Math.round(adrY3)} ADR (RevPAR ~€${Math.round(revparY3)}).`;
}

export function gopBand(gopPct: number) {
  const band = gopPct >= 0.55 ? "high (may be optimistic)" : gopPct < 0.20 ? "low (tight profitability)" : "within typical range";
  return `GOP margin ~${(gopPct*100).toFixed(0)}% — ${band}.`;
}

export function fnbDigest(fnbRevenue: number, fnbMargin: number, currency: string) {
  const marginText = fnbMargin <= 0 ? "breaking even" : fnbMargin < 0.10 ? "with thin margins" : "with healthy margins";
  return `F&B contributes €${Math.round(fnbRevenue/1000)}k annually ${marginText} (~${(fnbMargin*100).toFixed(0)}%).`;
}

export function staffingDigest(providedFTE: number, requiredFTE: number, topGaps: Array<{role: string; gap: number}>) {
  const gapTotal = requiredFTE - providedFTE;
  const gapText = gapTotal > 0.5 ? `${gapTotal.toFixed(1)} FTE short` : 
                  gapTotal < -0.5 ? `${Math.abs(gapTotal).toFixed(1)} FTE over` : "roughly balanced";
  
  const topGapText = topGaps.length > 0 ? 
    ` Biggest gaps: ${topGaps.slice(0, 2).map(g => `${g.role} (+${g.gap.toFixed(1)})`).join(', ')}.` : "";
  
  return `Staffing is ${gapText} (${providedFTE.toFixed(1)} provided vs ${requiredFTE.toFixed(1)} required).${topGapText}`;
}

export function riskNarrative(risks: Array<{type: string; severity: 'red' | 'amber' | 'green'; message: string}>) {
  const redRisks = risks.filter(r => r.severity === 'red').length;
  const amberRisks = risks.filter(r => r.severity === 'amber').length;
  
  if (redRisks > 0) {
    return `${redRisks} critical risk${redRisks === 1 ? '' : 's'} identified requiring immediate attention.`;
  } else if (amberRisks > 0) {
    return `${amberRisks} moderate risk${amberRisks === 1 ? '' : 's'} to monitor and mitigate.`;
  } else {
    return "Risk profile appears manageable with standard hotel operating practices.";
  }
}