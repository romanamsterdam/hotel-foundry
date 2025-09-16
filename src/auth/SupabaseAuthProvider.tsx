import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type AuthUser = {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  role?: "user" | "admin";
  subscription?: "free" | "starter" | "pro" | "beta";
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  signIn: (opts: { email: string; redirectTo?: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapBaseUser(sbUser: any | null): AuthUser | null {
  if (!sbUser) return null;
  return {
    id: sbUser.id,
    email: sbUser.email ?? undefined,
    name: sbUser.user_metadata?.name ?? undefined,
    avatarUrl: sbUser.user_metadata?.avatar_url ?? undefined,
  };
}

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
  return data as {
    role?: "user" | "admin" | null;
    subscription?: "free" | "starter" | "pro" | "beta" | null;
    email?: string | null;
  } | null;
}

// ---------- SINGLE helper (do not duplicate) ----------
async function safeEnsureProfile() {
  if (!supabase) return;
  try {
    const { error } = await supabase.rpc("ensure_profile");
    if (error) console.warn("[ensure_profile] error:", error);
  } catch (e) {
    console.warn("[ensure_profile] threw:", e);
  }
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Bootstrap on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!supabase) {
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: sessionRes } = await supabase.auth.getSession();
      const base = mapBaseUser(sessionRes?.session?.user ?? null);

      if (!base) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      await safeEnsureProfile();
      const prof = await fetchProfile(base.id);

      if (mounted) {
        setUser({ ...base, role: prof?.role ?? undefined, subscription: prof?.subscription ?? undefined });
        setLoading(false);
      }
    }

    init();

    const { data: sub } =
      supabase?.auth.onAuthStateChange(async (_event, session) => {
        const base = mapBaseUser(session?.user ?? null);
        if (!base) {
          setUser(null);
          setLoading(false);
          return;
        }
        setLoading(true);
        await safeEnsureProfile();
        const prof = await fetchProfile(base.id);
        setUser({ ...base, role: prof?.role ?? undefined, subscription: prof?.subscription ?? undefined });
        setLoading(false);
      }) ?? { data: undefined };

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = async ({ email, redirectTo }: { email: string; redirectTo?: string }) => {
    if (!supabase) return;
    sessionStorage.setItem("postAuthRedirect", redirectTo || "/dashboard");
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
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