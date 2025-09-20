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
        const hasHashToken = window.location.hash.includes("access_token=");

        if (hasHashToken) {
          // Email confirmation / magic-link style: tokens in hash
          const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
          if (error) throw error;
        } else if (hasCode) {
          // OAuth / PKCE style: code in query
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
