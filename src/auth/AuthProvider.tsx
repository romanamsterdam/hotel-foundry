import React from "react";
import { env } from "../lib/env";
import { SupabaseAuthProvider, useSupabaseAuth } from "./SupabaseAuthProvider";
import { MockAuthProvider, useMockAuth } from "./MockAuthProvider";

/** Named export expected across the app */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (env.AUTH_PROVIDER === "supabase") {
    return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
  }
  return <MockAuthProvider>{children}</MockAuthProvider>;
}

/** Single hook surface expected across the app */
export function useAuth() {
  return env.AUTH_PROVIDER === "supabase"
    ? useSupabaseAuth()
    : useMockAuth();
}