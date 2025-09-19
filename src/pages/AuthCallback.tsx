import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase/client";
import { useToast } from "../components/ui/toast";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
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
      const next = params.get("next") || "/auth/reset";

      // New v2 flow: exchange the code for a session (PKCE-safe)
      const qsCode = url.searchParams.get("code");

      try {
        const { error } = await supabase.auth.exchangeCodeForSession();
        if (error) throw error;

        // Clean the URL (remove code, tokens)
        window.history.replaceState({}, document.title, url.origin + url.pathname);

        // Route based on flow
        if (type === "recovery" || next.includes("/auth/reset")) {
          navigate(next, { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } catch (err: any) {
        const msg = err?.message ?? "Link expired or invalid. Please request a new one.";
        setErrorMsg(msg);
        toast.error(msg);
        // Clean the URL bar anyway
        window.history.replaceState({}, document.title, url.origin + url.pathname);
        setTimeout(() => navigate("/auth/forgot", { replace: true }), 1500);
      }
    })();
  }, [navigate, toast, params]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="text-xl font-medium">Finalizing…</div>
        {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}
      </div>
    </div>
  );
}