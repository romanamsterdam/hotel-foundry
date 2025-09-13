import React from "react";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAuth } from "../../auth/AuthProvider";

export default function BillingSuccessPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-green-900">
              Welcome to {user?.tier || "Hotel Foundry"}!
            </CardTitle>
            <p className="text-green-800 mt-2">
              Your subscription has been activated successfully.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-100 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">What's Next?</h3>
              <ul className="space-y-2 text-green-800">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Access the full underwriting platform</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Create your first hotel deal analysis</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Explore property templates and benchmarks</span>
                </li>
                {user?.tier === "Pro" && (
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Book consultancy sessions with experts</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="text-center">
              <Link to="/dashboard">
                <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2">
                  <span>Go to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="text-center">
              <p className="text-xs text-green-700">
                🚧 Mock billing active. Stripe integration coming soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}