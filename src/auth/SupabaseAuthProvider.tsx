// src/auth/SupabaseAuthProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { AuthUser as TAuthUser } from "../types/auth";

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export type AuthUser = TAuthUser;

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  signUp: (email: string, password: string) => Promise<{ ok: boolean; error?: string; requiresConfirmation?: boolean }>;
  signIn: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, subscription")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[Auth] profiles fetch error:", error);
    return null;
  }
  return data ?? null;
}

function mergeUser(sessionUser: any, profile: any): AuthUser {
  return {
    id: sessionUser.id,
    email: sessionUser.email ?? profile?.email ?? undefined,
    name: sessionUser.user_metadata?.name ?? undefined,
    avatarUrl: sessionUser.user_metadata?.avatar_url ?? undefined,
    role: profile?.role ?? undefined,
    subscription: profile?.subscription ?? undefined,
  };
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial session hydrate
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;
      if (sessionUser) {
        const profile = await fetchProfile(sessionUser.id);
        if (!isMounted) return;
        setUser(mergeUser(sessionUser, profile));
      } else {
        setUser(null);
      }
      setLoading(false);
    })();

    // Listen for auth changes
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;
      if (sessionUser) {
        const profile = await fetchProfile(sessionUser.id);
        setUser(mergeUser(sessionUser, profile));
      } else {
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!isValidEmail(email)) return { ok: false, error: "Enter a valid email address." };
    if (!password || password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      // If there's no session yet, user must confirm their email
      return { ok: true, requiresConfirmation: !data.session };
    } catch (e: any) {
      console.error("[Auth] signUp error:", e);
      return { ok: false, error: e?.message ?? "Sign up failed." };
    }
  };

  const signIn = async (email: string) => {
    try {
      const emailStr = (email ?? "").toString().trim();
      if (!isValidEmail(emailStr)) {
        return { ok: false, error: "Enter a valid email address." };
      }
      // Only sends links to existing + confirmed users (prevents enumeration in the UI)
      const { error } = await supabase.functions.invoke("send-magic-link", {
        body: { email: emailStr },
      });
      if (error) throw error;
      return { ok: true };
    } catch (e: any) {
      console.error("[Auth] signIn error:", e);
      return { ok: false, error: e?.message ?? "Sign-in failed." };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, setUser, signIn, signOut, signUp }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within Supabase AuthProvider");
  return ctx;
}
