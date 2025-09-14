import React, { useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useToast } from "../../components/ui/toast";
import { env } from "../../config/env";

export default function SignInPage() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  
  const isSupabase = env.AUTH_PROVIDER === "supabase";
  
  const handleSupabaseSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    
    setLoading(true);
    try {
      await signIn({ email: email.trim() });
      toast.success("Check your email for the magic link!");
    } catch (error) {
      toast.error("Failed to send magic link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMockSignIn = () => {
    signIn();
  };
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-md">
        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-slate-900">Sign in</CardTitle>
            <p className="text-slate-600 mt-2">
              {isSupabase 
                ? "Enter your email to receive a magic link"
                : "This is a temporary dev sign-in. Supabase will replace this."
              }
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSupabase ? (
              <form onSubmit={handleSupabaseSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    disabled={loading}
                  />
                </div>
                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                >
                  {loading ? "Sending..." : "Send Magic Link"}
                </Button>
                <p className="text-xs text-slate-500 text-center">
                  We'll send you a secure link to sign in without a password.
                </p>
              </form>
            ) : (
              <>
                <Button 
                  onClick={handleMockSignIn} 
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                >
                  Continue as Guest
                </Button>
                <p className="text-xs text-slate-500 text-center">
                  Mock authentication for development. Real auth coming with Supabase integration.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}