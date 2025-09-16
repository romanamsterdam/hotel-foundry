// src/auth/SupabaseAuthProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type AuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
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

async function getProfile(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("email, role, subscription")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data;
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap current session
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!supabase) {
        setUser(null);
        setLoading(false);
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session ?? null;

      if (session?.user) {
        const u = session.user;
        const prof = await getProfile(u.id);
        if (!mounted) return;
        setUser({
          id: u.id,
          email: u.email,
          name: u.user_metadata?.full_name ?? null,
          avatarUrl: u.user_metadata?.avatar_url ?? null,
          role: (prof?.role as AuthUser["role"]) ?? "user",
          subscription: (prof?.subscription as AuthUser["subscription"]) ?? "free",
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    })();

    const { data: sub } = supabase?.auth.onAuthStateChange(async (event, sess) => {
      if (!sess?.user) {
        setUser(null);
        return;
      }
      const u = sess.user;
      const prof = await getProfile(u.id);
      setUser({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.full_name ?? null,
        avatarUrl: u.user_metadata?.avatar_url ?? null,
        role: (prof?.role as AuthUser["role"]) ?? "user",
        subscription: (prof?.subscription as AuthUser["subscription"]) ?? "free",
      });
    }) ?? { unsubscribe: () => {} };

    return () => {
      mounted = false;
      sub.subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = async ({ email, redirectTo }: { email: string; redirectTo?: string }) => {
    if (!supabase) throw new Error("Supabase client not initialized");
    const fallback = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo ?? fallback,
        // NOTE: magic link default; we can add captcha or data payload later
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const value = useMemo(
    () => ({ user, loading, setUser, signIn, signOut }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within Supabase AuthProvider");
  return ctx;
}