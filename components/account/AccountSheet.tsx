import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthProvider";
import {
  getMockProfile,
  setMockProfile,
  getMockTier,
  setMockTier,
} from "@/auth/accountMock";

type Tier = "Free" | "Starter" | "Pro";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export default function AccountSheet({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();

  // Guard for logged-out state
  if (!user) {
    return null;
  }

  // tab + form state
  const [tab, setTab] = useState<"profile" | "security" | "billing">("profile");
  const [name, setName] = useState("");
  const [email] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [tier, setTier] = useState<Tier>("Free");

  // Reset every time dialog opens
  useEffect(() => {
    if (open) {
      const profile = getMockProfile();
      setName(profile?.name ?? user?.name ?? "Guest");
      setCurrentPassword("");
      setNewPassword("");
      setTier((getMockTier() as Tier) ?? "Free");
      setTab("profile");
    }
  }, [open, user?.name]);

  const handleReset = () => {
    const profile = getMockProfile();
    setName(profile?.name ?? user?.name ?? "Guest");
    setCurrentPassword("");
    setNewPassword("");
    setTier((getMockTier() as Tier) ?? "Free");
  };

  const handleSave = () => {
    if (tab === "profile") {
      setMockProfile({ name, email: user?.email || "" });
      toast.success("Profile updated");
    } else if (tab === "security") {
      if (!newPassword.trim()) {
        toast.error("Enter a new password");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed (mock - Supabase integration coming)");
    } else if (tab === "billing") {
      setMockTier(tier);
      toast.success(`Plan updated to ${tier} (mock - Stripe integration coming)`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 gap-0",
          "w-[min(100vw-2rem,44rem)] max-h-[80vh]",
          "flex flex-col overflow-hidden"
        )}
      >
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Profile & Settings</DialogTitle>
              <DialogDescription className="mt-1">
                Update your profile, password, and subscription tier
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" type="button" onClick={handleReset}>
                Reset
              </Button>
              <Button size="sm" type="button" onClick={handleSave}>
                Save changes
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Sticky tabs header */}
        <div className="flex flex-col min-h-0 flex-1">
          <div className="px-6 bg-white sticky top-0 z-10 border-b">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="mt-3 grid grid-cols-3 w-full mb-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1">
            <Tabs value={tab}>
              {/* PROFILE */}
              <TabsContent value="profile" className="px-6 py-5 space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="name">Display name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={user?.email || ""} 
                    disabled 
                    className="bg-slate-50 text-slate-600"
                  />
                  <p className="text-xs text-slate-500">
                    Email changes require Supabase integration
                  </p>
                </div>
              </TabsContent>

              {/* SECURITY */}
              <TabsContent value="security" className="px-6 py-5 space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="current">Current password</Label>
                  <Input
                    id="current"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new">New password</Label>
                  <Input
                    id="new"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Password changes will be enabled with Supabase authentication integration.
                  </p>
                </div>
              </TabsContent>

              {/* BILLING */}
              <TabsContent value="billing" className="px-6 py-5 space-y-5">
                <div className="space-y-3">
                  <Label>Subscription tier</Label>
                  <RadioGroup
                    value={tier}
                    onValueChange={(v) => setTier(v as Tier)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <RadioGroupItem value="Free" id="tier-free" />
                      <Label htmlFor="tier-free" className="flex-1 cursor-pointer">
                        <div className="font-medium">Free</div>
                        <div className="text-xs text-slate-500">Basic access to platform</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <RadioGroupItem value="Starter" id="tier-starter" />
                      <Label htmlFor="tier-starter" className="flex-1 cursor-pointer">
                        <div className="font-medium">Starter - €99/month</div>
                        <div className="text-xs text-slate-500">Full underwriting platform access</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <RadioGroupItem value="Pro" id="tier-pro" />
                      <Label htmlFor="tier-pro" className="flex-1 cursor-pointer">
                        <div className="font-medium">Pro - €299/month</div>
                        <div className="text-xs text-slate-500">Everything + consultancy credits</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Coming Soon:</strong> Stripe integration for real billing management and subscription changes.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}