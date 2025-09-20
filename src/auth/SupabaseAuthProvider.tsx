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

// --- helpers -------------------------------------------------

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

// Promise timeout so we never hang on a slow profile query
async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return await Promise.race([
    p.then((v) => v as T),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial session hydrate
  useEffect(() => {
    let isMounted = true;
    console.log("[SupabaseAuthProvider] Initial session hydrate starting");
    (async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;
      console.log("[SupabaseAuthProvider] Initial session:", { 
        hasSession: !!data.session, 
        userId: sessionUser?.id,
        email: sessionUser?.email 
      });
      if (sessionUser) {
        console.log("[SupabaseAuthProvider] Fetching profile for user:", sessionUser.id);
        const profile = await withTimeout(fetchProfile(sessionUser.id), 2500);
        console.log("[SupabaseAuthProvider] Profile fetched (or timed-out):", !!profile);
        if (!isMounted) return;
        const mergedUser = mergeUser(sessionUser, profile);
        console.log("[SupabaseAuthProvider] Setting merged user:", mergedUser);
        setUser(mergedUser);
      } else {
        console.log("[SupabaseAuthProvider] No session user, setting user to null");
        setUser(null);
      }
      setLoading(false);
      console.log("[SupabaseAuthProvider] Initial session hydrate complete");
    })();

    // Listen for auth changes
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("[SupabaseAuthProvider] Auth state change:", { 
        event: _event, 
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email 
      });
      const sessionUser = session?.user ?? null;
      if (sessionUser) {
        console.log("[SupabaseAuthProvider] Auth change - fetching profile for:", sessionUser.id);
        const profile = await withTimeout(fetchProfile(sessionUser.id), 2500);
        const mergedUser = mergeUser(sessionUser, profile);
        console.log("[SupabaseAuthProvider] Auth change - setting merged user:", mergedUser);
        setUser(mergedUser);
      } else {
        console.log("[SupabaseAuthProvider] Auth change - no session user, setting null");
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    console.log("[SupabaseAuthProvider] signUp called:", { email, passwordLength: password.length });
    if (!isValidEmail(email)) return { ok: false, error: "Enter a valid email address." };
    if (!password || password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      console.log("[SupabaseAuthProvider] Calling supabase.auth.signUp with redirectTo:", redirectTo);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        console.error("[SupabaseAuthProvider] signUp error:", error);
        throw error;
      }
      console.log("[SupabaseAuthProvider] signUp success:", { 
        hasSession: !!data.session,
        userId: data.user?.id,
        requiresConfirmation: !data.session 
      });
      // If there's no session yet, user must confirm their email
      return { ok: true, requiresConfirmation: !data.session };
    } catch (e: any) {
      console.error("[Auth] signUp error:", e);
      return { ok: false, error: e?.message ?? "Sign up failed." };
    }
  };

  const signIn = async (email: string) => {
    console.log("[SupabaseAuthProvider] signIn (magic link) called:", { email });
    try {
      const emailStr = (email ?? "").toString().trim();
      if (!isValidEmail(emailStr)) {
        console.log("[SupabaseAuthProvider] Invalid email format:", emailStr);
        return { ok: false, error: "Enter a valid email address." };
      }

      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOtp({
        email: emailStr,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectTo,
        },
      });
      if (error) {
        console.error("[SupabaseAuthProvider] signIn (magic) error:", error);
        return { ok: false, error: error.message ?? "Could not send magic link." };
      }
      console.log("[SupabaseAuthProvider] Magic link sent");
      return { ok: true };
    } catch (e: any) {
      console.error("[SupabaseAuthProvider] signIn (magic) threw:", e);
      return { ok: false, error: e?.message ?? "Magic sign-in failed." };
    }
  };

  const signOut = async () => {
    console.log("[SupabaseAuthProvider] signOut called");
    await supabase.auth.signOut();
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
