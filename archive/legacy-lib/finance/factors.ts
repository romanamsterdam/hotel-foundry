// src/lib/finance/factors.ts
export type YearKey = `y${number}`;
export type SeriesByYear = Record<YearKey, number>;

/** returns sorted ["y0","y1",...,"yN"] from any series-like object */
export const sortYearKeys = (obj: Record<string, unknown>): YearKey[] =>
  (Object.keys(obj) as YearKey[]).sort((a,b)=>Number(a.slice(1))-Number(b.slice(1)));

/** Filter years 0..exitYearIndex (inclusive). */
export function yearsThrough(years: YearKey[], exitYearIndex: number): YearKey[] {
  return years.filter(y => Number(y.slice(1)) <= exitYearIndex);
}

/** Build a 100-based index from YoY rates (e.g., 0.03 = 3%). Y0 = 1.00 (i.e., 100). */
export function buildIndexFromRates(
  rates: Partial<SeriesByYear>,
  years: YearKey[],
  base = 1
): SeriesByYear {
  const out: Partial<SeriesByYear> = {};
  let acc = base;
  years.forEach((y, i) => {
    if (i === 0) { out[y] = base; return; }
    const r = rates?.[y] ?? rates?.[`y${i}` as YearKey] ?? rates?.y1 ?? 0; // robust fallback
    acc = acc * (1 + (r ?? 0));
    out[y] = acc;
  });
  return out as SeriesByYear;
}