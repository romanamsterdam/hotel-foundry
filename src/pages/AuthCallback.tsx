import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function AuthCallback() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If the auth provider is still loading the user session, just wait.
    if (loading) {
      return;
    }

    // Once loading is complete, check if we got a user.
    if (user) {
      // Success! Redirect to the main dashboard.
      navigate("/dashboard", { replace: true });
    } else {
      // If there's no user, the sign-in failed. Go back to the sign-in page.
      // This could happen with an expired token, for example.
      navigate("/signin", { replace: true });
    }
  }, [user, loading, navigate]);

  // Display a consistent message while the logic runs.
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-sm text-slate-600 animate-pulse">Finishing sign-in…</div>
    </div>
  );
}