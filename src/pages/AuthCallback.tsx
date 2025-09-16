import * as React from "react";
import { supabase } from "../lib/supabaseClient";

// Parse tokens from the hash fragment produced by Supabase magic links
function parseHash() {
  const hash = window.location.hash?.replace(/^#/, "") || "";
  const p = new URLSearchParams(hash);
  return {
    access_token: p.get("access_token"),
    refresh_token: p.get("refresh_token"),
    code: new URLSearchParams(window.location.search).get("code"),
  };
}

// (belt & suspenders) create a profile row for the current uid
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
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        if (!supabase) throw new Error("Supabase client not configured");

        // 1) If we already have a session (revisits), just go
        const current = await supabase.auth.getSession();
        if (current.data?.session) {
          await ensureProfile();
          const to = sessionStorage.getItem("postAuthRedirect") || "/";
          sessionStorage.removeItem("postAuthRedirect");
          window.history.replaceState({}, "", to);
          window.location.assign(to);
          return;
        }

        const { access_token, refresh_token, code } = parseHash();

        // 2) Magic link case — tokens in hash
        if (access_token && refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (setErr) throw setErr;

          await ensureProfile();

          const to = sessionStorage.getItem("postAuthRedirect") || "/";
          sessionStorage.removeItem("postAuthRedirect");
          // Clean hash so we don't reprocess
          window.history.replaceState({}, "", to);
          window.location.assign(to);
          return;
        }

        // 3) OAuth code flow (if you add providers later)
        if (code) {
          const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchErr) throw exchErr;

          await ensureProfile();

          const to = sessionStorage.getItem("postAuthRedirect") || "/";
          sessionStorage.removeItem("postAuthRedirect");
          window.history.replaceState({}, "", to);
          window.location.assign(to);
          return;
        }

        // 4) Nothing to finalize
        throw new Error("No auth tokens found in URL.");
      } catch (e: any) {
        console.error("[AuthCallback] error", e);
        setError(e?.message ?? "Sign in failed.");
      }
    })();
  }, []);

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-sm text-muted-foreground">
        {error ? `Auth error: ${error}` : "Finalizing sign-in…"}
      </div>
    </div>
  );
}