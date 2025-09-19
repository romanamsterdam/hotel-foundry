import * as React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const href = window.location.href;
      const url = new URL(href);

      // If Supabase sent us explicit errors
      const err = url.searchParams.get("error") || url.searchParams.get("error_code");
      const errDesc = url.searchParams.get("error_description") || url.searchParams.get("message");
      if (err || errDesc) {
        const msg = errDesc || err || "Authentication error";
        setErrorMsg(msg);
        toast.error(msg);
        window.history.replaceState({}, document.title, url.origin + url.pathname);
        setTimeout(() => navigate("/signin", { replace: true }), 1200);
        return;
      }

      const qsCode = url.searchParams.get("code"); // new style
      const next = url.searchParams.get("next");   // e.g. "/auth/reset"
      const type = url.searchParams.get("type");   // "recovery" for reset links

      try {
        const anyAuth = supabase.auth as any;
        const input = qsCode ? qsCode : href; // v2 accepts code OR full href
        if (typeof anyAuth.exchangeCodeForSession === "function") {
          const { error } = await anyAuth.exchangeCodeForSession(input);
          if (error) throw error;
        } else if (typeof anyAuth.getSessionFromUrl === "function") {
          const { error } = await anyAuth.getSessionFromUrl({ storeSession: true });
          if (error) throw error;
        } else {
          throw new Error("No supported auth callback method found");
        }

        // Clean the URL after exchanging
        window.history.replaceState({}, document.title, url.origin + url.pathname);

        if (type === "recovery" || next === "/auth/reset") {
          navigate("/auth/reset", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } catch (e: any) {
        const msg = e?.message || "Could not finalize sign-in";
        setErrorMsg(msg);
        toast.error(msg);
        window.history.replaceState({}, document.title, url.origin + url.pathname);
        setTimeout(() => navigate("/signin", { replace: true }), 1500);
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="text-xl font-medium">Finalizing sign-in…</div>
        {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}
      </div>
    </div>
  );
}