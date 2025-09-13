export type YearKey = `y${number}`;
export type SeriesByYear = Record<YearKey, number>;

export const sortYearKeys = (obj: Record<string, unknown>): YearKey[] =>
  (Object.keys(obj) as YearKey[]).sort((a,b)=>Number(a.slice(1)) - Number(b.slice(1)));

export function deriveYears(deal: any): YearKey[] {
  // Default to Y0-Y10 for consistency
  return ["y0","y1","y2","y3","y4","y5","y6","y7","y8","y9","y10"] as YearKey[];
}

/** Ensure y0 is 0 and keep y1..yN as is. */
export function clampPreOpToZero(series: SeriesByYear): SeriesByYear {
  if (!series) return {} as SeriesByYear;
  return { ...series, y0: 0 as number };
}