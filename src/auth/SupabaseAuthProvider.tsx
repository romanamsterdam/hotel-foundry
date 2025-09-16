import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { AuthUser } from "../types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  signIn: (opts: { email: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Helper: map SB session user -> base AuthUser (without profile fields)
function mapBaseUser(sbUser: any | null): AuthUser | null {
  if (!sbUser) return null;
  return {
    id: sbUser.id,
    email: sbUser.email ?? undefined,
    name: sbUser.user_metadata?.name ?? undefined,
    avatarUrl: sbUser.user_metadata?.avatar_url ?? undefined,
  };
}

// Fetch profiles row for current user
async function fetchProfile(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("role, subscription, email")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[Auth] profiles fetch error:", error);
    return null;
  }
  return data as { role: string; subscription: string; email?: string | null } | null;
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initial session + profile load
  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!supabase) {
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const base = mapBaseUser(session?.user ?? null);

      if (!base) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const prof = await fetchProfile(base.id);
      const merged: AuthUser = {
        ...base,
        role: prof?.role as AuthUser['role'],
        subscription: prof?.subscription as AuthUser['subscription'],
      };

      if (mounted) {
        setUser(merged);
        setLoading(false);
      }
    }

    init();

    // Subscribe to auth state changes: refresh profile on sign-in/out
    const { data: sub } = supabase?.auth.onAuthStateChange(async (_e, session) => {
      const base = mapBaseUser(session?.user ?? null);
      if (!base) {
        setUser(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const prof = await fetchProfile(base.id);
      setUser({
        ...base,
        role: prof?.role as AuthUser['role'],
        subscription: prof?.subscription as AuthUser['subscription'],
      });
      setLoading(false);
    }) ?? { data: undefined };

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = async ({ email }: { email: string }) => {
    if (!supabase) return;
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
  };

  const signOut = async () => {
    if (!supabase) {
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, setUser, signIn, signOut }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider (supabase)");
  return ctx;
}