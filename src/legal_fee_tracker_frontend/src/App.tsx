import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { SidebarProvider } from "./components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import { MobileNav } from "./components/MobileNav";
import { ThemeToggle } from "./components/ThemeToggle";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import ProfileCreate from "./pages/ProfileCreate";
import Dashboard from "./pages/Dashboard";
import FindLawyer from "./pages/FindLawyer";
import CreateEngagement from "./pages/CreateEngagement";
import EngagementDetail from "./pages/EngagementDetail";
import NotFound from "./pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }
  
  return <Component />;
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <>
      <MobileNav />
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <div className="hidden lg:block">
            <AppSidebar />
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="hidden lg:flex items-center justify-between p-4 border-b">
              <div></div>
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-y-auto p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/onboarding">
        {() => <ProtectedRoute component={Onboarding} />}
      </Route>
      <Route path="/profile/create/:type">
        {() => <ProtectedRoute component={ProfileCreate} />}
      </Route>
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/lawyers">
        {() => <ProtectedRoute component={FindLawyer} />}
      </Route>
      <Route path="/engagement/create">
        {() => <ProtectedRoute component={CreateEngagement} />}
      </Route>
      <Route path="/engagement/:id">
        {() => <ProtectedRoute component={EngagementDetail} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <AuthenticatedLayout>
              <Router />
            </AuthenticatedLayout>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
