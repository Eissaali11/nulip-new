import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import StatsCards from "@/components/stats-cards";
import InventoryTable from "@/components/inventory-table";
import Sidebar from "@/components/sidebar";
import { DashboardStats, InventoryItemWithStatus } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard"],
  });

  const { data: inventory, isLoading: inventoryLoading } = useQuery<InventoryItemWithStatus[]>({
    queryKey: ["/api/inventory"],
  });

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <StatsCards stats={stats} isLoading={statsLoading} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <InventoryTable inventory={inventory} isLoading={inventoryLoading} />
          </div>
          
          <div>
            <Sidebar inventory={inventory} />
          </div>
        </div>
      </div>
    </div>
  );
}
