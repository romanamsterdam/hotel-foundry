// src/auth/SupabaseAuthProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

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
  signUp: (email: string, password?: string) => Promise<{ ok: boolean; error?: string; requiresConfirmation?: boolean }>;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setLoading(false);
      return;
    }

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
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password?: string) => {
    if (!supabase) {
      return { ok: false, error: "Auth client not configured" };
    }
    if (!password || password.length < 8) {
      return { ok: false, error: "Password must be at least 8 characters." };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
      // If there's a user but no session, it means they need to confirm their email
      if (data.user && !data.session) {
        return { ok: true, requiresConfirmation: true };
      }
      return { ok: true };
    } catch (e: any) {
      console.error("[Auth] signUp error:", e);
      return { ok: false, error: e.message ?? "Sign up failed." };
    }
  };

  const signIn = async (email: string) => {
    try {
      const emailStr = (email ?? "").toString().trim();
      if (!isValidEmail(emailStr)) {
        return { ok: false, error: "Enter a valid email address." };
      }
      if (!supabase) {
        return { ok: false, error: "Supabase not configured" };
      }
      // Invoke the new edge function
      const { error } = await supabase.functions.invoke('send-magic-link', {
        body: { email: emailStr },
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