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
import type { TechnicianWithBothInventories, WarehouseWithStats, TechnicianFixedInventory, TechnicianInventory } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Battery,
  Bell,
  CheckCircle,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Package,
  Smartphone,
  TruckIcon,
  User,
  UserCircle,
  Users,
  Warehouse
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { CircularProgress } from "@/components/dashboard/CircularProgress";
import { GridBackground } from "@/components/dashboard/GridBackground";
import { Navbar } from "@/components/dashboard/Navbar";
import { InventoryPieCard } from "@/components/dashboard/InventoryPieCard";
import { InventoryBarCard } from "@/components/dashboard/InventoryBarCard";
import { TechnicianDashboardCard } from "@/components/dashboard/TechnicianDashboardCard";
import { WarehouseDashboardCard } from "@/components/dashboard/WarehouseDashboardCard";
import { ProductCard } from "@/components/dashboard/ProductCard";
import RequestInventoryModal from "@/components/request-inventory-modal";
import { CreditCard, FileText, Sticker } from "lucide-react";

interface WarehouseTransfer {
  id: string;
  technicianId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showRequestInventoryModal, setShowRequestInventoryModal] = useState(false);

  const { data: pendingTransfers = [] } = useQuery<WarehouseTransfer[]>({
    queryKey: ["/api/warehouse-transfers"],
    enabled: !!user?.id && user?.role !== 'admin',
    select: (data) => data.filter(t => t.status === 'pending'),
  });

  const { data: techniciansData } = useQuery<{ technicians: TechnicianWithBothInventories[] }>({
    queryKey: ["/api/admin/all-technicians-inventory"],
    enabled: user?.role === 'admin',
  });

  const { data: warehousesData } = useQuery<WarehouseWithStats[]>({
    queryKey: ["/api/warehouses"],
    enabled: user?.role === 'admin',
  });

  const { data: myFixedInventory = null, isLoading: fixedLoading } = useQuery<TechnicianFixedInventory | null>({
    queryKey: ["/api/my-fixed-inventory"],
    enabled: !!user?.id,
  });

  const { data: myMovingInventory = null, isLoading: movingLoading } = useQuery<TechnicianInventory | null>({
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
    // إذا كان المستخدم Admin، احسب إجمالي المخزون الثابت لجميع الفنيين
    if (user?.role === 'admin' && techniciansData?.technicians) {
      return techniciansData.technicians.reduce((total, tech) => {
        if (!tech.fixedInventory) return total;
        const inv = tech.fixedInventory;
        return total + (
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
      }, 0);
    }
    
    // للفنيين، احسب المخزون الشخصي
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
    // إذا كان المستخدم Admin، احسب إجمالي المخزون المتحرك لجميع الفنيين
    if (user?.role === 'admin' && techniciansData?.technicians) {
      return techniciansData.technicians.reduce((total, tech) => {
        if (!tech.movingInventory) return total;
        const inv = tech.movingInventory;
        return total + (
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
      }, 0);
    }
    
    // للفنيين، احسب المخزون الشخصي
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

  // إنشاء object مجمّع لجميع المخزون الثابت (للأدمن) - مع memoization
  const aggregatedFixedInventory = useMemo(() => {
    if (user?.role === 'admin' && techniciansData?.technicians) {
      return techniciansData.technicians.reduce((agg, tech) => {
        if (!tech.fixedInventory) return agg;
        const inv = tech.fixedInventory;
        return {
          n950Boxes: (agg.n950Boxes || 0) + (inv.n950Boxes || 0),
          n950Units: (agg.n950Units || 0) + (inv.n950Units || 0),
          i9000sBoxes: (agg.i9000sBoxes || 0) + (inv.i9000sBoxes || 0),
          i9000sUnits: (agg.i9000sUnits || 0) + (inv.i9000sUnits || 0),
          i9100Boxes: (agg.i9100Boxes || 0) + (inv.i9100Boxes || 0),
          i9100Units: (agg.i9100Units || 0) + (inv.i9100Units || 0),
          rollPaperBoxes: (agg.rollPaperBoxes || 0) + (inv.rollPaperBoxes || 0),
          rollPaperUnits: (agg.rollPaperUnits || 0) + (inv.rollPaperUnits || 0),
          stickersBoxes: (agg.stickersBoxes || 0) + (inv.stickersBoxes || 0),
          stickersUnits: (agg.stickersUnits || 0) + (inv.stickersUnits || 0),
          newBatteriesBoxes: (agg.newBatteriesBoxes || 0) + (inv.newBatteriesBoxes || 0),
          newBatteriesUnits: (agg.newBatteriesUnits || 0) + (inv.newBatteriesUnits || 0),
          mobilySimBoxes: (agg.mobilySimBoxes || 0) + (inv.mobilySimBoxes || 0),
          mobilySimUnits: (agg.mobilySimUnits || 0) + (inv.mobilySimUnits || 0),
          stcSimBoxes: (agg.stcSimBoxes || 0) + (inv.stcSimBoxes || 0),
          stcSimUnits: (agg.stcSimUnits || 0) + (inv.stcSimUnits || 0),
          zainSimBoxes: (agg.zainSimBoxes || 0) + (inv.zainSimBoxes || 0),
          zainSimUnits: (agg.zainSimUnits || 0) + (inv.zainSimUnits || 0),
        } as Partial<TechnicianFixedInventory>;
      }, {} as Partial<TechnicianFixedInventory>);
    }
    return myFixedInventory;
  }, [user?.role, techniciansData?.technicians, myFixedInventory]);

  // إنشاء object مجمّع لجميع المخزون المتحرك (للأدمن) - مع memoization
  const aggregatedMovingInventory = useMemo(() => {
    if (user?.role === 'admin' && techniciansData?.technicians) {
      return techniciansData.technicians.reduce((agg, tech) => {
        if (!tech.movingInventory) return agg;
        const inv = tech.movingInventory;
        return {
          n950Boxes: (agg.n950Boxes || 0) + (inv.n950Boxes || 0),
          n950Units: (agg.n950Units || 0) + (inv.n950Units || 0),
          i9000sBoxes: (agg.i9000sBoxes || 0) + (inv.i9000sBoxes || 0),
          i9000sUnits: (agg.i9000sUnits || 0) + (inv.i9000sUnits || 0),
          i9100Boxes: (agg.i9100Boxes || 0) + (inv.i9100Boxes || 0),
          i9100Units: (agg.i9100Units || 0) + (inv.i9100Units || 0),
          rollPaperBoxes: (agg.rollPaperBoxes || 0) + (inv.rollPaperBoxes || 0),
          rollPaperUnits: (agg.rollPaperUnits || 0) + (inv.rollPaperUnits || 0),
          stickersBoxes: (agg.stickersBoxes || 0) + (inv.stickersBoxes || 0),
          stickersUnits: (agg.stickersUnits || 0) + (inv.stickersUnits || 0),
          newBatteriesBoxes: (agg.newBatteriesBoxes || 0) + (inv.newBatteriesBoxes || 0),
          newBatteriesUnits: (agg.newBatteriesUnits || 0) + (inv.newBatteriesUnits || 0),
          mobilySimBoxes: (agg.mobilySimBoxes || 0) + (inv.mobilySimBoxes || 0),
          mobilySimUnits: (agg.mobilySimUnits || 0) + (inv.mobilySimUnits || 0),
          stcSimBoxes: (agg.stcSimBoxes || 0) + (inv.stcSimBoxes || 0),
          stcSimUnits: (agg.stcSimUnits || 0) + (inv.stcSimUnits || 0),
          zainSimBoxes: (agg.zainSimBoxes || 0) + (inv.zainSimBoxes || 0),
          zainSimUnits: (agg.zainSimUnits || 0) + (inv.zainSimUnits || 0),
        } as Partial<TechnicianInventory>;
      }, {} as Partial<TechnicianInventory>);
    }
    return myMovingInventory;
  }, [user?.role, techniciansData?.technicians, myMovingInventory]);

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
          
          {/* زر طلب مخزون للفنيين فقط */}
          {user?.role !== 'admin' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6"
            >
              <Button
                onClick={() => setShowRequestInventoryModal(true)}
                className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600 text-white px-8 py-6 text-lg shadow-lg shadow-[#18B2B0]/20"
                data-testid="button-request-inventory"
              >
                <Package className="h-5 w-5 ml-2" />
                طلب مخزون
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* مخزوني الشخصي - للفني */}
        {user?.role === 'technician' && (
          <>
            {/* المخزون الثابت */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="relative bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl rounded-3xl border border-[#18B2B0]/30 p-8 overflow-hidden shadow-2xl mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/10 to-transparent" />
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ rotate: [0, 5, 0, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="p-4 bg-gradient-to-br from-[#18B2B0] to-teal-600 rounded-2xl shadow-lg"
                    >
                      <Package className="h-8 w-8 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">المخزون الثابت</h3>
                      <p className="text-gray-400 text-sm">جميع المنتجات المخزنة بشكل دائم</p>
                    </div>
                  </div>
                  <Link href="/my-fixed-inventory">
                    <Button size="lg" className="bg-[#18B2B0] hover:bg-[#159a98] shadow-lg">
                      عرض التفاصيل الكاملة
                      <ArrowRight className="mr-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {fixedLoading ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#18B2B0]"></div>
                  <p className="text-gray-400 text-sm mt-4">جاري تحميل المنتجات...</p>
                </div>
              ) : myFixedInventory && getFixedInventoryTotal() > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <ProductCard
                    icon={<Smartphone className="h-6 w-6" />}
                    title="جهاز N950"
                    boxes={myFixedInventory.n950Boxes || 0}
                    units={myFixedInventory.n950Units || 0}
                    color="#3b82f6"
                    gradient="from-blue-500/20 via-blue-600/10 to-transparent"
                    index={0}
                  />
                  <ProductCard
                    icon={<Smartphone className="h-6 w-6" />}
                    title="جهاز i9000S"
                    boxes={myFixedInventory.i9000sBoxes || 0}
                    units={myFixedInventory.i9000sUnits || 0}
                    color="#8b5cf6"
                    gradient="from-violet-500/20 via-violet-600/10 to-transparent"
                    index={1}
                  />
                  <ProductCard
                    icon={<Smartphone className="h-6 w-6" />}
                    title="جهاز i9100"
                    boxes={myFixedInventory.i9100Boxes || 0}
                    units={myFixedInventory.i9100Units || 0}
                    color="#06b6d4"
                    gradient="from-cyan-500/20 via-cyan-600/10 to-transparent"
                    index={2}
                  />
                  <ProductCard
                    icon={<FileText className="h-6 w-6" />}
                    title="ورق حراري"
                    boxes={myFixedInventory.rollPaperBoxes || 0}
                    units={myFixedInventory.rollPaperUnits || 0}
                    color="#10b981"
                    gradient="from-emerald-500/20 via-emerald-600/10 to-transparent"
                    index={3}
                  />
                  <ProductCard
                    icon={<Sticker className="h-6 w-6" />}
                    title="ملصقات"
                    boxes={myFixedInventory.stickersBoxes || 0}
                    units={myFixedInventory.stickersUnits || 0}
                    color="#f59e0b"
                    gradient="from-amber-500/20 via-amber-600/10 to-transparent"
                    index={4}
                  />
                  <ProductCard
                    icon={<Battery className="h-6 w-6" />}
                    title="بطاريات جديدة"
                    boxes={myFixedInventory.newBatteriesBoxes || 0}
                    units={myFixedInventory.newBatteriesUnits || 0}
                    color="#eab308"
                    gradient="from-yellow-500/20 via-yellow-600/10 to-transparent"
                    index={5}
                  />
                  <ProductCard
                    icon={<CreditCard className="h-6 w-6" />}
                    title="شريحة موبايلي"
                    boxes={myFixedInventory.mobilySimBoxes || 0}
                    units={myFixedInventory.mobilySimUnits || 0}
                    color="#22c55e"
                    gradient="from-green-500/20 via-green-600/10 to-transparent"
                    index={6}
                  />
                  <ProductCard
                    icon={<CreditCard className="h-6 w-6" />}
                    title="شريحة STC"
                    boxes={myFixedInventory.stcSimBoxes || 0}
                    units={myFixedInventory.stcSimUnits || 0}
                    color="#a855f7"
                    gradient="from-purple-500/20 via-purple-600/10 to-transparent"
                    index={7}
                  />
                  <ProductCard
                    icon={<CreditCard className="h-6 w-6" />}
                    title="شريحة زين"
                    boxes={myFixedInventory.zainSimBoxes || 0}
                    units={myFixedInventory.zainSimUnits || 0}
                    color="#ec4899"
                    gradient="from-pink-500/20 via-pink-600/10 to-transparent"
                    index={8}
                  />
                </div>
              ) : (
                <div className="text-center py-16 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10">
                  <Package className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg font-medium">لا يوجد مخزون ثابت حالياً</p>
                  <p className="text-gray-500 text-sm mt-2">يمكنك طلب مخزون جديد من خلال زر "طلب مخزون" أعلاه</p>
                </div>
              )}
            </motion.div>

            {/* المخزون المتحرك */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <div className="relative bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl rounded-3xl border border-emerald-500/30 p-8 overflow-hidden shadow-2xl mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ rotate: [0, 5, 0, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                      className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg"
                    >
                      <TruckIcon className="h-8 w-8 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">المخزون المتحرك</h3>
                      <p className="text-gray-400 text-sm">المنتجات الجاهزة للعمليات الميدانية</p>
                    </div>
                  </div>
                  <Link href="/my-moving-inventory">
                    <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 shadow-lg">
                      عرض التفاصيل الكاملة
                      <ArrowRight className="mr-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {movingLoading ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                  <p className="text-gray-400 text-sm mt-4">جاري تحميل المنتجات...</p>
                </div>
              ) : myMovingInventory && getMovingInventoryTotal() > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <ProductCard
                    icon={<Smartphone className="h-6 w-6" />}
                    title="جهاز N950"
                    boxes={myMovingInventory.n950Boxes || 0}
                    units={myMovingInventory.n950Units || 0}
                    color="#14b8a6"
                    gradient="from-teal-500/20 via-teal-600/10 to-transparent"
                    index={0}
                  />
                  <ProductCard
                    icon={<Smartphone className="h-6 w-6" />}
                    title="جهاز i9000S"
                    boxes={myMovingInventory.i9000sBoxes || 0}
                    units={myMovingInventory.i9000sUnits || 0}
                    color="#06b6d4"
                    gradient="from-cyan-500/20 via-cyan-600/10 to-transparent"
                    index={1}
                  />
                  <ProductCard
                    icon={<Smartphone className="h-6 w-6" />}
                    title="جهاز i9100"
                    boxes={myMovingInventory.i9100Boxes || 0}
                    units={myMovingInventory.i9100Units || 0}
                    color="#0ea5e9"
                    gradient="from-sky-500/20 via-sky-600/10 to-transparent"
                    index={2}
                  />
                  <ProductCard
                    icon={<FileText className="h-6 w-6" />}
                    title="ورق حراري"
                    boxes={myMovingInventory.rollPaperBoxes || 0}
                    units={myMovingInventory.rollPaperUnits || 0}
                    color="#84cc16"
                    gradient="from-lime-500/20 via-lime-600/10 to-transparent"
                    index={3}
                  />
                  <ProductCard
                    icon={<Sticker className="h-6 w-6" />}
                    title="ملصقات"
                    boxes={myMovingInventory.stickersBoxes || 0}
                    units={myMovingInventory.stickersUnits || 0}
                    color="#fb923c"
                    gradient="from-orange-400/20 via-orange-500/10 to-transparent"
                    index={4}
                  />
                  <ProductCard
                    icon={<Battery className="h-6 w-6" />}
                    title="بطاريات جديدة"
                    boxes={myMovingInventory.newBatteriesBoxes || 0}
                    units={myMovingInventory.newBatteriesUnits || 0}
                    color="#facc15"
                    gradient="from-yellow-400/20 via-yellow-500/10 to-transparent"
                    index={5}
                  />
                  <ProductCard
                    icon={<CreditCard className="h-6 w-6" />}
                    title="شريحة موبايلي"
                    boxes={myMovingInventory.mobilySimBoxes || 0}
                    units={myMovingInventory.mobilySimUnits || 0}
                    color="#4ade80"
                    gradient="from-green-400/20 via-green-500/10 to-transparent"
                    index={6}
                  />
                  <ProductCard
                    icon={<CreditCard className="h-6 w-6" />}
                    title="شريحة STC"
                    boxes={myMovingInventory.stcSimBoxes || 0}
                    units={myMovingInventory.stcSimUnits || 0}
                    color="#c084fc"
                    gradient="from-purple-400/20 via-purple-500/10 to-transparent"
                    index={7}
                  />
                  <ProductCard
                    icon={<CreditCard className="h-6 w-6" />}
                    title="شريحة زين"
                    boxes={myMovingInventory.zainSimBoxes || 0}
                    units={myMovingInventory.zainSimUnits || 0}
                    color="#f472b6"
                    gradient="from-pink-400/20 via-pink-500/10 to-transparent"
                    index={8}
                  />
                </div>
              ) : (
                <div className="text-center py-16 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10">
                  <TruckIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg font-medium">لا يوجد مخزون متحرك حالياً</p>
                  <p className="text-gray-500 text-sm mt-2">سيظهر المخزون المتحرك بعد قبول طلبات النقل من المستودعات</p>
                </div>
              )}
            </motion.div>
          </>
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {warehousesData.slice(0, 4).map((warehouse, index) => (
                  <WarehouseDashboardCard
                    key={warehouse.id}
                    warehouse={warehouse}
                    index={index}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Analytics Dashboard - Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <InventoryPieCard 
            fixedTotal={user?.role === 'technician' ? getFixedInventoryTotal() : 0}
            movingTotal={getMovingInventoryTotal()}
          />
          <InventoryBarCard
            fixedInventory={user?.role === 'technician' ? aggregatedFixedInventory : undefined}
            movingInventory={aggregatedMovingInventory}
            title={user?.role === 'admin' ? "توزيع المخزون المتحرك لجميع الفنيين" : user?.role === 'technician' ? "تفاصيل المخزون حسب الفئة" : "توزيع المخزون المتحرك"}
          />
        </div>

        {/* Technicians Dashboard */}
        {user?.role === 'admin' && techniciansData?.technicians && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl rounded-3xl border border-[#18B2B0]/30 p-8 overflow-hidden shadow-2xl mb-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/10 to-transparent" />
            
            <motion.div
              className="absolute inset-0 rounded-3xl"
              animate={{
                boxShadow: [
                  "0 0 30px rgba(24, 178, 176, 0.1)",
                  "0 0 50px rgba(24, 178, 176, 0.2)",
                  "0 0 30px rgba(24, 178, 176, 0.1)",
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="p-3 bg-gradient-to-br from-[#18B2B0] to-[#0ea5a3] rounded-2xl shadow-lg"
                    animate={{ rotate: [0, 5, 0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Users className="h-7 w-7 text-white drop-shadow-md" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">لوحة الفنيين</h2>
                    <p className="text-gray-400 text-sm">نظرة شاملة على مخزون جميع الفنيين</p>
                  </div>
                </div>
                <Badge className="bg-[#18B2B0]/20 text-[#18B2B0] border-[#18B2B0]/30 px-4 py-2">
                  {techniciansData.technicians.length} فني
                </Badge>
              </div>

              <div className="space-y-4">
                {techniciansData.technicians.map((tech, index) => (
                  <TechnicianDashboardCard 
                    key={tech.technicianId} 
                    technician={tech} 
                    index={index}
                  />
                ))}
              </div>

              {techniciansData.technicians.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">لا يوجد فنيين مسجلين في النظام</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Request Inventory Modal */}
      <RequestInventoryModal 
        open={showRequestInventoryModal} 
        onOpenChange={setShowRequestInventoryModal} 
      />
    </div>
  );
}
