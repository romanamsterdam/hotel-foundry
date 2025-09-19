import { useContext } from "react";
import { AuthContext, type AuthContextType } from "./AuthContext";

// Canonical hook used across the app.
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  // If someone renders without a provider, fail loudly in dev.
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Keep this re-export for existing type imports.
export type { AuthUser } from "../types/auth";