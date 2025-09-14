export type MultipliersOverview = {
  years: number[];              // [1..10]
  inflation: number[];          // Year0=1.00 then grow: y=1 => 1.00*(1+infl)^1, y=2 => ^2, etc.
  toplineGrowth: number[];      // Year0=1.00 then (1+growth)^y
  revenueRamp: number[];        // [y1..y4] ramp values as 0..1, beyond y4 use 1.00
  costRamp: number[];           // [y1..y4] cost premium (>1 in y1/y2), beyond y4 use 1.00
};

export function buildMultipliers(
  years: number,
  revenueRamp4: [number,number,number,number], // as decimals (0.8, 0.9, 1, 1)
  costRamp4: [number,number,number,number],    // as decimals (1.10,1.05,1,1)
  growthPct: number,                           // 0.03
  inflationPct: number                         // 0.02
): MultipliersOverview {
  const ys = Array.from({length: years}, (_,i)=>i+1);
  const rr = (i:number)=> i<=4 ? revenueRamp4[i-1] : 1.0;
  const cr = (i:number)=> i<=4 ? costRamp4[i-1] : 1.0;
  const infl = (i:number)=> Math.pow(1+inflationPct, i); // Year0=1.00
  const grow = (i:number)=> Math.pow(1+growthPct, i);    // Year0=1.00
  return {
    years: ys,
    inflation: ys.map(infl),
    toplineGrowth: ys.map(grow),
    revenueRamp: ys.map(rr),
    costRamp: ys.map(cr),
  };
}