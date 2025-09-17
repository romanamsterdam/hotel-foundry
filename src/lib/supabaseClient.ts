import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL!;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = (url && key)
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Let the client consume #access_token automatically if present.
        // Our callback page will first check existing session and skip manual finalize if already done.
        detectSessionInUrl: true,
      },
    })
  : null;