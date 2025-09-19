import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "../../lib/supabase/client";
import { useToast } from "../../components/ui/toast";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (pw1.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (pw1 !== pw2) {
      setErr("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const supabase = getSupabase();
      // Session is already established by callback, just update password
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;
      
      toast.success("Password updated. You're signed in.");
      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      const errorMsg = e?.message ?? "Could not update password.";
      setErr(errorMsg);
      toast.error(errorMsg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Set New Password</h1>
        <p className="text-slate-600">Enter your new password below.</p>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            New Password
          </label>
          <input 
            type="password" 
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="Enter new password" 
            value={pw1} 
            onChange={(e) => setPw1(e.target.value)} 
            required 
            minLength={8}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Confirm Password
          </label>
          <input 
            type="password" 
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="Repeat new password" 
            value={pw2} 
            onChange={(e) => setPw2(e.target.value)} 
            required 
            minLength={8}
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full rounded bg-brand-600 hover:bg-brand-700 px-3 py-2 text-white font-medium transition-colors" 
          disabled={busy}
        >
          {busy ? "Setting Password…" : "Set New Password"}
        </button>
        
        {err && <p className="text-sm text-red-600">{err}</p>}
      </form>
    </div>
  );
}