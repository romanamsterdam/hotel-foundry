import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "../lib/supabase/client";

export default function AuthCallback() {
  const supabase = getSupabase();
  const nav = useNavigate();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const finishSignIn = async () => {
      // This Supabase function reliably handles the session from the URL fragment
      // without depending on third-party cookies.
      const { data, error } = await supabase.auth.getSessionFromUrl(window.location.href);

      if (error) {
        setErr(error.message);
        console.error("Error getting session from URL:", error);
        // On error, send the user back to the sign-in page to try again.
        setTimeout(() => nav("/signin", { replace: true }), 3000);
        return;
      }
      
      if (data.session) {
        const { session } = data;
        
        // This logic checks if the user is in a password recovery flow.
        const isRecovery = session.user.aud === 'authenticated' && session.user.recovery;

        if (isRecovery) {
          // If it's a password reset, send them to the correct page.
          nav("/auth/reset", { replace: true });
        } else {
          // Otherwise, it's a successful sign-up or login, send to dashboard.
          nav("/dashboard", { replace: true });
        }
      } else {
         // Fallback in the rare case no session is found in the URL.
         setErr("Could not establish a session. Please try signing in again.");
         setTimeout(() => nav("/signin", { replace: true }), 3000);
      }
    };

    finishSignIn();
  }, [supabase, nav]);

  return (
    <div className="mx-auto max-w-md py-12 space-y-4 text-center">
      <h1 className="text-xl font-semibold">Finalizing sign-in, please wait…</h1>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
    </div>
  );
}