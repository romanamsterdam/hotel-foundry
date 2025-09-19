import { createContext } from "react";
import { Session, User } from "@supabase/supabase-js";

// Re-export AuthSession for convenience, assuming it might be used elsewhere.
// If you have a central types file, this might already be defined.
export type AuthSession = Session | null;

// Define the shape of the context value
export interface AuthContextType {
  session: AuthSession;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Create the context with a default value.
// The `as any` is a common practice for context defaults when the provider
// will always supply a value.
export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});