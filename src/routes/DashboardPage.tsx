import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const FEATURE_ADMIN = import.meta.env.VITE_FEATURE_ADMIN !== "false";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const isAdmin = !!user && user.role === "admin";

  return (
    <div className="space-y-6">
      {/* Admin Console Link */}
      {FEATURE_ADMIN && isAdmin && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-amber-900">Admin Tools</h3>
                <p className="text-sm text-amber-800">You have administrator access</p>
              </div>
              <Button asChild className="bg-slate-900 hover:bg-slate-800">
                <Link to="/admin">Open Admin Console</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Deals</CardTitle>
          <Button asChild>
            <Link to="/underwriting/new">Create New Deal</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-slate-500">Your deals will be listed here.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Development Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            Start planning your hotel development project from vision to launch.
          </p>
          <Button asChild variant="outline">
            <Link to="/roadmap">Explore Roadmaps</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}