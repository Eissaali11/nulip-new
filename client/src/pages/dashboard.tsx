import TechniciansTable from "@/components/technicians-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import dashboardBg from "@assets/image_1762515061799.png";
import rasscoLogo from "@assets/image_1762442473114.png";
import type { DashboardStats, TechnicianWithFixedInventory, WarehouseWithStats, TechnicianFixedInventory, TechnicianInventory } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Battery,
  Bell,
  CheckCircle,
  ClipboardCheck,
  Database,
  LayoutDashboard,
  LogOut,
  Package,
  Smartphone,
  TrendingUp,
  TruckIcon,
  User,
  UserCircle,
  Users,
  Warehouse,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { CircularProgress } from "@/components/dashboard/CircularProgress";
import { GridBackground } from "@/components/dashboard/GridBackground";
import { Navbar } from "@/components/dashboard/Navbar";
import { InventoryPieCard } from "@/components/dashboard/InventoryPieCard";
import { InventoryBarCard } from "@/components/dashboard/InventoryBarCard";

interface WarehouseTransfer {
  id: string;
  technicianId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: pendingTransfers = [] } = useQuery<WarehouseTransfer[]>({
    queryKey: ["/api/warehouse-transfers", user?.id],
    enabled: !!user?.id && user?.role !== 'admin',
    select: (data) => data.filter(t => t.status === 'pending' && t.technicianId === user?.id),
  });

  const { data: dashboardStats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard"],
  });

  const { data: techniciansData } = useQuery<{ technicians: TechnicianWithFixedInventory[] }>({
    queryKey: ["/api/admin/all-technicians-inventory"],
    enabled: user?.role === 'admin',
  });

  const { data: warehousesData } = useQuery<WarehouseWithStats[]>({
    queryKey: ["/api/warehouses"],
    enabled: user?.role === 'admin',
  });

  const { data: myFixedInventory } = useQuery<TechnicianFixedInventory>({
    queryKey: ["/api/my-fixed-inventory"],
    enabled: !!user?.id,
  });

  const { data: myMovingInventory } = useQuery<TechnicianInventory>({
    queryKey: ["/api/my-moving-inventory"],
    enabled: !!user?.id,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  // حساب إجمالي المخزون الثابت
  const getFixedInventoryTotal = () => {
    if (!myFixedInventory) return 0;
    const inv = myFixedInventory;
    return (
      (inv.n950Boxes || 0) + (inv.n950Units || 0) +
      (inv.i9000sBoxes || 0) + (inv.i9000sUnits || 0) +
      (inv.i9100Boxes || 0) + (inv.i9100Units || 0) +
      (inv.rollPaperBoxes || 0) + (inv.rollPaperUnits || 0) +
      (inv.stickersBoxes || 0) + (inv.stickersUnits || 0) +
      (inv.newBatteriesBoxes || 0) + (inv.newBatteriesUnits || 0) +
      (inv.mobilySimBoxes || 0) + (inv.mobilySimUnits || 0) +
      (inv.stcSimBoxes || 0) + (inv.stcSimUnits || 0) +
      (inv.zainSimBoxes || 0) + (inv.zainSimUnits || 0)
    );
  };

  // حساب إجمالي المخزون المتحرك
  const getMovingInventoryTotal = () => {
    if (!myMovingInventory) return 0;
    const inv = myMovingInventory;
    return (
      (inv.n950Boxes || 0) + (inv.n950Units || 0) +
      (inv.i9000sBoxes || 0) + (inv.i9000sUnits || 0) +
      (inv.i9100Boxes || 0) + (inv.i9100Units || 0) +
      (inv.rollPaperBoxes || 0) + (inv.rollPaperUnits || 0) +
      (inv.stickersBoxes || 0) + (inv.stickersUnits || 0) +
      (inv.newBatteriesBoxes || 0) + (inv.newBatteriesUnits || 0) +
      (inv.mobilySimBoxes || 0) + (inv.mobilySimUnits || 0) +
      (inv.stcSimBoxes || 0) + (inv.stcSimUnits || 0) +
      (inv.zainSimBoxes || 0) + (inv.zainSimUnits || 0)
    );
  };

  // حساب كفاءة الفنيين
  const getTechnicianEfficiency = (tech: TechnicianWithFixedInventory) => {
    if (!tech.fixedInventory) return 0;
    const totalItems =
      (tech.fixedInventory.n950Boxes || 0) + (tech.fixedInventory.n950Units || 0) +
      (tech.fixedInventory.i9000sBoxes || 0) + (tech.fixedInventory.i9000sUnits || 0) +
      (tech.fixedInventory.i9100Boxes || 0) + (tech.fixedInventory.i9100Units || 0) +
      (tech.fixedInventory.rollPaperBoxes || 0) + (tech.fixedInventory.rollPaperUnits || 0) +
      (tech.fixedInventory.stickersBoxes || 0) + (tech.fixedInventory.stickersUnits || 0) +
      (tech.fixedInventory.newBatteriesBoxes || 0) + (tech.fixedInventory.newBatteriesUnits || 0) +
      (tech.fixedInventory.mobilySimBoxes || 0) + (tech.fixedInventory.mobilySimUnits || 0) +
      (tech.fixedInventory.stcSimBoxes || 0) + (tech.fixedInventory.stcSimUnits || 0) +
      (tech.fixedInventory.zainSimBoxes || 0) + (tech.fixedInventory.zainSimUnits || 0);

    const threshold = tech.fixedInventory.criticalStockThreshold || 100;
    return Math.min(100, Math.round((totalItems / threshold) * 100));
  };

  // حساب الكفاءة العامة
  const globalEfficiency = techniciansData?.technicians
    ? Math.round(
      techniciansData.technicians.reduce((sum, tech) => sum + getTechnicianEfficiency(tech), 0) /
      techniciansData.technicians.length
    )
    : 0;

  // حساب إجمالي وحدات المستودع
  const getWarehouseTotalUnits = (warehouse: WarehouseWithStats) => {
    if (!warehouse.inventory) return 0;
    const inv = warehouse.inventory;
    return (
      (inv.n950Boxes || 0) + (inv.n950Units || 0) +
      (inv.i9000sBoxes || 0) + (inv.i9000sUnits || 0) +
      (inv.i9100Boxes || 0) + (inv.i9100Units || 0) +
      (inv.rollPaperBoxes || 0) + (inv.rollPaperUnits || 0) +
      (inv.stickersBoxes || 0) + (inv.stickersUnits || 0) +
      (inv.newBatteriesBoxes || 0) + (inv.newBatteriesUnits || 0) +
      (inv.mobilySimBoxes || 0) + (inv.mobilySimUnits || 0) +
      (inv.stcSimBoxes || 0) + (inv.stcSimUnits || 0) +
      (inv.zainSimBoxes || 0) + (inv.zainSimUnits || 0)
    );
  };


  return (
    <div
      className="min-h-screen text-white overflow-hidden relative"
      dir="rtl"
      style={{
        backgroundImage: `url(${dashboardBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/90 via-[#050508]/85 to-[#050508]/90 backdrop-blur-[2px] z-0" />
      <GridBackground />

      {/* Header */}
      <div className="relative z-10 border-b border-[#18B2B0]/20 bg-gradient-to-r from-[#0a0a0f]/90 via-[#0f0f15]/90 to-[#0a0a0f]/90 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className="relative p-3 bg-gradient-to-br from-[#18B2B0] to-[#0ea5a3] rounded-lg"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(24, 178, 176, 0.3)",
                    "0 0 40px rgba(24, 178, 176, 0.5)",
                    "0 0 20px rgba(24, 178, 176, 0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <img src={rasscoLogo} alt="RASSCO" className="h-8 w-auto" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#18B2B0] via-[#0ea5a3] to-[#18B2B0] bg-clip-text text-transparent">
                  STOCKPRO نظام إدارة المخزون
                </h1>
                <p className="text-xs text-gray-400 font-mono">
                  {currentTime.toLocaleTimeString('ar-SA', { hour12: false })} • النظام متصل
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 transition-all border border-[#18B2B0]/20"
                  whileHover={{ scale: 1.05, borderColor: "rgba(24, 178, 176, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  data-testid="button-user-avatar"
                >
                  <UserCircle className="h-5 w-5 text-[#18B2B0]" />
                  <div className="hidden sm:block text-right">
                    <p className="text-white font-semibold text-sm">{user?.fullName}</p>
                    <p className="text-gray-400 text-xs">
                      {user?.role === 'admin' ? 'مدير' : 'فني'}
                    </p>
                  </div>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#0f0f15] border-[#18B2B0]/20 backdrop-blur-xl" align="start">
                <DropdownMenuLabel className="text-white">الحساب</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#18B2B0]/20" />
                <DropdownMenuItem className="cursor-default focus:bg-white/5">
                  <div className="flex items-center gap-2 w-full">
                    <User className="h-4 w-4 text-[#18B2B0]" />
                    <div className="flex-1 text-right">
                      <p className="text-sm font-medium text-white">{user?.fullName}</p>
                      <p className="text-xs text-gray-400">@{user?.username}</p>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-right focus:bg-red-500/20 text-red-400"
                  onClick={handleLogout}
                  data-testid="dropdown-logout"
                >
                  <div className="flex items-center gap-2 w-full justify-end">
                    <span className="font-medium">تسجيل الخروج</span>
                    <LogOut className="h-4 w-4" />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white via-[#18B2B0] to-white bg-clip-text text-transparent">
            مرحباً بك، {user?.fullName}
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">
            {user?.role === 'admin' ? 'لوحة التحكم الإدارية' : 'لوحة التحكم الشخصية'}
          </p>
        </motion.div>

        {/* نظرة عامة على النظام */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl rounded-3xl border border-[#18B2B0]/30 p-8 overflow-hidden shadow-2xl mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/10 to-transparent" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Activity className="h-6 w-6 text-[#18B2B0]" />
                <h2 className="text-2xl font-bold text-white">نظرة عامة على النظام</h2>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full ml-2 animate-pulse" />
                يعمل
              </Badge>
            </div>

            {/* الدوائر الرئيسية - مع padding أكبر */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 justify-items-center mb-8">
              <div className="flex flex-col items-center p-4">
                <CircularProgress
                  percentage={globalEfficiency || 85}
                  label="الكفاءة"
                  value={`${globalEfficiency || 85}%`}
                  color="#18B2B0"
                  size={140}
                />
              </div>

              <div className="flex flex-col items-center p-4">
                <CircularProgress
                  percentage={dashboardStats ? Math.min(100, (dashboardStats.totalItems / 10000) * 100) : 70}
                  label="السعة"
                  value={dashboardStats ? `${dashboardStats.totalItems}` : "0"}
                  color="#0ea5a3"
                  size={140}
                />
              </div>

              <div className="flex flex-col items-center p-4">
                <CircularProgress
                  percentage={dashboardStats && dashboardStats.totalItems > 0
                    ? 100 - ((dashboardStats.outOfStockItems / dashboardStats.totalItems) * 100)
                    : 90}
                  label="التوفر"
                  value={dashboardStats ? `${100 - Math.round((dashboardStats.outOfStockItems / (dashboardStats.totalItems || 1)) * 100)}%` : "90%"}
                  color="#10b981"
                  size={140}
                />
              </div>

              <div className="flex flex-col items-center p-4">
                <CircularProgress
                  percentage={95}
                  label="الجودة"
                  value="95%"
                  color="#f59e0b"
                  size={140}
                />
              </div>
            </div>

            {/* Stats Bar */}
            {dashboardStats && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                <div className="bg-gradient-to-br from-[#18B2B0]/10 to-transparent border border-[#18B2B0]/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-[#18B2B0]" />
                    <p className="text-xs text-gray-400">إجمالي الأصناف</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{dashboardStats.totalItems.toLocaleString()}</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                    <p className="text-xs text-gray-400">مخزون منخفض</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-400">{dashboardStats.lowStockItems}</p>
                </div>

                <div className="bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-red-400" />
                    <p className="text-xs text-gray-400">نفد المخزون</p>
                  </div>
                  <p className="text-2xl font-bold text-red-400">{dashboardStats.outOfStockItems}</p>
                </div>

                <div className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <p className="text-xs text-gray-400">اليوم</p>
                  </div>
                  <p className="text-2xl font-bold text-green-400">{dashboardStats.todayTransactions}</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* مخزوني الشخصي - للفني */}
        {user?.role !== 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          >
            {/* المخزون الثابت */}
            <div className="relative bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl rounded-3xl border border-[#18B2B0]/30 p-8 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/10 to-transparent" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Package className="h-6 w-6 text-[#18B2B0]" />
                    <h3 className="text-xl font-bold text-white">المخزون الثابت</h3>
                  </div>
                  <Link href="/my-fixed-inventory">
                    <Button size="sm" className="bg-[#18B2B0] hover:bg-[#159a98]">
                      عرض التفاصيل
                      <ArrowRight className="mr-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <div className="flex justify-center py-8">
                  <CircularProgress
                    percentage={myFixedInventory ? Math.min(100, (getFixedInventoryTotal() / 500) * 100) : 0}
                    label="إجمالي الوحدات"
                    value={getFixedInventoryTotal().toString()}
                    color="#18B2B0"
                    size={180}
                  />
                </div>

                {myFixedInventory && (
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Smartphone className="h-4 w-4 text-blue-400" />
                        <p className="text-xs text-gray-400">أجهزة POS</p>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {(myFixedInventory.n950Boxes || 0) + (myFixedInventory.n950Units || 0) +
                         (myFixedInventory.i9000sBoxes || 0) + (myFixedInventory.i9000sUnits || 0) +
                         (myFixedInventory.i9100Boxes || 0) + (myFixedInventory.i9100Units || 0)}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-purple-400" />
                        <p className="text-xs text-gray-400">شرائح SIM</p>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {(myFixedInventory.mobilySimBoxes || 0) + (myFixedInventory.mobilySimUnits || 0) +
                         (myFixedInventory.stcSimBoxes || 0) + (myFixedInventory.stcSimUnits || 0) +
                         (myFixedInventory.zainSimBoxes || 0) + (myFixedInventory.zainSimUnits || 0)}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-4 w-4 text-green-400" />
                        <p className="text-xs text-gray-400">مستلزمات</p>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {(myFixedInventory.rollPaperBoxes || 0) + (myFixedInventory.rollPaperUnits || 0) +
                         (myFixedInventory.stickersBoxes || 0) + (myFixedInventory.stickersUnits || 0)}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Battery className="h-4 w-4 text-yellow-400" />
                        <p className="text-xs text-gray-400">بطاريات</p>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {(myFixedInventory.newBatteriesBoxes || 0) + (myFixedInventory.newBatteriesUnits || 0)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* المخزون المتحرك */}
            <div className="relative bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl rounded-3xl border border-emerald-500/30 p-8 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <TruckIcon className="h-6 w-6 text-emerald-500" />
                    <h3 className="text-xl font-bold text-white">المخزون المتحرك</h3>
                  </div>
                  <Link href="/my-moving-inventory">
                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                      عرض التفاصيل
                      <ArrowRight className="mr-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <div className="flex justify-center py-8">
                  <CircularProgress
                    percentage={myMovingInventory ? Math.min(100, (getMovingInventoryTotal() / 200) * 100) : 0}
                    label="إجمالي الوحدات"
                    value={getMovingInventoryTotal().toString()}
                    color="#10b981"
                    size={180}
                  />
                </div>

                {myMovingInventory && (
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Smartphone className="h-4 w-4 text-emerald-400" />
                        <p className="text-xs text-gray-400">أجهزة POS</p>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {(myMovingInventory.n950Boxes || 0) + (myMovingInventory.n950Units || 0) +
                         (myMovingInventory.i9000sBoxes || 0) + (myMovingInventory.i9000sUnits || 0) +
                         (myMovingInventory.i9100Boxes || 0) + (myMovingInventory.i9100Units || 0)}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-teal-400" />
                        <p className="text-xs text-gray-400">شرائح SIM</p>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {(myMovingInventory.mobilySimBoxes || 0) + (myMovingInventory.mobilySimUnits || 0) +
                         (myMovingInventory.stcSimBoxes || 0) + (myMovingInventory.stcSimUnits || 0) +
                         (myMovingInventory.zainSimBoxes || 0) + (myMovingInventory.zainSimUnits || 0)}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-4 w-4 text-cyan-400" />
                        <p className="text-xs text-gray-400">مستلزمات</p>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {(myMovingInventory.rollPaperBoxes || 0) + (myMovingInventory.rollPaperUnits || 0) +
                         (myMovingInventory.stickersBoxes || 0) + (myMovingInventory.stickersUnits || 0)}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-lime-500/10 to-transparent border border-lime-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Battery className="h-4 w-4 text-lime-400" />
                        <p className="text-xs text-gray-400">بطاريات</p>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {(myMovingInventory.newBatteriesBoxes || 0) + (myMovingInventory.newBatteriesUnits || 0)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* المستودعات - للأدمن فقط */}
        {user?.role === 'admin' && warehousesData && warehousesData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl rounded-3xl border border-orange-500/30 p-8 overflow-hidden shadow-2xl mb-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Warehouse className="h-6 w-6 text-orange-500" />
                  <h2 className="text-2xl font-bold text-white">المستودعات</h2>
                </div>
                <Link href="/warehouses">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    إدارة المستودعات
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
                {warehousesData.slice(0, 4).map((warehouse, index) => (
                  <div key={warehouse.id} className="flex flex-col items-center p-4">
                    <CircularProgress
                      percentage={Math.min(100, (getWarehouseTotalUnits(warehouse) / 1000) * 100)}
                      label={warehouse.name}
                      value={getWarehouseTotalUnits(warehouse).toString()}
                      color={index === 0 ? "#f97316" : index === 1 ? "#fb923c" : index === 2 ? "#fdba74" : "#fed7aa"}
                      size={140}
                    />
                    {warehouse.lowStockItemsCount > 0 && (
                      <Badge className="mt-3 bg-red-500/20 text-red-400 border-red-500/30">
                        <AlertTriangle className="h-3 w-3 ml-1" />
                        {warehouse.lowStockItemsCount} منخفض
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Analytics Dashboard - Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <InventoryPieCard 
            fixedTotal={getFixedInventoryTotal()}
            movingTotal={getMovingInventoryTotal()}
          />
          <InventoryBarCard
            fixedInventory={myFixedInventory}
            movingInventory={myMovingInventory}
            title="تفاصيل المخزون حسب الفئة"
          />
        </div>

        {/* Technicians Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Card className="border-2 border-[#18B2B0]/30 bg-white/5 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl text-white">
                <motion.div 
                  className="p-3 bg-gradient-to-br from-[#18B2B0] to-[#0ea5a3] rounded-2xl shadow-lg"
                  animate={{ rotate: [0, 5, 0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Users className="h-7 w-7 text-white drop-shadow-md" />
                </motion.div>
                <span className="font-black">جدول الفنيين</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TechniciansTable />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
