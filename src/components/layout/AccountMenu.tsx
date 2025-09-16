import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { useAuth } from "../../auth/useAuth";
import AccountSheet from "../account/AccountSheet";
import { Badge } from "../ui/badge";

function initialsFrom(name?: string, email?: string) {
  const base = (name || email || "").trim();
  if (!base) return "U";
  const parts = base.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : (email?.[0] ?? "");
  return (first + last).toUpperCase();
}

export default function AccountMenu() {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [openSheet, setOpenSheet] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);
  
  // Guard for logged-out state
  if (loading || !user) {
    return null;
  }

  const name = (user as any)?.name || (user as any)?.fullName || "";
  const email = (user as any)?.email || "";
  const avatarUrl = (user as any)?.avatarUrl || (user as any)?.user_metadata?.avatar_url || "";
  const initials = initialsFrom(name, email);

  async function handleSignOut() {
    try {
      await signOut?.();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      navigate("/"); // always return to landing
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 px-2 rounded-full hover:bg-muted cursor-pointer" data-clickable>
            <span className="sr-only">Open account menu</span>
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                {avatarUrl && !imgError ? (
                  <AvatarImage 
                    src={avatarUrl} 
                    alt={name || email || "User"}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <AvatarFallback className="text-xs bg-gradient-to-br from-brand-500 to-accent-500 text-white font-semibold">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium max-w-[160px] truncate">
                {name || email || "Account"}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            Signed in as
            <div className="truncate text-xs text-muted-foreground">{name || email || "User"}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {user.role || 'user'}
              </Badge>
              {user.subscription && (
                <Badge variant="outline" className="text-xs">
                  {user.subscription}
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenSheet(true)} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Profile & Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Unified Profile & Settings Modal */}
      <AccountSheet open={openSheet} onOpenChange={setOpenSheet} />
    </>
  );
}