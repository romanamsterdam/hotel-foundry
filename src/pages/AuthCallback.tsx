import * as React from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/useAuth";

function parseHash() {
  // Extract tokens from URL hash (#access_token=...&refresh_token=...)
  const hash = window.location.hash?.replace(/^#/, "");
  const params = new URLSearchParams(hash);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  return { access_token, refresh_token };
}

export default function AuthCallback() {
  const { setUser } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        if (!supabase) throw new Error("Supabase client not configured");

        // 1) Handle OTP magic link case (tokens in hash)
        const { access_token, refresh_token } = parseHash();
        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;
          // Ensure profile exists after session establishment
          try {
            const { error: ensureErr } = await supabase.rpc("ensure_profile");
            if (ensureErr) console.warn("[ensure_profile] error:", ensureErr);
          } catch (e) {
            console.warn("[ensure_profile] threw:", e);
          }
        } else {
          // 2) Handle code-exchange flows if ever used (OAuth)
          const code = new URLSearchParams(window.location.search).get("code");
          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) throw error;
            try {
              const { error: ensureErr } = await supabase.rpc("ensure_profile");
              if (ensureErr) console.warn("[ensure_profile] error:", ensureErr);
            } catch (e) {
              console.warn("[ensure_profile] threw:", e);
            }
          }
        }

        // Clean URL and go home (or a stored redirect)
        const to = sessionStorage.getItem("postAuthRedirect") || "/";
        sessionStorage.removeItem("postAuthRedirect");
        // Remove hash/query to avoid reprocessing
        window.history.replaceState({}, "", to);
        window.location.assign(to);
      } catch (e: any) {
        console.error("[AuthCallback] error", e);
        setError(e?.message ?? "Sign in failed.");
      }
    })();
  }, [setUser]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-sm text-muted-foreground">
        {error ? `Auth error: ${error}` : "Finalizing sign-in…"}
      </div>
    </div>
  );
}