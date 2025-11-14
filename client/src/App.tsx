import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { LanguageProvider } from "@/lib/language";
import LandingPage from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import AdminPage from "@/pages/admin";
import { TransactionHistoryPage } from "@/pages/transaction-history";
import WithdrawnDevicesPage from "@/pages/withdrawn-devices";
import ReceivedDevicesSubmit from "@/pages/ReceivedDevicesSubmit";
import ReceivedDevicesReview from "@/pages/ReceivedDevicesReview";
import ReceivedDeviceDetails from "@/pages/ReceivedDeviceDetails";
import UsersPage from "@/pages/users";
import FixedInventoryDashboard from "@/pages/fixed-inventory-dashboard";
import MyFixedInventory from "@/pages/my-fixed-inventory";
import MyMovingInventory from "@/pages/my-moving-inventory";
import AdminInventoryOverview from "@/pages/admin-inventory-overview";
import WarehousesPage from "@/pages/warehouses";
import WarehouseDetailsPage from "@/pages/warehouse-details";
import TransferDetailsPage from "@/pages/transfer-details";
import OperationsPage from "@/pages/operations";
import OperationDetailsPage from "@/pages/operation-details";
import NotificationsPage from "@/pages/notifications";
import ProfilePage from "@/pages/profile";
import TechnicianDetailsPage from "@/pages/technician-details";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import { Loader2 } from "lucide-react";
import { hasRoleOrAbove, ROLES } from "@shared/roles";
import { useEffect } from "react";

function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  
  return null;
}

function AuthenticatedRouter() {
  const { user } = useAuth();
  
  // Show appropriate routes based on user role
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/home" />} />
      <Route path="/stock" component={LandingPage} />
      <Route path="/home" component={Dashboard} />
      <Route path="/transactions" component={TransactionHistoryPage} />
      <Route path="/withdrawn-devices" component={WithdrawnDevicesPage} />
      <Route path="/received-devices/submit" component={ReceivedDevicesSubmit} />
      <Route path="/received-devices/review" component={ReceivedDevicesReview} />
      <Route path="/received-devices/:id" component={ReceivedDeviceDetails} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/technician-details/:id" component={TechnicianDetailsPage} />
      {user?.role === "technician" && (
        <>
          <Route path="/my-fixed-inventory" component={MyFixedInventory} />
          <Route path="/my-moving-inventory" component={MyMovingInventory} />
        </>
      )}
      {hasRoleOrAbove(user?.role || '', ROLES.SUPERVISOR) && (
        <>
          <Route path="/admin-inventory-overview" component={AdminInventoryOverview} />
          <Route path="/warehouses" component={WarehousesPage} />
          <Route path="/warehouses/:id" component={WarehouseDetailsPage} />
          <Route path="/transfer-details/:id" component={TransferDetailsPage} />
          <Route path="/operations" component={OperationsPage} />
          <Route path="/operation-details/:groupId" component={OperationDetailsPage} />
        </>
      )}
      {user?.role === "admin" && (
        <>
          <Route path="/admin" component={AdminPage} />
          <Route path="/users" component={UsersPage} />
          <Route path="/fixed-inventory" component={FixedInventoryDashboard} />
        </>
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
    return (
      <Switch>
        <Route path="/" component={() => <Redirect to="/login" />} />
        <Route path="/stock" component={LandingPage} />
        <Route path="/login" component={Login} />
        <Route component={() => <Redirect to="/login" />} />
      </Switch>
    );
  }
  
  return <AuthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
