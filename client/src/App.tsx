import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import Dashboard from "@/pages/dashboard";
import AdminPage from "@/pages/admin";
import { TransactionHistoryPage } from "@/pages/transaction-history";
import WithdrawnDevicesPage from "@/pages/withdrawn-devices";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import { Loader2 } from "lucide-react";

function AuthenticatedRouter() {
  const { user } = useAuth();
  
  // Show appropriate routes based on user role
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/transactions" component={TransactionHistoryPage} />
      <Route path="/withdrawn-devices" component={WithdrawnDevicesPage} />
      {user?.role === "admin" && (
        <Route path="/admin" component={AdminPage} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>جاري التحميل...</span>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Login />;
  }
  
  return <AuthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
