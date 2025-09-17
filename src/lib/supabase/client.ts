import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// IMPORTANT: module-scope singleton; do NOT create inside React components
export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // We handle the magic-link callback ourselves on /auth/callback
    detectSessionInUrl: false,
    // Required for exchangeCodeForSession to work
    flowType: "pkce",
  },
});
