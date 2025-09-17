import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

function FullscreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
    </div>
  );
}

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <FullscreenSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }
  
  return <Outlet />;
}