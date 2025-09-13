import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export type AuthUser = { 
  id: string; 
  email: string; 
  name?: string;
  avatarUrl?: string;
  tier?: "Free" | "Starter" | "Pro";
} | null;

type AuthContextShape = {
  user: AuthUser;
  signIn: (u?: Partial<NonNullable<AuthUser>>) => void;
  signOut: () => void;
  // Keep legacy aliases for backward compatibility
  login: (u?: Partial<NonNullable<AuthUser>>) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextShape | undefined>(undefined);
const LS_KEY = "hf_user"; // mock persistence

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(null);            // DEFAULT: LOGGED OUT
  const nav = useNavigate();

  // hydrate from localStorage (if you want persistence during dev)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const signIn = (u?: Partial<NonNullable<AuthUser>>) => {
    const next = { id: "dev-user", email: "guest@example.com", name: "Guest", ...u };
    setUser(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
    nav("/dashboard", { replace: true });
  };

  const signOut = () => {
    setUser(null);
    try { localStorage.removeItem(LS_KEY); } catch {}
    nav("/", { replace: true });
  };

  const value = useMemo(() => ({ 
    user, 
    signIn, 
    signOut,
    // Legacy aliases
    login: signIn,
    logout: signOut
  }), [user, signIn, signOut]);
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ✅ Export the hook from the same file
export function useAuth(): AuthContextShape {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}