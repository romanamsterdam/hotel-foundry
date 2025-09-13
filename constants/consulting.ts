export const CONSULTING_AREAS = [
  "underwriting",
  "asset_management", 
  "benchmarks",
  "development",
  "operations",
  "finance",
  "branding",
] as const;

export type ConsultingArea = typeof CONSULTING_AREAS[number];