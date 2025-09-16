// src/pages/AuthCallback.tsx
import * as React from "react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type View = "loading" | "ok" | "error";

function parseHashTokens() {
  const raw = window.location.hash?.replace(/^#/, "") || "";
  const p = new URLSearchParams(raw);
  const access_token = p.get("access_token");
  const refresh_token = p.get("refresh_token");
  return { access_token, refresh_token, raw };
}

async function ensureProfileBeta() {
  if (!supabase) return;
  const { data: u } = await supabase.auth.getUser();
  const user = u?.user;
  if (!user) return;

  // Try upsert; RLS must allow inserting own profile (see SQL below).
  await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email,
        role: "user",
        subscription: "beta",
      },
      { onConflict: "id", ignoreDuplicates: false }
    );
}

export default function AuthCallback() {
  const [view, setView] = useState<View>("loading");
  const [message, setMessage] = useState<string>("Finalizing sign-in…");

  useEffect(() => {
    let mounted = true;

    async function finalize() {
      if (!supabase) {
        setView("error");
        setMessage("Auth client not initialized.");
        return;
      }

      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error_description");

        if (error) {
          setView("error");
          setMessage(decodeURIComponent(error));
          return;
        }

        if (code) {
          // PKCE flow
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) throw exErr;
        } else {
          // Hash tokens flow
          const { access_token, refresh_token } = parseHashTokens();
          if (access_token && refresh_token) {
            const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
            if (setErr) throw setErr;
          } else {
            throw new Error("No auth code or tokens found in callback URL.");
          }
        }

        await ensureProfileBeta();

        if (!mounted) return;
        setView("ok");
        setMessage("Signed in! Redirecting…");
        // Small delay so the UI can toast if needed
        setTimeout(() => {
          window.location.replace("/dashboard");
        }, 400);
      } catch (e: any) {
        if (!mounted) return;
        setView("error");
        setMessage(e?.message ?? "Could not finalize sign-in.");
      }
    }

    finalize();
    return () => {
      mounted = false;
    };
  }, []);

  if (view === "error") {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="max-w-md space-y-3 text-center">
          <div className="text-lg font-semibold text-red-600">Sign-in failed</div>
          <div className="text-sm text-muted-foreground">{message}</div>
          <a href="/signin" className="underline text-sm">Try again</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-sm text-muted-foreground">{message}</div>
    </div>
  );
}