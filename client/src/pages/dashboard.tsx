import Header from "@/components/header";
import TechniciansTable from "@/components/technicians-table";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <TechniciansTable />
      </div>
    </div>
  );
}
