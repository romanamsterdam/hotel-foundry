import * as React from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "../../lib/supabase/client";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";

type ClientType = "broker" | "investor" | "operator" | "other";

type SignUpModalProps = {
  isOpen: boolean;
  onClose: () => void;
  planId?: string;
  planName?: string;
};

export default function SignUpModal({
  isOpen,
  onClose,
  planId,
  planName,
}: SignUpModalProps) {
  const supabase = getSupabase();
  const nav = useNavigate();

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [clientType, setClientType] = React.useState<ClientType | "">("");
  const [pw1, setPw1] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  const [agreeTerms, setAgreeTerms] = React.useState(false);
  const [ackRisk, setAckRisk] = React.useState(false);

  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  const cleanEmail = email.trim().toLowerCase();
  const validEmail = /\S+@\S+\.\S+/.test(cleanEmail);
  const pwOk = pw1.length >= 8 && pw1 === pw2;
  const canSubmit =
    fullName.trim().length > 1 &&
    validEmail &&
    !!clientType &&
    pwOk &&
    agreeTerms &&
    ackRisk &&
    !busy;

  React.useEffect(() => {
    if (!isOpen) return;
    setFullName("");
    setEmail("");
    setClientType("");
    setPw1("");
    setPw2("");
    setAgreeTerms(false);
    setAckRisk(false);
    setErr(null);
    setMsg(null);
  }, [isOpen]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setErr(null);
    setMsg(null);
    setBusy(true);

    try {
      const email = cleanEmail;
      const pw1 = pw1;

      const { data, error } = await supabase.auth.signUp({
        email,
        password: pw1,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error("[signup] error", { error, data });
        toast.error(error.message || "Signup failed");
        return;
      }

      console.log("[signup] ok", data);
      toast.success("Check your email to confirm your account");
      onClose();
    } catch (e: any) {
      console.error("[signup] exception", e);
      toast.error(e?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Important: remove DialogContent's own scrolling and make our inner wrapper the scroller */}
      <DialogContent className="sm:max-w-xl md:max-w-2xl p-0">
        {/* This wrapper is the only scroll container; sticky footer works against it */}
        <div className="max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 pt-6">
            <DialogHeader>
              <DialogTitle>Join Hotel Foundry</DialogTitle>
              <DialogDescription>
                Get started with the{" "}
                <span className="font-medium text-emerald-700">
                  {planName || "Beta-tester"}
                </span>{" "}
                plan.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body */}
          <div className="px-6 pb-4 pt-2">
            <form id="signup_form" onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address *</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type of Client *</label>
                <Select value={clientType} onValueChange={(v: any) => setClientType(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your client type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="broker">Broker</SelectItem>
                    <SelectItem value="investor">Investor</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password *</label>
                  <Input
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={pw1}
                    onChange={(e) => setPw1(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm Password *</label>
                  <Input
                    type="password"
                    placeholder="Repeat password"
                    value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-md border p-3">
                <label className="flex items-start gap-2">
                  <Switch checked={agreeTerms} onCheckedChange={(v) => setAgreeTerms(!!v)} />
                  <span className="text-sm">
                    I agree to the{" "}
                    <a className="underline" href="/legal/terms" target="_blank" rel="noreferrer">
                      Terms &amp; Conditions
                    </a>{" "}
                    and{" "}
                    <a className="underline" href="/legal/privacy" target="_blank" rel="noreferrer">
                      Privacy Policy
                    </a>.
                  </span>
                </label>

                <label className="flex items-start gap-2">
                  <Switch checked={ackRisk} onCheckedChange={(v) => setAckRisk(!!v)} />
                  <span className="text-sm">
                    I acknowledge the platform is indicative, may contain errors, and should not be
                    solely relied upon for investment decisions.
                  </span>
                </label>
              </div>

              {err && <p className="text-sm text-red-600">{err}</p>}
              {!pwOk && (pw1 || pw2) && (
                <p className="text-xs text-amber-700">
                  Passwords must match and be at least 8 characters.
                </p>
              )}
              {msg && <p className="text-sm text-emerald-700">{msg}</p>}

              {/* Disclaimer */}
              <div className="mt-4 rounded-md border bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                <strong>Important Disclaimer.</strong> Hotel Foundry provides analysis tools for
                educational purposes. Projections and outputs are estimates and may not reflect
                actual performance. Always perform independent due diligence and consult qualified
                advisors. You are solely responsible for your decisions.
              </div>

              {/* Sticky footer INSIDE the scroller (works with position: sticky) */}
              <div className="sticky bottom-0 z-10 mt-4 border-t bg-white px-0 py-4">
                <Button type="submit" form="signup_form" className="w-full" disabled={!canSubmit}>
                  {busy ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Account…
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
