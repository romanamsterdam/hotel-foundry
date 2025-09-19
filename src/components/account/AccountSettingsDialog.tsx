import React from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  subscription: "free" | "starter" | "pro" | "beta" | null;
};

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export default function AccountSettingsDialog({ open, onOpenChange }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [name, setName] = React.useState("");
  const [pw1, setPw1] = React.useState("");
  const [pw2, setPw2] = React.useState("");

  // Fetch ONCE per open
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!open) return;
      setLoading(true);
      try {
        const [authRes, profRes] = await Promise.all([
          supabase.auth.getUser(),
          supabase.from("profiles").select("id,email,full_name,subscription").single(),
        ]);

        if (profRes.error) throw profRes.error;
        const authUser = authRes.data.user;

        const authName =
          (authUser?.user_metadata?.full_name as string | undefined) ||
          (authUser?.user_metadata?.name as string | undefined) ||
          (authUser?.user_metadata?.display_name as string | undefined) ||
          null;

        const p: Profile = {
          ...(profRes.data as any),
          full_name: authName ?? profRes.data?.full_name ?? null,
        };

        if (!cancelled) {
          setProfile(p);
          setName(p.full_name ?? "");
        }
      } catch (e: any) {
        if (!cancelled) toast.error(e.message ?? "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function onSaveName() {
    const trimmed = name.trim();
    if (!trimmed || !profile) return;
    setLoading(true);
    try {
      // 1) profiles table
      const { error: e1 } = await supabase
        .from("profiles")
        .update({ full_name: trimmed })
        .eq("id", profile.id);
      if (e1) throw e1;

      // 2) auth metadata (so other places see it)
      const { error: e2 } = await supabase.auth.updateUser({
        data: { full_name: trimmed, display_name: trimmed, name: trimmed },
      });
      if (e2) throw e2;

      setProfile({ ...profile, full_name: trimmed });
      toast.success("Name updated");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update name");
    } finally {
      setLoading(false);
    }
  }

  async function onChangePassword() {
    if (!pw1 || pw1 !== pw2) return toast.error("Passwords don't match");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;
      setPw1("");
      setPw2("");
      toast.success("Password changed");
    } catch (e: any) {
      toast.error(e.message ?? "Could not update password");
    } finally {
      setLoading(false);
    }
  }

  async function onRequestDeletion() {
    const subject = encodeURIComponent("Account deletion request");
    const body = encodeURIComponent(
      `Please delete my account.\n\nEmail: ${profile?.email ?? ""}\nUser ID: ${profile?.id ?? ""}`
    );
    const hook = import.meta.env.VITE_SUPPORT_WEBHOOK_URL as string | undefined;
    try {
      if (hook) {
        await fetch(hook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "account_deletion_request",
            email: profile?.email,
            user_id: profile?.id,
          }),
        });
        toast.success("Request sent to support");
      } else {
        window.location.href = `mailto:support@hotelfoundry.app?subject=${subject}&body=${body}`;
      }
    } catch {
      window.location.href = `mailto:support@hotelfoundry.app?subject=${subject}&body=${body}`;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Account settings</DialogTitle>
          <DialogDescription>
            Manage your profile, password, and subscription.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Name */}
          <section className="space-y-2">
            <Label htmlFor="full_name">Name</Label>
            <div className="flex gap-2">
              <Input
                id="full_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
              <Button onClick={onSaveName} disabled={loading || name.trim().length === 0}>
                Save
              </Button>
            </div>
          </section>

          {/* Password */}
          <section className="space-y-2">
            <Label>Change password</Label>
            <Input
              type="password"
              placeholder="New password"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              autoComplete="new-password"
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              autoComplete="new-password"
            />
            <Button
              variant="secondary"
              onClick={onChangePassword}
              disabled={loading || !pw1 || !pw2 || pw1 !== pw2}
            >
              Update password
            </Button>
          </section>

          {/* Subscription */}
          <section className="space-y-1">
            <Label>Subscription</Label>
            <div>
              {loading && !profile ? (
                <span className="text-sm text-slate-500">Loading…</span>
              ) : (
                <Badge variant="outline">{profile?.subscription ?? "free"}</Badge>
              )}
            </div>
          </section>

          {/* Danger zone */}
          <section className="rounded-xl border border-red-200 bg-red-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-red-800">Danger zone</div>
                <div className="text-xs text-red-700">
                  We'll email support@hotelfoundry.app with your request.
                </div>
              </div>
              <Button variant="destructive" onClick={onRequestDeletion}>
                Request account deletion
              </Button>
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}