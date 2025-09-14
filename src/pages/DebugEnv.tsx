import { env } from "@/config/env"; // or "@/lib/env" if that's what you use

export default function DebugEnv() {
  return (
    <pre style={{ padding: 16 }}>
      {JSON.stringify(
        {
          AUTH_PROVIDER: env.AUTH_PROVIDER,
          DATA_SOURCE: env.DATA_SOURCE,
          APP_ENV: env.APP_ENV,
          hasSupabaseUrl: Boolean(env.SUPABASE_URL),
          hasAnonKey: Boolean(env.SUPABASE_ANON_KEY),
        },
        null,
        2
      )}
    </pre>
  );
}
