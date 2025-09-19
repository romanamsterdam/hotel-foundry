import { createClient } from "@supabase/supabase-js";
// 👇 CORRECTED: Import the actual exported variables from your env file.
import { env } from "../../config/env";

let supabase: ReturnType<typeof createClient>;

export function getSupabase() {
  if (supabase) return supabase;

  // 👇 And use the correctly named variables here.
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_MISSING_CONFIG");
  }

  supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // This setting is crucial for our new callback page to work correctly.
      detectSessionInUrl: false, 
      flowType: "pkce",
    },
  });

  return supabase;
}