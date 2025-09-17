import { useState } from "react";
import { supabase } from "../../lib/supabase/client";

type Mode = "password" | "magic";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [mode, setMode] = useState<Mode>("password");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  async function onPasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (!isEmail(email)) return setErr("Enter a valid email.");
    if (!pwd) return setErr("Enter your password.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
      if (error) throw error;
      // supabase-js will fire onAuthStateChange; router guard should push to /dashboard
      setMsg("Signed in. Redirecting…");
      window.location.assign("/dashboard");
    } catch (e: any) {
      setErr(e?.message ?? "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (!isEmail(email)) return setErr("Enter a valid email.");
    setBusy(true);
    try {
      // call your edge function that only sends to confirmed users
      const { error } = await supabase.functions.invoke("send-magic-link", {
        body: { email },
      });
      if (error) throw error;
      setMsg("If your email is registered, you will receive a login link.");
    } catch (e: any) {
      setErr(e?.message ?? "Could not send link.");
    } finally {
      setBusy(false);
    }
  }

  async function onForgotPassword() {
    setErr(null); setMsg(null);
    if (!isEmail(email)) return setErr("Enter your email first.");
    try {
      const redirectTo = `${window.location.origin}/auth/reset`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setMsg("Password reset email sent (if the account exists).");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to send reset email.");
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Sign in</h1>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setMode("password")}
          className={`px-3 py-1 rounded ${mode==="password" ? "bg-black text-white" : "bg-slate-200"}`}
        >
          Password
        </button>
        <button
          onClick={() => setMode("magic")}
          className={`px-3 py-1 rounded ${mode==="magic" ? "bg-black text-white" : "bg-slate-200"}`}
        >
          Magic link
        </button>
      </div>

      <form onSubmit={mode==="password" ? onPasswordLogin : onMagicLink} className="space-y-3">
        <input
          type="email"
          placeholder="email@domain.com"
          className="w-full border rounded px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        {mode === "password" && (
          <input
            type="password"
            placeholder="Your password"
            className="w-full border rounded px-3 py-2"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoComplete="current-password"
          />
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-black text-white py-2"
        >
          {busy ? "Please wait…" : (mode === "password" ? "Sign in" : "Send magic link")}
        </button>
      </form>

      <div className="mt-3 text-right">
        <button onClick={onForgotPassword} className="text-sm underline">Forgot password?</button>
      </div>

      {msg && <p className="mt-3 text-green-700 text-sm">{msg}</p>}
      {err && <p className="mt-3 text-red-600 text-sm">{err}</p>}
    </div>
  );
}