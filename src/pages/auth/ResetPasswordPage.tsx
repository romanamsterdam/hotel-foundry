import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const supabase = getSupabase();

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const onSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (pw1.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw1 !== pw2) return setErr("Passwords do not match.");

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;
      setMsg("Password updated successfully! Redirecting to sign in...");
      setTimeout(() => nav("/signin", { replace: true }), 2000);
    } catch (e:any) {
      setErr(e?.message ?? "Could not set the new password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Set a New Password</h1>
      <div id="pw-form" className="rounded border p-4">
        <form onSubmit={onSetPassword} className="space-y-3">
          <input 
            type="password" 
            className="w-full rounded border px-3 py-2"
            placeholder="New password" 
            value={pw1} 
            onChange={(e)=>setPw1(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            className="w-full rounded border px-3 py-2"
            placeholder="Repeat new password" 
            value={pw2} 
            onChange={(e)=>setPw2(e.target.value)} 
            required 
          />
          <button type="submit" className="w-full rounded bg-black px-3 py-2 text-white" disabled={busy}>
            {busy ? "Setting Password…" : "Set New Password"}
          </button>
        </form>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}
      {msg && <p className="text-sm text-emerald-700">{msg}</p>}
    </div>
  );
}