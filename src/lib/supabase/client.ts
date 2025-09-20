import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * Singleton Supabase client with explicit storage key.
 * - persistSession: keep user logged in between reloads
 * - autoRefreshToken: refresh silently
 * - detectSessionInUrl: false (we handle /auth/callback and /auth/reset ourselves)
 * - storageKey: explicit to avoid stale/colliding keys across ref/key rotations
 */
export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!url || !anon) {
    throw new Error(
      "SUPABASE_MISSING_CONFIG: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set"
    );
  }

  _client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: "hf-auth-v1",
    },
  });

  return _client;
}

// Keep this export for places that import { supabase } directly.
export const supabase = getSupabase();

/** Utility to clear possibly-stale Supabase auth storage for this app */
export function clearSupabaseAuthStorage() {
  try {
    const keys = Object.keys(window.localStorage);
    keys
      .filter(
        (k) =>
          k.startsWith("sb-") || // default supabase-js keys
          k === "hf-auth-v1" || // our explicit storageKey
          k.includes("hotelfoundry")
      )
      .forEach((k) => window.localStorage.removeItem(k));
    console.log("[auth] cleared localStorage keys related to Supabase");
  } catch (e) {
    console.warn("[auth] failed to clear storage", e);
  }
}
