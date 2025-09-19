import * as React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase/client";
import { useToast } from "../components/ui/toast";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const href = window.location.href;
      const url = new URL(href);

      // Supabase sends these when something failed
      const error = url.searchParams.get("error") || url.searchParams.get("error_code");
      const error_description =
        url.searchParams.get("error_description") || url.searchParams.get("message");

      if (error || error_description) {
        setErrorMsg(error_description || error || "Authentication error");
        // Strip sensitive params from the URL bar
        window.history.replaceState({}, document.title, url.origin + url.pathname);
        // Give the user a moment, then go to sign-in
        setTimeout(() => navigate("/signin", { replace: true }), 1200);
        return;
      }

      // Password reset flow
      const type = url.searchParams.get("type"); // "recovery" for reset links
      const next = url.searchParams.get("next"); // e.g. "/auth/reset"

      // New v2 flow: exchange the code for a session (PKCE-safe)
      const qsCode = url.searchParams.get("code");

      try {
        const anyAuth = supabase.auth as any;

        if (typeof anyAuth.exchangeCodeForSession === "function") {
          // v2 API: accepts either the code or the full href
          const input = qsCode ? qsCode : href;
          const { data, error } = await anyAuth.exchangeCodeForSession(input);
          if (error) throw error;
        } else if (typeof anyAuth.getSessionFromUrl === "function") {
          // Fallback for old clients (shouldn't happen in v2)
          const { data, error } = await anyAuth.getSessionFromUrl({ storeSession: true });
          if (error) throw error;
        } else {
          throw new Error("No supported auth callback method found");
        }

        // Clean the URL (remove code, tokens)
        window.history.replaceState({}, document.title, url.origin + url.pathname);

        // Route based on flow
        if (type === "recovery" || next?.includes("/auth/reset")) {
          navigate("/auth/reset", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Could not finalize sign-in");
        // Clean the URL bar anyway
        window.history.replaceState({}, document.title, url.origin + url.pathname);
        setTimeout(() => navigate("/signin", { replace: true }), 1500);
      }
    })();
  }, [navigate, toast]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="text-xl font-medium">Finalizing sign-in…</div>
        {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}
      </div>
    </div>
  );
}