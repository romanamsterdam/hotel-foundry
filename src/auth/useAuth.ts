import { useContext, createContext } from "react";
import type { User as SupaUser } from "@supabase/supabase-js";
import type { AuthUser } from "../types/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextType {
  user: AuthUser | null;
  status: AuthStatus;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Create context here to avoid circular imports
const AuthContext = createContext<AuthContextType>({
  user: null,
  status: "loading",
  loading: true,
  signOut: async () => {},
});

// Canonical hook used across the app.
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  // If someone renders without a provider, fail loudly in dev.
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Keep this re-export for existing type imports.
export type { AuthUser } from "../types/auth";