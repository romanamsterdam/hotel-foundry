import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const supabase = getSupabase();

  const url = useMemo(() => new URL(window.location.href), []);
  const hasLinkCode = !!(url.searchParams.get("code") || url.searchParams.get("token_hash"));

  const [err, setErr] = useState<string | null>(null);
  const [exchanging, setExchanging] = useState(false);
  const [useCode, setUseCode] = useState(false); // show OTP form
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  // 1) RUN EXCHANGE ONLY ON USER CLICK (prevents scanners consuming token)
  const onContinue = async () => {
    setErr(null);
    setExchanging(true);
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) throw error;
      // success: scroll to password form
      document.getElementById("pw-form")?.scrollIntoView({ behavior: "smooth" });
    } catch (e: any) {
      setErr("This link is invalid/expired or was pre-opened by a mail scanner. You can continue with the 6-digit code from the email.");
      setUseCode(true);
    } finally {
      setExchanging(false);
    }
  };

  // 2) OTP fallback (works cross-browser/incognito)
  const onVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!/\S+@\S+\.\S+/.test(email)) return setErr("Enter a valid email.");
    if (!/^\d{6}$/.test(code)) return setErr("Enter the 6-digit code.");

    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "recovery", // correct type for password reset
      });
      if (error) throw error;
      // session established → show password form
      document.getElementById("pw-form")?.scrollIntoView({ behavior: "smooth" });
      setUseCode(false);
    } catch (e:any) {
      setErr(e?.message ?? "Invalid or expired code.");
    } finally {
      setBusy(false);
    }
  };

  // 3) Set the new password
  const onSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pw1.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw1 !== pw2) return setErr("Passwords do not match.");

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;
      nav("/signin", { replace: true });
    } catch (e:any) {
      setErr(e?.message ?? "Could not set the new password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Reset password</h1>

      {hasLinkCode && !useCode && (
        <div className="rounded border p-4">
          <p className="text-sm text-slate-700 mb-3">
            This page was opened from your reset email. Click continue to open a secure session.
          </p>
          <button
            onClick={onContinue}
            className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
            disabled={exchanging}
          >
            {exchanging ? "Continuing…" : "Continue"}
          </button>
          <button className="mt-3 text-sm underline" onClick={() => setUseCode(true)}>
            Can't use the link? Enter a 6-digit code instead
          </button>
        </div>
      )}

      {(!hasLinkCode || useCode) && (
        <div className="rounded border p-4">
          <p className="text-sm text-slate-700 mb-3">
            Enter the email and 6-digit code shown in the reset email (works in any browser).
          </p>
          <form onSubmit={onVerifyCode} className="space-y-3">
            <input type="email" className="w-full rounded border px-3 py-2"
              placeholder="you@domain.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
            <input type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
              className="w-full rounded border px-3 py-2 tracking-widest text-center"
              placeholder="123456" value={code} onChange={(e)=>setCode(e.target.value)} />
            <button type="submit" className="w-full rounded bg-black px-3 py-2 text-white" disabled={busy}>
              {busy ? "Verifying…" : "Verify code"}
            </button>
          </form>
        </div>
      )}

      <div id="pw-form" className="rounded border p-4">
        <form onSubmit={onSetPassword} className="space-y-3">
          <input type="password" className="w-full rounded border px-3 py-2"
            placeholder="New password" value={pw1} onChange={(e)=>setPw1(e.target.value)} />
          <input type="password" className="w-full rounded border px-3 py-2"
            placeholder="Repeat new password" value={pw2} onChange={(e)=>setPw2(e.target.value)} />
          <button type="submit" className="w-full rounded bg-black px-3 py-2 text-white" disabled={busy}>
            {busy ? "Saving…" : "Set new password"}
          </button>
        </form>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}