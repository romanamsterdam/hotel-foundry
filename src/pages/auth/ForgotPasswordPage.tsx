import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const emailTrimmed = email.trim();
    const redirectTo = `${window.location.origin}/auth/callback?next=/auth/reset`;

    try {
      // 1) Attempt with explicit redirectTo
      let { error } = await supabase.auth.resetPasswordForEmail(emailTrimmed, { redirectTo });
      if (error) {
        // 2) If backend complains (sometimes as 500), retry without redirectTo
        const retry = await supabase.auth.resetPasswordForEmail(emailTrimmed);
        if (retry.error) throw retry.error;
      }
      toast.success("Password reset link sent. Check your email.");
    } catch (err: any) {
      const errorMsg = err?.message ?? "Could not send reset email";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Forgot your password?</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border rounded px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </div>
  );
}