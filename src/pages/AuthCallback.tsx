import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { search, hash } = useLocation();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const error_code = url.searchParams.get("error_code");
        const error_description = url.searchParams.get("error_description");

        if (error_code) {
          throw new Error(decodeURIComponent(error_description ?? "Auth error"));
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          navigate("/dashboard", { replace: true });
          return;
        }

        // rare fallback if provider returned tokens in hash
        if (hash.includes("access_token")) {
          const params = new URLSearchParams(hash.slice(1));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
            navigate("/dashboard", { replace: true });
            return;
          }
        }

        throw new Error("No auth code found. The link may be expired.");
      } catch (e: any) {
        setErr(e?.message ?? "Failed to finish sign-in.");
      }
    })();
  }, [navigate, search, hash]);

  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <div className="text-sm text-slate-600">
        {err ? <span className="text-red-600">{err}</span> : "Finishing sign-in…"}
      </div>
    </div>
  );
}