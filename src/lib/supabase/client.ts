import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * Singleton Supabase client with manual URL-session handling.
 * - persistSession: keep user logged in between reloads
 * - autoRefreshToken: refresh silently
 * - detectSessionInUrl: false  ← important (we handle /auth/callback and /auth/reset ourselves)
 */
export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!url || !anon) {
    throw new Error("Missing Supabase env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
  }

  _client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // do not auto-consume #access_token on load
    },
  });

  return _client;
}

// Keep this export for places that import { supabase } directly.
export const supabase = getSupabase();