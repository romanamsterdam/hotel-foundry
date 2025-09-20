import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Singleton Supabase client with manual URL-session handling.
 * - persistSession: keep user logged in between reloads
 * - autoRefreshToken: refresh silently
 * - detectSessionInUrl: false  ← important (we handle /auth/callback and /auth/reset ourselves)
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!url || !anon) {
    // Create a no-op client shape or throw a clear error depending on your existing guard pattern.
    // Keeping throw to preserve existing failure behavior in supabase mode.
    throw new Error("Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }

  client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // do not auto-consume #access_token on load
    },
  });

  return client;
}

// Re-export a named default if your code imports { supabase } elsewhere.
// Prefer getSupabase() throughout to ensure singleton.
export const supabase = getSupabase();
