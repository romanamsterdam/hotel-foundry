import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export const supabase =
  env.SUPABASE_URL && env.SUPABASE_ANON_KEY
    ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,          // IMPORTANT
          autoRefreshToken: true,        // IMPORTANT
          detectSessionInUrl: true,      // IMPORTANT: we let Supabase parse tokens on /auth/callback automatically
        },
      })
    : null;