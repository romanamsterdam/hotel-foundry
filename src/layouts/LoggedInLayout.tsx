import { PropsWithChildren } from "react";
import { useLocation } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../auth/AuthProvider";
import AppHeader from "../components/layout/AppHeader";
import AccountMenu from "../components/layout/AccountMenu";

export default function LoggedInLayout({ title, children }: PropsWithChildren<{ title?: string }>) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Determine page title based on pathname
  const getPageTitle = () => {
    if (title) return title;
    if (pathname.startsWith("/underwriting")) return "Underwriting";
    if (pathname.startsWith("/consultancy")) return "Hotel Consulting";
    if (pathname.startsWith("/roadmap")) return "Development Roadmap";
    if (pathname.startsWith("/analysis")) return "Analysis";
    return "Dashboard";
  };

  const pageTitle = getPageTitle();
  const showBackButton = !pathname.startsWith("/dashboard");

  return (
    <div className="min-h-screen [background:var(--page-gradient)]">
      <AppHeader 
        title={pageTitle}
        backTo={showBackButton ? "/dashboard" : undefined}
        showConsultingPill={true}
        rightNode={
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => window.location.href = "/admin"}
                className="flex items-center space-x-2 border-red-300 text-red-700 hover:bg-red-50"
              >
                <Shield className="h-4 w-4" />
                <span>Admin Dashboard</span>
              </Button>
            )}
            <AccountMenu />
          </div>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 relative">{children}</main>
    </div>
  );
}