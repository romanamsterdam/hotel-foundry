export const env = {
  APP_ENV: import.meta.env.VITE_APP_ENV ?? "development",
  DATA_SOURCE: (import.meta.env.VITE_DATA_SOURCE ?? "mock") as "mock" | "supabase",
  AUTH_PROVIDER: (import.meta.env.VITE_AUTH_PROVIDER ?? "mock") as "mock" | "supabase",
  FEATURE_STRIPE: (import.meta.env.VITE_FEATURE_STRIPE ?? "false") === "true",
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
};