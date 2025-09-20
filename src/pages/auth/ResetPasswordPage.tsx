import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const supabase = getSupabase();

  const url = useMemo(() => new URL(window.location.href), []);
  const hasQueryCode = !!(url.searchParams.get("code") || url.searchParams.get("token_hash"));
  const hasHashToken =
    typeof window !== "undefined" && window.location.hash.includes("access_token=");
  const hasLinkToken = hasQueryCode || hasHashToken;

  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [exchanging, setExchanging] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  const onContinue = async () => {
    setErr(null);
    setInfo(null);
    setExchanging(true);
    try {
      const urlNow = new URL(window.location.href);
      const hasCodeNow =
        !!urlNow.searchParams.get("code") || !!urlNow.searchParams.get("token_hash");
      const hasHashTokenNow = window.location.hash.includes("access_token=");

      if (hasHashTokenNow) {
        // Try helper first
        const tryGetFromUrl = async () => {
          // If your SDK exposes getSessionFromUrl, this will succeed; otherwise throw and we fallback
          // @ts-ignore - some builds may not expose getSessionFromUrl
          const fn = (supabase.auth as any).getSessionFromUrl;
          if (typeof fn === "function") {
            const { error } = await fn.call(supabase.auth, { storeSession: true });
            if (error) throw error;
          } else {
            throw new Error("getSessionFromUrl not available");
          }
          history.replaceState(null, "", window.location.pathname + window.location.search);
        };

        try {
          await tryGetFromUrl();
        } catch {
          // Manual fallback: parse hash and set session
          const hash = window.location.hash.startsWith("#")
            ? window.location.hash.slice(1)
            : window.location.hash;
          const params = new URLSearchParams(hash);
          const access_token = params.get("access_token") ?? "";
          const refresh_token = params.get("refresh_token") ?? "";
          if (!access_token || !refresh_token) throw new Error("Missing token(s) in hash.");
          const { error: setErr2 } = await supabase.auth.setSession({ access_token, refresh_token });
          if (setErr2) throw setErr2;
          history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      } else if (hasCodeNow) {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) throw error;
      } else {
        throw new Error("Missing token in URL.");
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setErr("Could not establish a session. Please request a new reset link.");
        setAuthed(false);
        return;
      }

      setAuthed(true);
      setInfo(null);
      document.getElementById("pw-form")?.scrollIntoView({ behavior: "smooth" });
    } catch (e: any) {
      setAuthed(false);
      setErr("This reset link is invalid or has expired. Request a fresh reset link below.");
    } finally {
      setExchanging(false);
    }
  };

  const onResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
      setErr("Enter a valid email.");
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (error) throw error;
      setInfo("If that email exists, we've sent a new reset link. Please open it in this browser.");
    } catch (e: any) {
      setErr(e?.message ?? "Could not send reset email.");
    } finally {
      setResending(false);
    }
  };

  const onSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);

    if (!authed) {
      setErr("Auth session missing. Request a new reset link and try again.");
      return;
    }
    if (pw1.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw1 !== pw2) return setErr("Passwords do not match.");

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;
      setPw1("");
      setPw2("");
      setInfo("Password updated. Redirecting to sign in…");
      setTimeout(() => nav("/signin", { replace: true }), 800);
    } catch (e: any) {
      setErr(e?.message ?? "Could not set the new password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Reset password</h1>

      {hasLinkToken && !authed && (
        <div className="rounded border p-4">
          <p className="text-sm text-slate-700 mb-3">
            Click to continue with the reset link from your email.
          </p>
          <button
            onClick={onContinue}
            className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
            disabled={exchanging}
          >
            {exchanging ? "Continuing…" : "Continue"}
          </button>
        </div>
      )}

      {(!hasLinkToken || (!!err && !authed)) && (
        <div className="rounded border p-4">
          <p className="text-sm text-slate-700 mb-3">
            If your link was pre-opened by your mail provider or expired, request a fresh one:
          </p>
          <form onSubmit={onResend} className="space-y-3">
            <input
              type="email"
              className="w-full rounded border px-3 py-2"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              className="w-full rounded bg-black px-3 py-2 text-white"
              disabled={resending}
            >
              {resending ? "Sending…" : "Send new reset link"}
            </button>
          </form>
        </div>
      )}

      <div id="pw-form" className="rounded border p-4">
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
          <button
            type="submit"
            className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
            disabled={busy || !authed}
          >
            {busy ? "Setting password…" : "Set new password"}
          </button>
          {!authed && (
            <p className="mt-2 text-xs text-slate-500">
              Open your latest reset link first to enable password change.
            </p>
          )}
        </form>
      </div>

      {info && <p className="text-sm text-emerald-700">{info}</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}