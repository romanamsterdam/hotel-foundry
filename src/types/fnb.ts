export type MealKey = "breakfast" | "lunch" | "dinner" | "bar";

export type MealPeriod = {
  key: MealKey;
  label: string;
  icon: string; // emoji
  guestCapturePct: number;       // 0–100
  avgCheckGuest: number;         // €
  externalCoversPerDay: number;  // persons/day
  avgCheckExternal: number;      // €
};

export type FnBAdvanced = Record<MealKey, MealPeriod>;

export type FnBSimple = {
  avgGuestsPerOccRoom: number;   // e.g. 1.8
  totalGuestCapturePct: number;  // 0–100 (sum-like)
  avgCheckGuest: number;         // €
  externalCoversPerDay: number;  // persons/day (all meals)
  avgCheckExternal: number;      // €
};

export type FnBState = {
  mode: "simple" | "advanced";
  simple: FnBSimple;
  advanced: FnBAdvanced;
  // Weights used when expanding simple→advanced for distribution
  distributionWeights: Record<MealKey, number>; // default: { breakfast:30, lunch:25, dinner:35, bar:10 }
};