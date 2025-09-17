// src/pages/auth/SignInPage.tsx
import { useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

export default function SignInPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await signIn(email);
    setIsSubmitting(false);
    if (result.ok) {
      setIsSuccess(true);
    } else {
      setError(result.error ?? "An unknown error occurred.");
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-12">
        <h1 className="text-3xl font-bold">Check your email</h1>
        <p className="text-slate-600">
          If your email is registered, you will receive a login link.
        </p>
        <Link to="/" className="text-brand-600 hover:text-brand-700 font-medium text-sm">
          Return to home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto py-12">
      <div className="space-y-3 text-center mb-8">
        <h1 className="text-3xl font-bold">Sign In</h1>
        <p className="text-slate-600">Enter your email to get a magic link.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isSubmitting}
        />
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending Link..." : "Send Magic Link"}
        </Button>
      </form>
    </div>
  );
}