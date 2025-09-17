import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  // When user comes from reset email, Supabase sets a short-lived session; we can now update password
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setReady(!!data.session);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (pwd.length < 8) return setErr("Password must be at least 8 characters.");
    if (pwd !== pwd2) return setErr("Passwords do not match.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;
      setMsg("Password updated. You can close this tab and sign in.");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Reset password</h1>
      {!ready && (
        <p className="text-sm text-slate-600">
          Opening reset session… If this page was not opened from a reset email, request a new link.
        </p>
      )}
      {ready && (
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="password"
            placeholder="New password"
            className="w-full border rounded px-3 py-2"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />
          <input
            type="password"
            placeholder="Repeat new password"
            className="w-full border rounded px-3 py-2"
            value={pwd2}
            onChange={(e) => setPwd2(e.target.value)}
          />
          <button type="submit" disabled={busy} className="w-full rounded bg-black text-white py-2">
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
      {msg && <p className="mt-3 text-green-700 text-sm">{msg}</p>}
      {err && <p className="mt-3 text-red-600 text-sm">{err}</p>}
    </div>
  );
}