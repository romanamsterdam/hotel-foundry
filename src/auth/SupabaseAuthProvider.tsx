import { useEffect, useState } from "react";
// 👇 CORRECTED: Change the import here.
import { getSupabase } from "../lib/supabase/client";
import { AuthContext, AuthSession } from "./AuthContext";
import { User } from "@supabase/supabase-js";

export default function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  // 👇 And call the getSupabase() function here to get the client.
  const supabase = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getInitialSession() {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (e) {
        console.warn("[Auth] Error getting initial session:", e);
      } finally {
        setLoading(false);
      }
    }

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const value = {
    session,
    user,
    loading,
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}