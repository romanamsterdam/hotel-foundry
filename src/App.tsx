import React from "react";
import { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useEffect } from "react";
import { useState } from "react";
import { initDataSource } from "./lib/datasource";
import { ToastProvider, Toaster } from "./components/ui/toast";
import { TooltipProvider } from "./components/ui/tooltip";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider } from "./auth/AuthProvider";
import EnvErrorCard from "./components/common/EnvErrorCard";

// Layouts
import LoggedInLayout from "./layouts/LoggedInLayout";
import AdminLayout from "./layouts/AdminLayout";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RequireAdmin from "./components/auth/RequireAdmin";
import ProtectedRoute from "./routes/ProtectedRoute";

// Pages (all must be default exports)
import LandingPage from "./routes/LandingPage";
import SignInPage from "./pages/auth/SignInPage";
import DashboardPage from "./routes/DashboardPage";
import CreateDealPage from "./routes/CreateDealPage";
import UnderwritingHome from "./routes/UnderwritingHome";
import DealWorkspace from "./routes/DealWorkspace";
import PropertiesPage from "./routes/PropertiesPage";
import MembershipPage from "./routes/MembershipPage";
import LegalPrivacyPage from "./routes/LegalPrivacyPage";
import LegalTermsPage from "./routes/LegalTermsPage";
import ChartsKPIsPage from "./pages/ChartsKPIsPage";
import StaffingSenseCheckPage from "./pages/StaffingSenseCheckPage";
import UnderwritingSummaryPage from "./pages/UnderwritingSummaryPage";
import AdminSamplePropertiesPage from "./pages/admin/AdminSamplePropertiesPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminDealsPage from "./pages/admin/AdminDealsPage";
import AdminDealInspectPage from "./pages/admin/AdminDealInspectPage";
import AdminBenchmarksPage from "./pages/admin/AdminBenchmarksPage";
import AdminRoadmapPage from "./pages/admin/AdminRoadmapPage";
import UserRoadmapPage from "./pages/UserRoadmapPage";
import UserRoadmapLanding from "./pages/roadmap/UserRoadmapLanding";
import UserRoadmapPageNew from "./pages/roadmap/UserRoadmapPage";
import ConsultancyRequestPage from "./features/consulting/ConsultancyRequestPage";
import AdminConsultingPage from "./features/consulting/AdminConsultingPage";
import DebugEnv from "./pages/DebugEnv";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { env } from "./lib/env";

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const [envError, setEnvError] = useState<string | null>(null);

  useEffect(() => { 
    initDataSource().catch((error) => {
      if (error.message === "SUPABASE_MISSING_CONFIG") {
        setEnvError("SUPABASE_MISSING_CONFIG");
      } else {
        console.error("DataSource init failed:", error);
      }
    });
  }, []);

  // Show environment error if Supabase config is missing
  if (envError === "SUPABASE_MISSING_CONFIG") {
    return <EnvErrorCard />;
  }

  return (
    <HelmetProvider>
      <ToastProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <ScrollToTop />
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={
                    <PublicLayout>
                      <LandingPage />
                    </PublicLayout>
                  } />
                  <Route path="/properties" element={
                    <PublicLayout>
                      <PropertiesPage />
                    </PublicLayout>
                  } />
                  <Route path="/membership" element={
                    <PublicLayout>
                      <MembershipPage />
                    </PublicLayout>
                  } />
                  <Route path="/legal/privacy" element={
                    <PublicLayout>
                      <LegalPrivacyPage />
                    </PublicLayout>
                  } />
                  <Route path="/legal/terms" element={
                    <PublicLayout>
                      <LegalTermsPage />
                    </PublicLayout>
                  } />
                  <Route path="/signin" element={
                    <PublicLayout>
                      <SignInPage />
                    </PublicLayout>
                  } />

                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={
                      <LoggedInLayout title="Dashboard">
                        <DashboardPage />
                      </LoggedInLayout>
                    } />
                    <Route path="/underwriting" element={
                      <LoggedInLayout title="Underwriting">
                        <UnderwritingHome />
                      </LoggedInLayout>
                    } />
                    <Route path="/underwriting/new" element={
                      <LoggedInLayout title="Create New Deal">
                        <CreateDealPage />
                      </LoggedInLayout>
                    } />
                    <Route path="/underwriting/:id" element={
                      <LoggedInLayout>
                        <DealWorkspace />
                      </LoggedInLayout>
                    } />
                    <Route path="/analysis/charts/:id" element={
                      <LoggedInLayout title="Charts & Key KPIs">
                        <ChartsKPIsPage />
                      </LoggedInLayout>
                    } />
                    <Route path="/analysis/staffing/:id" element={
                      <LoggedInLayout title="Staffing Sense Check">
                        <StaffingSenseCheckPage />
                      </LoggedInLayout>
                    } />
                    <Route path="/underwriting/summary/:id" element={
                      <LoggedInLayout title="Underwriting Summary">
                        <UnderwritingSummaryPage />
                      </LoggedInLayout>
                    } />
                    <Route path="/roadmap/:projectId" element={
                      <LoggedInLayout title="Development Roadmap">
                        <UserRoadmapPageNew mode="project" />
                      </LoggedInLayout>
                    } />
                    <Route path="/consultancy" element={
                      <LoggedInLayout title="Hotel Consulting">
                        <ConsultancyRequestPage />
                      </LoggedInLayout>
                    } />
                    <Route path="/roadmap" element={
                      <LoggedInLayout title="Development Roadmap">
                        <UserRoadmapLanding />
                      </LoggedInLayout>
                    } />
                    <Route path="/roadmap/explore" element={
                      <LoggedInLayout title="Development Roadmap">
                        <UserRoadmapPageNew mode="explore" />
                      </LoggedInLayout>
                    } />
                  </Route>

                  {/* Admin Routes */}
                  <Route path="/admin" element={
                    <RequireAdmin>
                      <AdminLayout />
                    </RequireAdmin>
                  }>
                    <Route index element={<Navigate to="/admin/sample-properties" replace />} />
                    <Route path="sample-properties" element={<AdminSamplePropertiesPage />} />
                    <Route path="benchmarks" element={<AdminBenchmarksPage />} />
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="deals" element={<AdminDealsPage />} />
                    <Route path="deals/:dealId/inspect" element={<AdminDealInspectPage />} />
                    <Route path="roadmap" element={<AdminRoadmapPage />} />
                    <Route path="consulting" element={<AdminConsultingPage />} />
                  </Route>

                  {/* Redirects */}
                  <Route path="/home" element={<Navigate to="/dashboard" replace />} />
                  
                  {/* Billing Redirect */}
                  <Route path="/billing/*" element={<Navigate to="/membership" replace />} />
                  
                  {/* Debug Route */}
                  <Route path="/debug" element={<DebugEnv />} />
                  
                  {/* 404 */}
                  <Route path="*" element={
                    <PublicLayout>
                      <div className="min-h-screen flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-4xl font-bold text-slate-900 mb-4">404 - Page Not Found</h1>
                          <p className="text-slate-600 mb-8">The page you're looking for doesn't exist.</p>
                          <a href="/" className="text-brand-600 hover:text-brand-700 font-medium">
                            Return to Home
                          </a>
                        </div>
                      </div>
                    </PublicLayout>
                  } />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ToastProvider>
    </HelmetProvider>
  );
}

export default App;