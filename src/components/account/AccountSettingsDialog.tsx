import React, { useEffect, useState } from "react";
import { getMyProfile, updateMyName, changeMyPassword, type Profile } from "@/lib/profile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Props = { open: boolean; onOpenChange: (v: boolean) => void; };

export default function AccountSettingsDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const { data, error } = await getMyProfile();
      if (error) toast.error(error);
      setProfile(data);
      setName(data?.full_name ?? "");
      setLoading(false);
    })();
  }, [open, toast]);

  async function onSaveName() {
    setLoading(true);
    const { error } = await updateMyName(name.trim());
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Name updated");
  }

  async function onChangePassword() {
    if (!pw1 || pw1 !== pw2) return toast.error("Passwords don't match");
    setLoading(true);
    const { error } = await changeMyPassword(pw1);
    setLoading(false);
    if (error) return toast.error(error);
    setPw1(""); setPw2("");
    toast.success("Password changed");
  }

  async function onRequestDeletion() {
    // If you set VITE_SUPPORT_WEBHOOK_URL, we POST there. Else fallback to mailto.
    const hook = import.meta.env.VITE_SUPPORT_WEBHOOK_URL as string | undefined;
    const subject = encodeURIComponent("Account deletion request");
    const body = encodeURIComponent(
      `Please delete my account.\n\nEmail: ${profile?.email ?? ""}\nUser ID: ${profile?.id ?? ""}`
    );
    try {
      if (hook) {
        await fetch(hook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "account_deletion_request", email: profile?.email, user_id: profile?.id }),
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
          <DialogDescription>Manage your profile, password, and subscription.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Name */}
          <section className="space-y-2">
            <Label htmlFor="full_name">Name</Label>
            <div className="flex gap-2">
              <Input id="full_name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              <Button onClick={onSaveName} disabled={loading || !name.trim()}>Save</Button>
            </div>
          </section>

          {/* Password */}
          <section className="space-y-2">
            <Label>Change password</Label>
            <Input type="password" placeholder="New password" value={pw1} onChange={(e) => setPw1(e.target.value)} />
            <Input type="password" placeholder="Confirm new password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            <Button variant="secondary" onClick={onChangePassword} disabled={loading || !pw1 || !pw2}>Update password</Button>
          </section>

          {/* Subscription */}
          <section className="space-y-1">
            <Label>Subscription</Label>
            <div className="text-sm text-slate-700">
              {loading ? "Loading…" : (profile?.subscription ?? "free")}
            </div>
          </section>

          {/* Danger zone */}
          <section className="space-y-2">
            <Label>Danger zone</Label>
            <Button variant="destructive" onClick={onRequestDeletion}>
              Request account deletion
            </Button>
            <p className="text-xs text-slate-500">We'll email support@hotelfoundry.app with your request.</p>
          </section>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}