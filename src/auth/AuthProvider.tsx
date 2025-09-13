import * as React from "react";
import { env } from "../lib/env";

import {
  AuthProvider as MockAuthProvider,
  useAuth as useMockAuth,
  type AuthUser,
} from "./MockAuthProvider";
import {
  AuthProvider as SupabaseAuthProvider,
  useAuth as useSupabaseAuth,
} from "./SupabaseAuthProvider";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const Provider =
    env.AUTH_PROVIDER === "supabase" ? SupabaseAuthProvider : MockAuthProvider;
  return <Provider>{children}</Provider>;
};

export function useAuth() {
  return env.AUTH_PROVIDER === "supabase" ? useSupabaseAuth() : useMockAuth();
}

export type { AuthUser };
