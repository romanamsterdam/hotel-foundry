import React from "react";
import { useAuth } from "../../auth/AuthProvider";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

export default function SignInPage() {
  const { login } = useAuth();
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-md">
        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-slate-900">Sign in</CardTitle>
            <p className="text-slate-600 mt-2">
              This is a temporary dev sign-in. Supabase will replace this.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => login()} 
              className="w-full bg-brand-600 hover:bg-brand-700 text-white"
            >
              Continue as Guest
            </Button>
            <p className="text-xs text-slate-500 text-center">
              Mock authentication for development. Real auth coming with Supabase integration.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}