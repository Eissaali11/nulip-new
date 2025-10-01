import Header from "@/components/header";
import TechniciansTable from "@/components/technicians-table";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <Header />
      
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6">
        <TechniciansTable />
      </div>
    </div>
  );
}
