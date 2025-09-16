import * as React from "react";
import { supabase } from "../lib/supabaseClient";

function parseHash() {
  const hash = window.location.hash?.replace(/^#/, "") || "";
  const p = new URLSearchParams(hash);
  return {
    access_token: p.get("access_token"),
    refresh_token: p.get("refresh_token"),
    raw: hash,
  };
}

async function ensureProfile() {
  if (!supabase) return;
  try {
    const { error } = await supabase.rpc("ensure_profile");
    if (error) console.warn("[ensure_profile] error:", error);
  } catch (e) {
    console.warn("[ensure_profile] threw:", e);
  }
}

export default function AuthCallback() {
  const [state, setState] = React.useState<{
    loading: boolean;
    error?: string;
    debug?: Record<string, any>;
  }>({ loading: true });

  React.useEffect(() => {
    (async () => {
      const debug: Record<string, any> = {};
      try {
        if (!supabase) throw new Error("Supabase client not configured");

        // Already signed in?
        const current = await supabase.auth.getSession();
        debug.preSession = current?.data;
        if (current?.data?.session) {
          await ensureProfile();
          const to = sessionStorage.getItem("postAuthRedirect") || "/";
          sessionStorage.removeItem("postAuthRedirect");
          window.history.replaceState({}, "", to);
          window.location.assign(to);
          return;
        }

        // Manual finalize (detectSessionInUrl:false)
        const { access_token, refresh_token, raw } = parseHash();
        debug.hash = raw;

        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
          debug.setSession = { data, error };
          if (error) throw error;

          await ensureProfile();

          const to = sessionStorage.getItem("postAuthRedirect") || "/";
          sessionStorage.removeItem("postAuthRedirect");
          window.history.replaceState({}, "", to);
          window.location.assign(to);
          return;
        }

        // No tokens found -> likely expired/invalid email link
        throw new Error("No auth tokens found (link invalid/expired or consumed by email scanner).");
      } catch (e: any) {
        console.error("[AuthCallback]", e);
        debug.fail = {
          name: e?.name,
          message: e?.message,
          code: e?.status || e?.code,
          stack: e?.stack,
        };
        setState({ loading: false, error: debug.fail.message || "Sign-in failed.", debug });
      }
    })();
  }, []);

  if (!state.loading && state.error) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4">
        <h1 className="text-lg font-semibold">Auth error</h1>
        <p className="text-sm text-red-600">{state.error}</p>
        <div className="rounded-md bg-muted p-3 text-xs overflow-auto">
          <pre>{JSON.stringify(state.debug, null, 2)}</pre>
        </div>
        <div className="text-sm text-muted-foreground">
          Tips: request a fresh link, open it once, or use the 6-digit code fallback on the sign-in page.
        </div>
        <a href="/" className="underline text-sm">Back to home</a>
      </div>
    );
  }

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-sm text-muted-foreground">Finalizing sign-in…</div>
    </div>
  );
}