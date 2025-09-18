import { createClient } from "@supabase/supabase-js";

let _client: any = null;

export function getSupabase() {
  if (_client) return _client;
  const url = import.meta.env.VITE_SUPABASE_URL!;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;
  _client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // important: no auto exchange
    },
  });
  return _client;
}

export const supabase = getSupabase();