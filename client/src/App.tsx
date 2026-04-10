import { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useNavigationTracker } from "@/hooks/use-smart-back";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import { queryClient } from "./lib/queryClient";

const Feed = lazy(() => import("@/pages/feed"));
const Submit = lazy(() => import("@/pages/submit"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const AdminUsersPage = lazy(() => import("@/pages/admin-users"));
const PendingApproval = lazy(() => import("@/pages/pending-approval"));
const AuthPage = lazy(() => import("@/pages/auth"));
const RegisterPage = lazy(() => import("@/pages/register"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const SettingsPage = lazy(() => import("@/pages/settings"));
const NotificationsPage = lazy(() => import("@/pages/notifications"));
const MessagesPage = lazy(() => import("@/pages/messages"));
const SearchPage = lazy(() => import("@/pages/search"));
const PostPage = lazy(() => import("@/pages/post"));

function RouteLoading() {
  return <div className="p-6 text-center">Loading...</div>;
}

function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <RouteLoading />;
  }

  if (!user || !["admin", "superadmin"].includes(user.role)) {
    return <NotFound />;
  }

  return <>{children}</>;
}

function Router() {
  useNavigationTracker();

  return (
    <Suspense fallback={<RouteLoading />}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/feed" component={Feed} />
        <Route path="/auth">
          <AuthPage />
        </Route>
        <Route path="/register">
          <RegisterPage />
        </Route>
        <Route path="/submit" component={Submit} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/profile/:id" component={ProfilePage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/post/:id" component={PostPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/messages" component={MessagesPage} />
        <Route path="/pending-approval" component={PendingApproval} />
        <Route path="/admin">
          <AdminOnlyRoute>
            <AdminDashboard />
          </AdminOnlyRoute>
        </Route>
        <Route path="/admin/users">
          <AdminOnlyRoute>
            <AdminUsersPage />
          </AdminOnlyRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="amanat" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
