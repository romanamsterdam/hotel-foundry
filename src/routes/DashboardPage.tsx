// src/routes/DashboardPage.tsx
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
// import DealList from "../components/DealList"; // REMOVE THIS LINE
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Admin Console Link */}
      {user?.role === 'admin' && (
        <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-md">
          <p className="font-bold">Admin View</p>
          <p>You are signed in as an administrator. <Link to="/admin" className="underline hover:text-yellow-900">Go to Admin Console</Link>.</p>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Deals</CardTitle>
          <Button asChild>
            <Link to="/underwriting/new">Create New Deal</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {/* REPLACE <DealList /> WITH THIS PLACEHOLDER */}
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