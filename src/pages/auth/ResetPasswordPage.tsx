import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const [stage, setStage] = useState<"opening" | "form" | "done" | "error">("opening");
  const [err, setErr] = useState<string | null>(null);

  // NEW: show OTP fallback UI toggle
  const [useCode, setUseCode] = useState(false);

  // password fields
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  // OTP fields
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Try link path first (same-origin success). If it fails, user can switch to code.
  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) throw error;
        setStage("form");
      } catch {
        // Don't block — show "opening" briefly then offer code fallback
        setStage("error");
      }
    })();
  }, []);

  // OTP fallback — works in any browser
  const onVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!/\S+@\S+\.\S+/.test(email)) return setErr("Enter a valid email.");
    if (!/^\d{6}$/.test(code)) return setErr("Enter the 6-digit code.");

    setVerifying(true);
    try {
      const supabase = getSupabase();
      // Verify the email OTP → creates a session without PKCE
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email", // email OTP
      });
      if (error) throw error;
      // Now let the user set a new password
      setStage("form");
    } catch (e: any) {
      setErr(e?.message ?? "Invalid or expired code.");
    } finally {
      setVerifying(false);
    }
  };

  const onSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pw1.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw1 !== pw2) return setErr("Passwords do not match.");
    setBusy(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;
      setStage("done");
      setTimeout(() => nav("/signin"), 1200);
    } catch (e: any) {
      setErr(e?.message ?? "Could not set the new password.");
    } finally {
      setBusy(false);
    }
  };

  // UI
  if (stage === "opening") {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-600">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-emerald-600" />
          Opening reset session…
        </div>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="mx-auto max-w-md py-10">
        <h1 className="mb-2 text-2xl font-semibold">Password updated</h1>
        <p className="text-slate-600">Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Reset password</h1>

      {stage === "error" && (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
          The secure link couldn't open a session (different browser/device). Use your 6-digit code instead.
        </div>
      )}

      {stage === "form" && !useCode ? (
        <>
          <div className="text-sm text-slate-600">
            If you reached this page from the email on the same device, set your new password:
          </div>

          <form onSubmit={onSetPassword} className="space-y-3">
            <input
              type="password"
              className="w-full rounded border px-3 py-2"
              placeholder="New password"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
            />
            <input
              type="password"
              className="w-full rounded border px-3 py-2"
              placeholder="Repeat new password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
            />
            <button type="submit" className="w-full rounded bg-black px-3 py-2 text-white" disabled={busy}>
              {busy ? "Saving…" : "Set new password"}
            </button>
            {err && <p className="text-sm text-red-600">{err}</p>}
          </form>

          <button className="text-sm underline mt-2" onClick={() => setUseCode(true)}>
            Can't use the link? Enter a 6-digit code instead
          </button>
        </>
      ) : (
        <>
          <div className="text-sm text-slate-600">
            Enter the email and 6-digit code from the reset email (works even in another browser).
          </div>
          <form onSubmit={onVerifyCode} className="space-y-3">
            <input
              type="email"
              className="w-full rounded border px-3 py-2"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              className="w-full rounded border px-3 py-2 tracking-widest text-center"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button type="submit" className="w-full rounded bg-black px-3 py-2 text-white" disabled={verifying}>
              {verifying ? "Verifying…" : "Verify code"}
            </button>
            {err && <p className="text-sm text-red-600">{err}</p>}
          </form>

          {stage === "form" && (
            <button className="text-sm underline mt-2" onClick={() => setUseCode(false)}>
              Use the link instead
            </button>
          )}
        </>
      )}

      {stage === "done" && (
        <div className="text-emerald-700 text-sm">Password updated. Redirecting…</div>
      )}
    </div>
  );
}