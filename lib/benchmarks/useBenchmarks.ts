import { useMemo } from "react";
import { Benchmarks } from "../data/benchmarks";
import type { CountryBenchmarks, Level } from "../types/benchmarks";

export function useBenchmarks(countryCode?: string) {
  const normalized = (countryCode || "").toUpperCase();
  const data: CountryBenchmarks | null = useMemo(
    () => (normalized ? Benchmarks.get(normalized) : null),
    [normalized]
  );

  return {
    data,
    getSalary(role: string, level: Level = "market"): number | null {
      if (!data) return null;
      const row = data.salaries.find(s => s.role === role);
      return row ? row.annualBaseEUR[level] : null;
    },
    getUsali(category: string, level: Level = "market"): number | null {
      if (!data) return null;
      const row = data.usali.find(u => u.category === category);
      return row ? row.percentOfRevenue[level] : null;
    },
    getCapex(item: string, level: Level = "market"): { value: number; basis: "per_key" | "per_sqm" } | null {
      if (!data) return null;
      const row = data.capex.find(c => c.item === item);
      return row ? { value: row.amount[level], basis: row.basis } : null;
    },
  };
}