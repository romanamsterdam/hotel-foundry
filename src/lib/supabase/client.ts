// Unified Supabase client exports for browser apps
// - Named export:   supabase (singleton)
// - Named export:   getSupabase() (factory returning the same singleton)

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// We keep a module-scoped singleton to avoid multiple instances in HMR/dev.
let _client: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  // Fail fast in prod if envs are missing. In your app, the data-source guard
  // should catch this and render a friendly card — this throw keeps types honest.
  if (!url || !anon) {
    throw new Error(
      "[supabase/client] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY"
    );
  }

  _client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce",
      multiTab: true,
      storageKey: "hf-auth-v1",
    },
  });

  return _client;
}

// Provide a named singleton for sites that import { supabase } directly.
export const supabase = getSupabase();