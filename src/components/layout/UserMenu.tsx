import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "../ui/dropdown-menu";

function initialsFrom(email?: string|null) {
  if (!email) return "??";
  const name = email.split("@")[0];
  const parts = name.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(" ");
  const a = (parts[0] || "?")[0]?.toUpperCase() ?? "?";
  const b = (parts[1] || "")[0]?.toUpperCase() ?? "";
  return (a + b) || "U";
}

export default function UserMenu() {
  const nav = useNavigate();
  const { user, status }: any = useAuth(); // user.email, maybe user.user_metadata
  const email = (user?.email as string) || null;
  const role = (user?.user_metadata?.role || user?.role || "").toString();
  const initials = useMemo(() => initialsFrom(email), [email]);

  if (status === "loading") {
    return <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse" />;
  }
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Open user menu"
          className="w-9 h-9 rounded-full bg-emerald-600 text-white grid place-items-center font-semibold shadow hover:opacity-90"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="leading-tight">
          <div className="font-medium">{email ?? "Signed in"}</div>
          {role && <div className="text-xs text-slate-500">{role}</div>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => nav("/account")}>
          Account / Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => nav("/membership")}>
          Membership
        </DropdownMenuItem>
        {role === "admin" && (
          <DropdownMenuItem onClick={() => nav("/admin")}>
            Admin Console
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600"
          onClick={async () => {
            try {
              // Both providers expose signOut via useAuth() surface
              const maybe = (useAuth() as any);
              if (maybe?.signOut) await maybe.signOut();
            } finally {
              nav("/", { replace: true });
            }
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}