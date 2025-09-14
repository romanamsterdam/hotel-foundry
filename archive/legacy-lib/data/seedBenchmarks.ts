import { Benchmarks } from "./benchmarks";
import type { CountryBenchmarks } from "../types/benchmarks";

export function seedBenchmarksIfEmpty() {
  if (Benchmarks.list().length > 0) return;

  const now = new Date().toISOString();

  const PT: CountryBenchmarks = {
    countryCode: "PT",
    currency: "EUR",
    salaries: [
      { role: "receptionist", annualBaseEUR: { low: 16000, market: 20000, high: 24000 } },
      { role: "fb_manager",   annualBaseEUR: { low: 26000, market: 32000, high: 38000 } },
      { role: "hotel_manager",annualBaseEUR: { low: 42000, market: 55000, high: 70000 } },
    ],
    usali: [
      { category: "rooms_commissions", percentOfRevenue: { low: 10, market: 12, high: 15 } },
      { category: "fb_cost_of_sales",  percentOfRevenue: { low: 28, market: 32, high: 36 } },
      { category: "utilities",         percentOfRevenue: { low: 3,  market: 4,  high: 5 } },
      { category: "admin_general",     percentOfRevenue: { low: 6,  market: 8,  high: 10 } },
    ],
    capex: [
      { item: "guestroom_refurb_per_key", currency: "EUR", basis: "per_key", amount: { low: 6000, market: 9000, high: 12000 } },
      { item: "spa_build_per_sqm",        currency: "EUR", basis: "per_sqm", amount: { low: 900,  market: 1300, high: 1700 } },
    ],
    updatedAt: now,
  };

  const IT: CountryBenchmarks = {
    countryCode: "IT",
    currency: "EUR",
    salaries: [
      { role: "receptionist", annualBaseEUR: { low: 20000, market: 24000, high: 28000 } },
      { role: "fb_manager",   annualBaseEUR: { low: 32000, market: 38000, high: 45000 } },
      { role: "hotel_manager",annualBaseEUR: { low: 55000, market: 70000, high: 90000 } },
    ],
    usali: [
      { category: "rooms_commissions", percentOfRevenue: { low: 11, market: 13, high: 16 } },
      { category: "fb_cost_of_sales",  percentOfRevenue: { low: 29, market: 33, high: 37 } },
      { category: "utilities",         percentOfRevenue: { low: 4,  market: 5,  high: 6 } },
      { category: "admin_general",     percentOfRevenue: { low: 7,  market: 9,  high: 11 } },
    ],
    capex: [
      { item: "guestroom_refurb_per_key", currency: "EUR", basis: "per_key", amount: { low: 8000, market: 12000, high: 16000 } },
      { item: "restaurant_build_per_sqm", currency: "EUR", basis: "per_sqm", amount: { low: 1200, market: 1700, high: 2200 } },
    ],
    updatedAt: now,
  };

  const PH: CountryBenchmarks = {
    countryCode: "PH",
    currency: "EUR",
    salaries: [
      { role: "receptionist", annualBaseEUR: { low: 6000, market: 8000,  high: 10000 } },
      { role: "fb_manager",   annualBaseEUR: { low: 12000, market: 16000, high: 22000 } },
      { role: "hotel_manager",annualBaseEUR: { low: 22000, market: 30000, high: 42000 } },
    ],
    usali: [
      { category: "rooms_commissions", percentOfRevenue: { low: 9,  market: 11, high: 13 } },
      { category: "fb_cost_of_sales",  percentOfRevenue: { low: 30, market: 34, high: 38 } },
      { category: "utilities",         percentOfRevenue: { low: 5,  market: 6,  high: 7 } },
      { category: "admin_general",     percentOfRevenue: { low: 5,  market: 7,  high: 9 } },
    ],
    capex: [
      { item: "guestroom_refurb_per_key", currency: "EUR", basis: "per_key", amount: { low: 3000, market: 4500, high: 6000 } },
      { item: "spa_build_per_sqm",        currency: "EUR", basis: "per_sqm", amount: { low: 700,  market: 950,  high: 1300 } },
    ],
    updatedAt: now,
  };

  [PT, IT, PH].forEach(Benchmarks.upsert);
}