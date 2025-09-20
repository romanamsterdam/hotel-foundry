import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "../../lib/supabase/client";

/**
 * Robust reset-password page that:
 * 1) Exchanges the URL code for a session (since detectSessionInUrl=false).
 * 2) Shows a "Set new password" form whenever a session exists (no reliance on PASSWORD_RECOVERY event).
 * 3) Calls supabase.auth.updateUser({ password }) and redirects.
 */
export default function ResetPasswordPage() {
  const supabase = getSupabase();
  const navigate = useNavigate();

  type Stage = "checking" | "form" | "saving" | "done" | "error";
  const [stage, setStage] = useState<Stage>("checking");
  const [error, setError] = useState<string | null>(null);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");

  const url = useMemo(() => window.location.href, []);
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const hasCodeParam = !!query.get("code");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setStage("checking");
      setError(null);

      try {
        // 1) If the URL contains a code (or hash tokens), try to exchange it for a session.
        //    This is required because detectSessionInUrl=false in our client options.
        //    exchangeCodeForSession is safe to call even if already exchanged; it will no-op.
        if (hasCodeParam || window.location.hash.includes("access_token")) {
          try {
            console.log("[/auth/reset] Attempting exchangeCodeForSession()");
            const { data, error } = await supabase.auth.exchangeCodeForSession(url);
            if (error) {
              console.warn("[/auth/reset] exchangeCodeForSession error:", error);
              // Don't hard fail here—some links may already have created a session.
            } else {
              console.log("[/auth/reset] exchange success:", {
                hasSession: !!data.session,
                userId: data.session?.user?.id,
              });
            }
          } catch (e) {
            console.warn("[/auth/reset] exchange threw:", e);
          }
        }

        // 2) Check for session. If present, show form; otherwise show error.
        const { data } = await supabase.auth.getSession();
        const hasSession = !!data.session?.user;
        console.log("[/auth/reset] session check:", { hasSession, userId: data.session?.user?.id });

        if (cancelled) return;

        if (hasSession) {
          setStage("form");
        } else {
          setStage("error");
          setError(
            "Reset link is invalid or expired. Request a new link from the Sign In page."
          );
        }
      } catch (e: any) {
        if (cancelled) return;
        console.error("[/auth/reset] unexpected error:", e);
        setStage("error");
        setError(e?.message ?? "Unexpected error while preparing password reset.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, url, hasCodeParam]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!pwd || pwd.length < 8) {
      return setError("Password must be at least 8 characters.");
    }
    if (pwd !== pwd2) {
      return setError("Passwords do not match.");
    }

    setStage("saving");
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;

      setStage("done");
      // Small pause so the user sees success, then go to dashboard
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 800);
    } catch (e: any) {
      console.error("[/auth/reset] updateUser error:", e);
      setStage("form");
      setError(e?.message ?? "Could not set the new password. Try again.");
    }
  }

  if (stage === "checking") {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Resetting password…</h1>
        <p className="text-sm text-gray-600">Preparing your reset session.</p>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Password reset error</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <a className="underline" href="/signin">Back to Sign In</a>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Password updated</h1>
        <p className="text-sm text-gray-700">Redirecting you to your dashboard…</p>
      </div>
    );
  }

  // stage: "form" | "saving"
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Set a new password</h1>
      <p className="text-sm text-gray-600 mb-4">
        You’re signed in from a secure reset link. Choose a new password below.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">New password</label>
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={8}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Repeat new password</label>
          <input
            type="password"
            value={pwd2}
            onChange={(e) => setPwd2(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={stage === "saving"}
          className="w-full rounded bg-black text-white py-2"
        >
          {stage === "saving" ? "Saving…" : "Save new password"}
        </button>
      </form>

      {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}

      <div className="mt-4 text-sm">
        <a className="underline" href="/auth/debug">Auth debug</a>
      </div>
    </div>
  );
}
