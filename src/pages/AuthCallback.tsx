import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase/client";

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
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Finishing sign-in…");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function verifySessionAndRedirect() {
      if (!supabase) {
        if (mounted) {
          setIsError(true);
          setMsg("Auth client not initialized.");
        }
        return;
      }
      
      const sessionCheck = async (attempts: number): Promise<void> => {
        if (!mounted) return;

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw new Error("Failed to retrieve session. Please try again.");
        }

        if (data.session) {
          await ensureProfileBeta();
          if (mounted) {
            setMsg("Signed in! Redirecting…");
            navigate("/dashboard", { replace: true });
          }
          return;
        }

        if (attempts > 0) {
          setTimeout(() => sessionCheck(attempts - 1), 200);
        } else {
          throw new Error("Login session timed out. Please try again.");
        }
      };

      try {
        await sessionCheck(10); // Try for up to 2 seconds
      } catch (e: any) {
        if (mounted) {
          console.error("[AuthCallback] verifySession error:", e);
          setIsError(true);
          setMsg(e?.message ?? "Could not finalize sign-in.");
        }
      }
    }

    verifySessionAndRedirect();

    return () => {
      mounted = false;
    };
  }, [navigate]);

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