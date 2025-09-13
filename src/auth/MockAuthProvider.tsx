import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AuthUser = {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  tier?: string; // Free | Starter | Pro (mock)
};

type AuthContextValue = {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  signIn: (opts?: { email?: string; tier?: string }) => Promise<void> | void;
  signOut: () => Promise<void> | void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const LS_KEY = "hf_user";
const LS_TIER = "tier";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  // load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed: AuthUser = JSON.parse(raw);
        // ensure tier fallback
        parsed.tier = parsed.tier ?? localStorage.getItem(LS_TIER) ?? "Free";
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
      tier,
    };
    setUser(mockUser);
  };

  const signOut = () => {
    localStorage.removeItem(LS_KEY);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, setUser, signIn, signOut }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
