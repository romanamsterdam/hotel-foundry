import React from "react";
import { useAuth } from "../../auth/useAuth";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Shield, ArrowLeft } from "lucide-react";

interface RequireAdminProps {
  children: React.ReactNode;
}

export default function RequireAdmin({ children }: RequireAdminProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">
          Checking admin access…
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  if (!isAdmin) {
    return (
      <div className="container mx-auto max-w-2xl py-16">
        <Card className="border-dashed">
          <CardContent className="py-10 text-center space-y-4">
            <div className="flex justify-center">
              <Shield className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Admin access required</h2>
            <p className="text-muted-foreground">
              You need an administrator account to view this area.
            </p>
            <Button
              onClick={() => (window.location.href = "/")}
              className="inline-flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}