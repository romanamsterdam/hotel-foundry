import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import AccountSettingsDialog from "@/components/account/AccountSettingsDialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
function initialsFrom(email?: string|null) {
  if (!email) return "??";
  const name = email.split("@")[0];
  const parts = name.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(" ");
  const a = (parts[0] || "?")[0]?.toUpperCase() ?? "?";
  const b = (parts[1] || "")[0]?.toUpperCase() ?? "";
  return (a + b) || "U";
}

export function AccountMenu() {
  const nav = useNavigate();
  const auth: any = useAuth(); // { user, status, signOut? }
  const [settingsOpen, setSettingsOpen] = useState(false);
  const user = auth?.user ?? null;
  const status = auth?.status ?? "loading";

  // Fallback: show Sign in when not authenticated
  if (status !== "authenticated" || !user) {
    return (
      <button
        onClick={() => nav("/login")}
        className="px-3 py-1 rounded-md border text-sm hover:bg-slate-50"
      >
        Sign in
      </button>
    );
  }

  const email: string = user.email ?? "user";
  const role = user?.user_metadata?.role || user?.role || "";
  const initials = useMemo(() => {
    const name = email.split("@")[0];
    const parts = name.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(" ");
    const a = (parts[0] || "?")[0]?.toUpperCase() ?? "?";
    const b = (parts[1] || "")[0]?.toUpperCase() ?? "";
    return (a + b) || "U";
  }, [email]);

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Open account menu"
          className="w-9 h-9 rounded-full bg-emerald-600 text-white grid place-items-center font-semibold shadow hover:opacity-90"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="leading-tight">
          <div className="font-medium">{email}</div>
          {role && <div className="text-xs text-slate-500">{role}</div>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
          Account / Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600"
          onClick={async () => {
            try { if (auth?.signOut) await auth.signOut(); }
            finally { nav("/", { replace: true }); }
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    
      <AccountSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
}

export default AccountMenu;