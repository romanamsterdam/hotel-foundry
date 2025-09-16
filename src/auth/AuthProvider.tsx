import { ReactNode } from "react";
import { env } from "../config/env";
import type { AuthUser } from "../types/auth";
import {
  AuthProvider as MockProvider,
  useAuth as useMockAuth,
} from "./MockAuthProvider";
import {
  AuthProvider as SupabaseProvider,
  useAuth as useSupabaseAuth,
} from "./SupabaseAuthProvider";

const provider = env.AUTH_PROVIDER; // "supabase" | "mock"
const ProviderImpl = provider === "supabase" ? SupabaseProvider : MockProvider;
const useSelectedAuth = provider === "supabase" ? useSupabaseAuth : useMockAuth;

export function AuthProvider({ children }: { children: ReactNode }) {
  return <ProviderImpl>{children}</ProviderImpl>;
}

export function useAuth() {
  return useSelectedAuth();
}

export type { AuthUser };