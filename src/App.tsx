import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router as WouterRouter, useLocation } from "wouter";

import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSession, clearTokens, type Session } from "@/lib/api/authApi";
import { AdminApiKeysPage } from "@/pages/admin-api-keys";
import { AdminDashboardPage } from "@/pages/admin-dashboard";
import { AdminLogsPage } from "@/pages/admin-logs";
import { AdminPlansPage } from "@/pages/admin-plans";
import { AdminPremiumRequestsPage } from "@/pages/admin-premium-requests";
import { AdminUsersPage } from "@/pages/admin-users";
import { ApiKeysPage } from "@/pages/api-keys";
import { DashboardPage } from "@/pages/dashboard";
import { DocsPage } from "@/pages/docs/docs";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { ForgotPasswordPage } from "@/pages/forgot-password";
import { ResetPasswordPage } from "@/pages/reset-password";
import { NotFound } from "@/pages/not-found";
import { PlaygroundPage } from "@/pages/playground";
import { ProfilePage } from "@/pages/profile";
import { PremiumPage } from "@/pages/premium";
import { UnauthorizedPage } from "@/pages/unauthorized";
import { UsagePage } from "@/pages/usage";
import {
  MarketingAbout,
  MarketingContact,
  MarketingFeatures,
  MarketingHome,
  MarketingPricing,
} from "@/pages/marketing";

const queryClient = new QueryClient();

function AppRouter() {
  const [location, setLocation] = useLocation();
  const [session, setSession] = useState<Session | null>(() => getSession<Session>());

  const handleLogout = () => {
    clearTokens();
    setSession(null);
    setLocation("/login");
  };

  const isApp = location.startsWith("/app/");
  const isAdmin = location.startsWith("/admin/");

  if (location === "/login") {
    return <LoginPage onLogin={(s) => { setSession(s); setLocation(s.role === "admin" ? "/admin/dashboard" : "/app/dashboard"); }} />;
  }
  if (location === "/register") {
    return <RegisterPage onRegister={(s) => { setSession(s); setLocation("/app/dashboard"); }} />;
  }
  if (location === "/forgot-password") return <ForgotPasswordPage />;
  if (location === "/reset-password") return <ResetPasswordPage />;
  if (location === "/") return <MarketingHome />;
  if (location === "/features") return <MarketingFeatures />;
  if (location === "/pricing") return <MarketingPricing />;
  if (location === "/about") return <MarketingAbout />;
  if (location === "/contact") return <MarketingContact />;

  if ((isApp || isAdmin) && !session) {
    return <LoginPage onLogin={(s) => { setSession(s); setLocation(s.role === "admin" ? "/admin/dashboard" : "/app/dashboard"); }} />;
  }
  if ((isApp && session?.role !== "user") || (isAdmin && session?.role !== "admin")) {
    return <UnauthorizedPage onBack={handleLogout} />;
  }

  let page: ReactNode = <NotFound />;
  if (location === "/app/dashboard") page = <DashboardPage />;
  if (location === "/app/api-keys") page = <ApiKeysPage />;
  if (location === "/app/usage") page = <UsagePage />;
  if (location === "/app/docs") page = <DocsPage />;
  if (location === "/app/playground") page = <PlaygroundPage />;
  if (location === "/app/profile") page = <ProfilePage />;
  if (location === "/app/premium") page = <PremiumPage />;
  if (location === "/admin/dashboard") page = <AdminDashboardPage />;
  if (location === "/admin/users") page = <AdminUsersPage />;
  if (location === "/admin/api-keys") page = <AdminApiKeysPage />;
  if (location === "/admin/logs") page = <AdminLogsPage />;
  if (location === "/admin/plans") page = <AdminPlansPage />;
  if (location === "/admin/premium-requests") page = <AdminPremiumRequestsPage />;

  return page;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
