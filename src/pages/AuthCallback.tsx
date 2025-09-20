import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase/client";

export default function AuthCallback() {
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) throw error;
        nav("/dashboard", { replace: true });
      } catch (e) {
        console.error("[auth-callback] exchange error:", e);
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