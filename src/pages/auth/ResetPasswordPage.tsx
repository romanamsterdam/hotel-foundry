import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const [stage, setStage] = useState<"opening" | "form" | "done" | "error">("opening");
  const [err, setErr] = useState<string | null>(null);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  // 1) turn the URL code into a session
  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabase();
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) throw error;
        setStage("form");
      } catch (e:any) {
        console.error("[reset] exchange error:", e);
        setErr("This link is invalid or expired. Request a new one.");
        setStage("error");
      }
    })();
  }, []);

  // 2) set a new password
  const onSubmit = async (e: React.FormEvent) => {
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
    } catch (e:any) {
      console.error("[reset] updateUser error:", e);
      setErr(e?.message ?? "Could not set the new password.");
    } finally {
      setBusy(false);
    }
  };

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

  if (stage === "error") {
    return (
      <div className="mx-auto max-w-md py-10">
        <h1 className="mb-2 text-2xl font-semibold">Reset password</h1>
        <p className="text-red-600">{err}</p>
        <a className="mt-4 inline-block underline" href="/auth/forgot">Request a new link</a>
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

  // stage === "form"
  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="mb-2 text-2xl font-semibold">Choose a new password</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          type="password"
          className="w-full rounded border px-3 py-2"
          placeholder="New password"
          value={pw1}
          onChange={(e)=>setPw1(e.target.value)}
        />
        <input
          type="password"
          className="w-full rounded border px-3 py-2"
          placeholder="Repeat new password"
          value={pw2}
          onChange={(e)=>setPw2(e.target.value)}
        />
        <button type="submit" className="w-full rounded bg-black px-3 py-2 text-white" disabled={busy}>
          {busy ? "Saving…" : "Set new password"}
        </button>
        {err && <p className="text-sm text-red-600">{err}</p>}
      </form>
    </div>
  );
}