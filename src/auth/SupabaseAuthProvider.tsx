import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User as SupaUser } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";
type Ctx = { user: SupaUser | null; status: AuthStatus; signOut: () => Promise<void> };

const SupaAuthContext = createContext<Ctx>({
  user: null,
  status: "loading",
  signOut: async () => {},
});

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const u = data.session?.user ?? null;
      setUser(u);
      setStatus(u ? "authenticated" : "unauthenticated");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setStatus(u ? "authenticated" : "unauthenticated");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      user,
      status,
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [user, status]
  );

  return <SupaAuthContext.Provider value={value}>{children}</SupaAuthContext.Provider>;
}

export function useSupabaseAuth() {
  return useContext(SupaAuthContext);
}

export default SupabaseAuthProvider; // optional default