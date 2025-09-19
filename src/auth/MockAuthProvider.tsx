import React, { createContext, useContext, useMemo, useState } from "react";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type MockUser = { id: string; email: string };

type Ctx = {
  user: MockUser | null;
  status: AuthStatus;
  signIn: (email?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const MockAuthContext = createContext<Ctx>({
  user: null,
  status: "unauthenticated",
  signIn: async () => {},
  signOut: async () => {},
});

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const status: AuthStatus = user ? "authenticated" : "unauthenticated";

  const value = useMemo<Ctx>(
    () => ({
      user,
      status,
      async signIn(email = "mock@user.dev") {
        setUser({ id: "mock-user-id", email });
      },
      async signOut() {
        setUser(null);
      },
    }),
    [user]
  );

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

export function useMockAuth() {
  return useContext(MockAuthContext);
}

export default MockAuthProvider; // (ok to keep default too; named export is what callers use)