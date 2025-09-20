import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "../../lib/supabase/client";
import { useAuth } from "../../auth/AuthProvider";

// Feature flag for Magic Link (default off)
const FEATURE_MAGICLINK = import.meta.env.VITE_FEATURE_MAGICLINK === "true";

// Helper to send magic link with correct origin
async function sendMagicLink(email: string) {
  if (!FEATURE_MAGICLINK) return; // guard: do nothing when disabled
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
}

type Mode = "password" | "magic";

export default function SignInPage() {
  const navigate = useNavigate();
  const { user } = useAuth(); // when session appears, redirect
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [mode, setMode] = useState<Mode>("password"); // always default to password
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    console.log("[SignInPage] useEffect user changed:", user);
    if (user) {
      console.log("[SignInPage] User detected, navigating to dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  function isEmail(v: string) {
    return /\S+@\S+\.\S+/.test(v);
  }

  function isEmail(v: string) {
    return /\S+@\S+\.\S+/.test(v);
  }

  async function onPasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    console.log("[SignInPage] onPasswordLogin started", { email, passwordLength: pwd.length });
    setErr(null); setMsg(null);
    if (!isEmail(email)) {
      console.log("[SignInPage] Invalid email format:", email);
      return setErr("Enter a valid email.");
    }
    if (!pwd) {
      console.log("[SignInPage] No password provided");
      return setErr("Enter your password.");
    }
    setBusy(true);
    console.log("[SignInPage] Calling signInWithPassword...");
    try {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password: pwd });
      if (error) {
        console.error("[SignInPage] signInWithPassword error:", error);
        throw error;
      }
      console.log("[SignInPage] signInWithPassword success - waiting for auth state change");
      // onAuthStateChange will fire; useEffect above will redirect
      setMsg("Signed in. Redirecting…");
    } catch (e: any) {
      console.error("[SignInPage] signInWithPassword catch:", e);
      setErr(e?.message ?? "Sign-in failed.");
    } finally {
      setBusy(false);
      console.log("[SignInPage] onPasswordLogin finished");
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!isEmail(email)) {
      setErr("Enter a valid email.");
      return;
    }

    setBusy(true);
    try {
      await sendMagicLink(email);
      setSent(true);
      setMsg("If your email is registered, you will receive a login link.");
    } catch (err: any) {
      console.error("[sign-in] sendMagicLink error:", err);
      setErr(err?.message ?? "Could not send the magic link. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  async function onForgotPassword() {
    console.log("[SignInPage] onForgotPassword called for email:", email);
    setErr(null); setMsg(null);
    if (!isEmail(email)) {
      console.log("[SignInPage] Invalid email for forgot password:", email);
      return setErr("Enter your email first.");
    }
    try {
      const redirectTo = `${window.location.origin}/auth/reset`; // <-- consistent origin fix
      console.log("[SignInPage] Calling resetPasswordForEmail with redirectTo:", redirectTo);
      const { error } = await getSupabase().auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        console.error("[SignInPage] resetPasswordForEmail error:", error);
        throw error;
      }
      console.log("[SignInPage] Reset password email sent successfully");
      setMsg("Password reset email sent (if the account exists).");
    } catch (e: any) {
      console.error("[sign-in] resetPassword error:", e);
      setErr(e?.message ?? "Could not send the reset email. Please try again.");
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Sign in</h1>

      {FEATURE_MAGICLINK && (
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
      )}

      <form onSubmit={mode==="password" ? onPasswordLogin : onSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="email@domain.com"
          className="w-full border rounded px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        {(mode === "password" || !FEATURE_MAGICLINK) && (
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
          {busy ? "Please wait..." : (mode === "password" || !FEATURE_MAGICLINK ? "Sign in" : "Send magic link")}
        </button>
      </form>

      <div className="mt-3 text-right">
        <a href="/auth/forgot" className="text-sm underline">Forgot password?</a>
      </div>

      {msg && <p className="mt-3 text-green-700 text-sm">{msg}</p>}
      {err && <p className="mt-3 text-red-600 text-sm">{err}</p>}
    </div>
  );
}