import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase/client";

function parseHashTokens(hash: string) {
  const qs = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  return {
    access_token: qs.get("access_token") ?? undefined,
    refresh_token: qs.get("refresh_token") ?? undefined,
    type: qs.get("type") ?? undefined,
  };
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
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Finishing sign-in…");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function finalize() {
      if (!supabase) {
        setIsError(true);
        setMsg("Auth client not initialized.");
        return;
      }

      try {
        // Check if we already have a session (auto-consumed or previous callback)
        const { data: sess0 } = await supabase.auth.getSession();
        if (sess0?.session) {
          // Clean URL and proceed
          window.history.replaceState(null, "", "/auth/callback");
          await ensureProfileBeta();
          if (!mounted) return;
          setMsg("Signed in! Redirecting…");
          setTimeout(() => navigate("/dashboard", { replace: true }), 300);
          return;
        }

        // Parse URL for auth data
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error_description");

        if (error) {
          setIsError(true);
          setMsg(decodeURIComponent(error));
          return;
        }

        if (code) {
          // PKCE flow
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) throw exErr;
          window.history.replaceState(null, "", "/auth/callback");
        } else {
          // Hash tokens flow
          const { access_token, refresh_token } = parseHashTokens(hash);
          if (access_token && refresh_token) {
            const { error: setErr } = await supabase.auth.setSession({ 
              access_token, 
              refresh_token 
            });
            if (setErr) throw setErr;
            window.history.replaceState(null, "", "/auth/callback");
          } else {
            throw new Error("No auth code or tokens found in callback URL.");
          }
        }

        // Profile upsert is non-blocking
        await ensureProfileBeta();

        if (!mounted) return;
        setMsg("Signed in! Redirecting…");
        setTimeout(() => navigate("/dashboard", { replace: true }), 300);
      } catch (e: any) {
        if (!mounted) return;
        console.error("[AuthCallback] finalize error:", e);
        setIsError(true);
        setMsg(e?.message ?? "Could not finalize sign-in.");
      }
    }

    finalize();
    return () => { mounted = false; };
  }, [hash, navigate]);

  if (isError) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="max-w-md space-y-3 text-center">
          <div className="text-lg font-semibold text-red-600">Sign-in failed</div>
          <div className="text-sm text-slate-600">{msg}</div>
          <a href="/signin" className="underline text-sm text-brand-600 hover:text-brand-700">
            Try again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-sm text-slate-600 animate-pulse">{msg}</div>
    </div>
  );
}