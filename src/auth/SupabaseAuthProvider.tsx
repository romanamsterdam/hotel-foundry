import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import type { AuthUser as TAuthUser } from "../types/auth";

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export type AuthUser = TAuthUser;

type AuthContextValue = {
  session: Session | null;
  user: AuthUser | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  signUp: (email: string, password: string) => Promise<{ ok: boolean; error?: string; requiresConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
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

function mergeUser(sessionUser: User, profile: any): AuthUser {
  return {
    id: sessionUser.id,
    email: sessionUser.email ?? profile?.email ?? undefined,
    name: sessionUser.user_metadata?.full_name ?? sessionUser.user_metadata?.name ?? undefined,
    avatarUrl: sessionUser.user_metadata?.avatar_url ?? undefined,
    role: profile?.role ?? undefined,
    subscription: profile?.subscription ?? undefined,
  };
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 1) Init from existing session (works in any tab)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ? mergeUser(data.session.user, null) : null);
      setLoading(false);
    })();

    // 2) Keep in sync across tabs / refreshes
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s ?? null);
      if (s?.user) {
        // Fetch profile lazily, don't block auth state
        const profile = await fetchProfile(s.user.id);
        setUser(mergeUser(s.user, profile));
      } else {
        setUser(null);
      }
    });

    // 3) Refresh session on tab focus for long-lived tabs
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await supabase.auth.getSession(); // forces a quick state sync
      }
    };
    const handleFocus = async () => {
      await supabase.auth.getSession(); // forces a quick state sync
    };
    
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
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

  // 3) Use the returned session immediately; don't wait for onAuthStateChange
  const signInWithPassword = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        setUser(mergeUser(data.session.user, null));
      }
    } catch (e: any) {
      console.error("[Auth] signInWithPassword error:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithPassword(email, password);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Sign-in failed." };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
    await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({ session, user, loading, setUser, signIn, signOut, signUp, signInWithPassword }),
    [session, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within Supabase AuthProvider");
  return ctx;
}
