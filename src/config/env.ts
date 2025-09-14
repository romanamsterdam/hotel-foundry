type EnvConfig = {
  VITE_APP_ENV: string;
  VITE_AUTH_PROVIDER: "mock" | "supabase";
  VITE_DATA_SOURCE: "mock" | "supabase";
  VITE_FEATURE_STRIPE: boolean;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

export const env = {
  APP_ENV: String(import.meta.env.VITE_APP_ENV ?? "production"),
  AUTH_PROVIDER: String(import.meta.env.VITE_AUTH_PROVIDER ?? "mock").toLowerCase() as "mock" | "supabase",
  DATA_SOURCE: String(import.meta.env.VITE_DATA_SOURCE ?? "mock").toLowerCase() as "mock" | "supabase",
  FEATURE_STRIPE: String(import.meta.env.VITE_FEATURE_STRIPE ?? "false") === "true",
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
} as const;

// Back-compat for older imports
export function getEnvConfig() {
  return {
    VITE_APP_ENV: env.APP_ENV,
    VITE_AUTH_PROVIDER: env.AUTH_PROVIDER,
    VITE_DATA_SOURCE: env.DATA_SOURCE,
    VITE_FEATURE_STRIPE: env.FEATURE_STRIPE,
    VITE_SUPABASE_URL: env.SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
  };
}

export default env;