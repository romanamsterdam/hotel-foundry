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

  try {
    await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email,
          // If your DB uses an enum that doesn't include 'beta' yet,
          // this will fail; we catch and ignore below.
          role: "user",
          subscription: "beta",
        },
        { onConflict: "id", ignoreDuplicates: false }
      );
  } catch (err) {
    console.warn("[AuthCallback] ensureProfileBeta failed (non-fatal):", err);
  }
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
        // 0) If Supabase already consumed the URL and we have a session, just proceed.
        const { data: sess0 } = await supabase.auth.getSession();
        if (sess0?.session) {
          window.history.replaceState(null, "", "/auth/callback"); // drop hash/query
          await ensureProfileBeta();
          if (!mounted) return;
          setView("ok");
          setMessage("Signed in! Redirecting…");
          setTimeout(() => window.location.replace("/dashboard"), 300);
          return;
        }

        // 1) PKCE code flow?
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error_description");
        if (error) {
          setView("error");
          setMessage(decodeURIComponent(error));
          return;
        }
        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) throw exErr;
          window.history.replaceState(null, "", "/auth/callback");
        } else {
          // 2) Hash tokens flow?
          const { access_token, refresh_token } = parseHashTokens();
          if (access_token && refresh_token) {
            const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
            if (setErr) throw setErr;
            window.history.replaceState(null, "", "/auth/callback");
          } else {
            throw new Error("No auth code or tokens found in callback URL.");
          }
        }

        // 3) Profile upsert is non-blocking: ignore failures.
        await ensureProfileBeta();

        if (!mounted) return;
        setView("ok");
        setMessage("Signed in! Redirecting…");
        setTimeout(() => window.location.replace("/dashboard"), 300);
      } catch (e: any) {
        if (!mounted) return;
        console.error("[AuthCallback] finalize error:", e);
        setView("error");
        setMessage(e?.message ?? "Could not finalize sign-in.");
      }
    }

    finalize();
    return () => { mounted = false; };
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