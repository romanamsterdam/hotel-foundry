// src/config/env.ts
type Reader = (k: string) => string | undefined;
const read: Reader = (k) => (import.meta.env ? (import.meta.env as any)[k] : undefined);

function getEnv(key: string, fallback?: string): string | undefined {
  const val = read(key);
  if (val == null || val === "") return fallback;
  return val;
}

export const ENV = {
  APP_ENV: getEnv("VITE_APP_ENV", "development")!,              // 'development' | 'preview' | 'production'
  DATA_SOURCE: getEnv("VITE_DATA_SOURCE", "mock")!,             // 'mock' | 'supabase'
  SUPABASE_URL: getEnv("VITE_SUPABASE_URL"),                    // optional until wired
  SUPABASE_ANON_KEY: getEnv("VITE_SUPABASE_ANON_KEY"),          // optional until wired
};

// Log a one-time hint instead of throwing
if ((!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) && ENV.DATA_SOURCE !== "mock") {
  // eslint-disable-next-line no-console
  console.warn("[ENV] Supabase vars are missing; falling back to mock data.");
}

// Main export function for component usage
export function getEnvConfig() {
  return {
    VITE_APP_ENV: ENV.APP_ENV,
    VITE_DATA_SOURCE: ENV.DATA_SOURCE,
    VITE_FEATURE_STRIPE: (import.meta.env.VITE_FEATURE_STRIPE ?? "false") === "true",
    VITE_SUPABASE_URL: ENV.SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: ENV.SUPABASE_ANON_KEY
  };
}

export const isDev = ENV.APP_ENV === "development";
export const isStaging = ENV.APP_ENV === "staging";
export const isProd = ENV.APP_ENV === "production";