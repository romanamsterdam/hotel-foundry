import { env } from "../config/env";

export default function DebugEnv() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-slate-900 text-green-400 rounded-lg p-6 font-mono text-sm">
          <h1 className="text-white text-xl font-bold mb-4">Environment Debug</h1>
          <pre>
            {JSON.stringify({
              AUTH_PROVIDER: env.AUTH_PROVIDER,
              DATA_SOURCE: env.DATA_SOURCE,
              APP_ENV: env.APP_ENV,
              hasSupabaseUrl: Boolean(env.SUPABASE_URL),
              hasAnonKey: Boolean(env.SUPABASE_ANON_KEY),
              FEATURE_STRIPE: env.FEATURE_STRIPE,
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
