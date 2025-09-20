import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  signIn: (opts?: { email?: string; tier?: string }) => Promise<void> | void;
  signOut: () => Promise<void> | void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const LS_KEY = "hf_user";
const LS_TIER = "tier";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed: AuthUser = JSON.parse(raw);
        // ensure tier fallback
        parsed.subscription = (parsed as any).tier ?? localStorage.getItem(LS_TIER) ?? "free";
        parsed.role = "user"; // Mock users are regular users by default
        setUser(parsed);
      }
    } catch {}
  }, []);

  // persist to localStorage
  useEffect(() => {
    try {
      if (user) localStorage.setItem(LS_KEY, JSON.stringify(user));
      else localStorage.removeItem(LS_KEY);
    } catch {}
  }, [user]);

  const signIn = (opts?: { email?: string; tier?: string }) => {
    const tier = opts?.tier ?? localStorage.getItem(LS_TIER) ?? "Free";
    if (tier) localStorage.setItem(LS_TIER, tier);
    const mockUser: AuthUser = {
      id: "mock-uid",
      email: opts?.email ?? "guest@example.com",
      name: "Guest",
      avatarUrl: "",
      role: "user",
      subscription: tier.toLowerCase() as AuthUser['subscription'],
    };
    setUser(mockUser);
  };

  const signOut = () => {
    localStorage.removeItem(LS_KEY);
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
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
