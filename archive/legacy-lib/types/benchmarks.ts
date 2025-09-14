export type Level = "low" | "market" | "high";

export type SalaryBenchmark = {
  role: "receptionist" | "fb_manager" | "hotel_manager" | string;
  annualBaseEUR: { low: number; market: number; high: number };
};

export type UsaliBenchmark = {
  // percentages of total revenue unless specified otherwise
  category:
    | "rooms_commissions"
    | "rooms_misc_direct"
    | "fb_cost_of_sales"
    | "spa_cost_of_sales"
    | "utilities"
    | "repairs_maintenance"
    | "sales_marketing"
    | "admin_general";
  percentOfRevenue: { low: number; market: number; high: number };
};

export type CapexBenchmark = {
  item:
    | "guestroom_refurb_per_key"
    | "bathroom_upgrade_per_key"
    | "ffne_per_key"
    | "it_lowvoltage_per_key"
    | "spa_build_per_sqm"
    | "restaurant_build_per_sqm";
  currency: "EUR"; // simplify for now
  amount: { low: number; market: number; high: number }; // per key or per sqm as implied
  basis: "per_key" | "per_sqm";
};

export type CountryBenchmarks = {
  countryCode: string; // ISO-3166-1 alpha-2 (e.g., "PT", "PH", "IT")
  currency?: string;   // default currency for display (optional)
  salaries: SalaryBenchmark[];
  usali: UsaliBenchmark[];
  capex: CapexBenchmark[];
  updatedAt: string;
};