import * as React from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!supabase) {
      setError("Supabase client not configured");
      return;
    }

    let unsub: { data?: { subscription?: { unsubscribe?: () => void } } } | null = null;
    let done = false;

    async function redirectHome() {
      if (done) return;
      done = true;

      // belt & suspenders: ensure profiles row exists (ignore errors)
      try {
        const { error: ensureErr } = await supabase.rpc("ensure_profile");
        if (ensureErr) console.warn("[ensure_profile] error:", ensureErr);
      } catch (e) {
        console.warn("[ensure_profile] threw:", e);
      }

      const to = sessionStorage.getItem("postAuthRedirect") || "/";
      sessionStorage.removeItem("postAuthRedirect");
      // Clean URL so we don't re-process fragments
      window.history.replaceState({}, "", to);
      window.location.assign(to);
    }

    (async () => {
      try {
        // 1) If the client already parsed the URL and we have a session, go.
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          await redirectHome();
          return;
        }

        // 2) Otherwise wait for Supabase to finish parsing and emit SIGNED_IN.
        unsub = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === "SIGNED_IN" && session) {
            await redirectHome();
          }
        });

        // 3) Watchdog: if nothing happens in 7s, show an error (bad redirect or stale link)
        setTimeout(async () => {
          if (!done) {
            const { data: again } = await supabase.auth.getSession();
            if (again?.session) {
              await redirectHome();
            } else {
              setError("No auth tokens found or link expired.");
            }
          }
        }, 7000);
      } catch (e: any) {
        console.error("[AuthCallback] error", e);
        setError(e?.message ?? "Sign in failed.");
      }
    })();

    return () => unsub?.data?.subscription?.unsubscribe?.();
  }, []);

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-sm text-muted-foreground">
        {error ? `Auth error: ${error}` : "Finalizing sign-in…"}
      </div>
    </div>
  );
}