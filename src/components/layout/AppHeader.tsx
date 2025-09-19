import React from "react";
import { Link } from "react-router-dom";
import { Building2, ArrowLeft, Headset } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useAuth } from "../../auth/AuthProvider";
import UserMenu from "./UserMenu";

type AppHeaderProps = {
  /** Page title, e.g., "Underwriting" | "Hotel Consulting" | "Development Roadmap" */
  title: string;
  /** Path for the back link; default /dashboard */
  backTo?: string;
  /** Show "Hotel Consulting (Beta)" pill on the right */
  showConsultingPill?: boolean;
  /** Optional right-side custom node (e.g., user menu). If provided, replaces default user area. */
  rightNode?: React.ReactNode;
};

export default function AppHeader({
  title,
  backTo = "/dashboard",
  showConsultingPill = true,
  rightNode,
}: AppHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        {/* Left: logo + back + title */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-slate-900 font-bold tracking-tight">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg">Hotel Foundry</span>
          </Link>

          {backTo && user && (
            <Link to={backTo}>
              <Button variant="outline" size="sm" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            </Link>
          )}

          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        </div>

        {/* Right: consulting pill + user area or custom node */}
        <div className="flex items-center gap-4">
          {showConsultingPill && (
            <Link to="/consultancy">
              <div className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer">
                <Headset className="h-3 w-3" />
                <span>Hotel Consulting</span>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5">
                  Beta
                </Badge>
              </div>
            </Link>
          )}

          {rightNode ? (
            rightNode
          ) : user ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/signin">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                  Sign in
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}