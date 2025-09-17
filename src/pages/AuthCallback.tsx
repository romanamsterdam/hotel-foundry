import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // The AuthProvider will handle the session.
    // This component's only job is to navigate away from the callback URL.
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-sm text-slate-600 animate-pulse">Finishing sign-in…</div>
    </div>
  );
}