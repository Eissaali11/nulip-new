import Header from "@/components/header";
import TechniciansTable from "@/components/technicians-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, TruckIcon, ArrowRight, LayoutDashboard } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <Header />
      
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6 space-y-6">
        {/* Quick Access Cards - Only for non-admin users */}
        {user?.role !== 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-primary" />
                  المخزون الثابت
                </CardTitle>
                <CardDescription>
                  أدخل وأدر المخزون الأساسي لديك (كرتون + مفرد)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/my-fixed-inventory">
                  <Button className="w-full" data-testid="button-go-to-fixed-inventory">
                    الذهاب للمخزون الثابت
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500/20 hover:border-green-500/40 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TruckIcon className="h-5 w-5 text-green-600" />
                  المخزون المتحرك
                </CardTitle>
                <CardDescription>
                  تتبع وحدّث المخزون العملي الذي تستخدمه يومياً
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/my-moving-inventory">
                  <Button className="w-full bg-green-600 hover:bg-green-700" data-testid="button-go-to-moving-inventory">
                    الذهاب للمخزون المتحرك
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Admin Quick Access */}
        {user?.role === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-primary" />
                  المخزون الثابت
                </CardTitle>
                <CardDescription>
                  أدخل وأدر المخزون الأساسي لديك (كرتون + مفرد)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/my-fixed-inventory">
                  <Button className="w-full" data-testid="button-admin-fixed-inventory">
                    الذهاب للمخزون الثابت
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500/20 hover:border-green-500/40 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TruckIcon className="h-5 w-5 text-green-600" />
                  المخزون المتحرك
                </CardTitle>
                <CardDescription>
                  تتبع وحدّث المخزون العملي الذي تستخدمه يومياً
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/my-moving-inventory">
                  <Button className="w-full bg-green-600 hover:bg-green-700" data-testid="button-admin-moving-inventory">
                    الذهاب للمخزون المتحرك
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500/20 hover:border-purple-500/40 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <LayoutDashboard className="h-5 w-5 text-purple-600" />
                  لوحة مخزون الفنيين
                </CardTitle>
                <CardDescription>
                  عرض شامل لمخزون جميع الفنيين مع التنبيهات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin-inventory-overview">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700" data-testid="button-admin-overview">
                    عرض لوحة الفنيين
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Technicians Table */}
        <TechniciansTable />
      </div>
    </div>
  );
}
