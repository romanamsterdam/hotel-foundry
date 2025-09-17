// src/auth/SupabaseAuthProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Helper functions remain the same
function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

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
  signIn: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) {
    console.warn("[Auth] profiles fetch error (non-fatal):", error);
    return null;
  }
  return data ?? null;
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); // Start as true

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Rely *only* on onAuthStateChange. It fires immediately with the current session.
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u = session.user;
        const prof = await fetchProfile(u.id);
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
      // This is critical: set loading to false *after* the first auth check completes.
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string) => {
    try {
      const emailStr = (email ?? "").toString().trim();
      if (!isValidEmail(emailStr)) {
        return { ok: false, error: "Enter a valid email address." };
      }
      if (!supabase) {
        return { ok: false, error: "Supabase not configured" };
      }
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email: emailStr,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
      if (error) throw error;
      return { ok: true };
    } catch (e: any) {
      console.error("[Auth] signIn error:", e);
      return { ok: false, error: e?.message ?? "Sign-in failed" };
    }
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