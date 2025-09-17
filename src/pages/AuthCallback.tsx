import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          navigate("/dashboard", { replace: true });
          return;
        }

        // Fallback: implicit/hash flow (rare with PKCE, but safe to support)
        if (location.hash.includes("access_token")) {
          const params = new URLSearchParams(location.hash.slice(1));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
            navigate("/dashboard", { replace: true });
            return;
          }
        }

        setError("No auth code found. The link may be expired.");
      } catch (e: any) {
        setError(e?.message ?? "Failed to finish sign-in.");
      }
    })();
  }, [navigate, location.hash]);

  return (
    <div className="min-h-[50vh] grid place-items-center">
      <div className="text-sm text-slate-600">
        {error ? <span className="text-red-600">{error}</span> : "Finishing sign-in…"}
      </div>
    </div>
  );
}
