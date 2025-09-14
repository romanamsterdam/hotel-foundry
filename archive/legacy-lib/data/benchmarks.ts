import type { CountryBenchmarks, Level } from "../types/benchmarks";

const bmStore: Record<string, CountryBenchmarks> = {}; // keyed by countryCode

export const Benchmarks = {
  upsert(country: CountryBenchmarks) {
    bmStore[country.countryCode] = { ...country, updatedAt: new Date().toISOString() };
    return bmStore[country.countryCode];
  },
  get(countryCode: string) {
    return bmStore[countryCode] || null;
  },
  list() {
    return Object.values(bmStore);
  },
};