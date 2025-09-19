import { createClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase() {
  if (_client) return _client;
  _client = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,  // <- prevents scanners from auto-consuming tokens
      flowType: "pkce",
      multiTab: true,             // <- sync sessions across tabs
      storageKey: "hf-auth-v1",   // <- stable key
    },
  });
  return _client;
}

export const supabase = getSupabase();