import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { AuthUser as MockAuthUser } from "./MockAuthProvider";

export type AuthUser = MockAuthUser;

type AuthContextValue = {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  signIn: (opts: { email: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const LS_TIER = "tier";

function mapSbUser(u: any): AuthUser {
  if (!u) return null as any;
  return {
    id: u.id,
    email: u.email ?? undefined,
    name: u.user_metadata?.name ?? "",
    avatarUrl: u.user_metadata?.avatar_url ?? "",
    tier: localStorage.getItem(LS_TIER) ?? "Free",
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setUser(mapSbUser(data.session?.user ?? null));
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(mapSbUser(session?.user ?? null));
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = async ({ email }: { email: string }) => {
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, setUser, signIn, signOut }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider (supabase)");
  return ctx;
}
