import { useState } from "react";
import { getSupabase } from "../../lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (!/\S+@\S+\.\S+/.test(email)) return setErr("Enter a valid email.");

    setBusy(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
      });
      if (error) throw error;
      setMsg("If that email exists, we've sent a reset link.");
    } catch (e:any) {
      setErr(e?.message ?? "Could not send reset email.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="mb-2 text-2xl font-semibold">Reset password</h1>
      <p className="text-slate-600">Enter your email to receive a reset link.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          type="email"
          className="w-full rounded border px-3 py-2"
          placeholder="you@domain.com"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />
        <button type="submit" className="w-full rounded bg-black px-3 py-2 text-white" disabled={busy}>
          {busy ? "Sending…" : "Send reset link"}
        </button>
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}
      </form>
    </div>
  );
}