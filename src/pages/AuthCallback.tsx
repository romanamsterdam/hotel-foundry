import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "../lib/supabase/client";

export default function AuthCallback() {
  const supabase = getSupabase();
  const nav = useNavigate();
  const url = useMemo(() => new URL(window.location.href), []);
  const hasCode = !!(url.searchParams.get("code") || url.searchParams.get("token_hash"));

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!hasCode) {
    // User opened /auth/callback directly (or wrong link) — send to sign-in
    nav("/signin", { replace: true });
    return null;
  }

  const onContinue = async () => {
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) throw error;
      nav("/dashboard", { replace: true });
    } catch (e: any) {
      setErr("This link is invalid/expired or was pre-opened by a mail scanner. Request a new link or use the 6-digit code.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-10 space-y-4">
      <h1 className="text-xl font-semibold">Finish sign in</h1>
      <button
        onClick={onContinue}
        disabled={busy}
        className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-60"
      >
        {busy ? "Continuing…" : "Continue"}
      </button>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}