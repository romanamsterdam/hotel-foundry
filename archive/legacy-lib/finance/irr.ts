// Safe IRR calculation that handles edge cases
export function safeIrr(cashflows: number[], guess = 0.1): number | null {
  const hasPos = cashflows.some(v => v > 0);
  const hasNeg = cashflows.some(v => v < 0);
  if (!hasPos || !hasNeg) return null; // IRR undefined without at least one sign change

  let r = guess;
  for (let i = 0; i < 1000; i++) {
    let npv = 0, d = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const cf = cashflows[t];
      const denom = Math.pow(1 + r, t);
      npv += cf / denom;
      d -= (t * cf) / (denom * (1 + r));
    }
    if (!isFinite(npv) || !isFinite(d) || d === 0) return null;
    const rNext = r - npv / d;
    if (!isFinite(rNext)) return null;
    if (Math.abs(rNext - r) < 1e-8) return rNext;
    r = rNext;
  }
  return null; // did not converge
}

export function calculateIRR(cashFlows: number[], guess: number = 0.1, maxIterations: number = 100, tolerance: number = 1e-6): number {
  const result = safeIrr(cashFlows, guess);
  return result ?? 0; // Fallback for backward compatibility
}

export function formatIRR(irr: number | null): string {
  if (irr === null || isNaN(irr) || !isFinite(irr)) return 'N/A';
  return `${(irr * 100).toFixed(1)}%`;
}

export function calculateEquityIRR(
  equityInvestment: number,
  annualCashFlows: number[],
  netSaleProceeds: number,
  exitYear: number
): number {
  const cashFlows = [-equityInvestment]; // Year 0: negative equity investment
  
  // Add annual cash flows up to exit year
  for (let year = 1; year <= exitYear; year++) {
    const annualCF = annualCashFlows[year - 1] || 0;
    if (year === exitYear) {
      cashFlows.push(annualCF + netSaleProceeds);
    } else {
      cashFlows.push(annualCF);
    }
  }
  
  const result = safeIrr(cashFlows);
  return result ?? 0; // Fallback for backward compatibility
}