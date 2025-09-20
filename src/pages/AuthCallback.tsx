import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase/client";

export default function AuthCallback() {
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const hasCode = !!url.searchParams.get("code");
        const hasHash = window.location.hash.includes("access_token=");

        if (hasHash) {
          // Manual parse + setSession to avoid relying on getSessionFromUrl
          const hash = window.location.hash.startsWith("#")
            ? window.location.hash.slice(1)
            : window.location.hash;
          const params = new URLSearchParams(hash);
          const access_token = params.get("access_token") ?? "";
          const refresh_token = params.get("refresh_token") ?? "";
          if (!access_token || !refresh_token) {
            throw new Error("Missing token(s) in hash.");
          }

          const { error: setErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (setErr) throw setErr;

          // Clean the hash so refreshes don't retry
          history.replaceState(null, "", window.location.pathname + window.location.search);
        } else if (hasCode) {
          // OAuth/PKCE style: code in query
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
        } else {
          // Nothing to exchange – go to signin
          nav("/signin?error=missing_token", { replace: true });
          return;
        }

        nav("/dashboard", { replace: true });
      } catch (e) {
        console.error("[auth-callback] finalize error:", e);
        nav("/signin?error=callback", { replace: true });
      }
    })();
  }, [nav]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-600">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-emerald-600" />
        Finalizing sign-in…
      </div>
    </div>
  );
}
