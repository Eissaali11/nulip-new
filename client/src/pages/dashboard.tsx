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
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Package,
  TruckIcon,
  User,
  UserCircle,
  Users,
  Warehouse
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { CircularProgress } from "@/components/dashboard/CircularProgress";
import { GridBackground } from "@/components/dashboard/GridBackground";

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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const quickAccessCards = user?.role === 'admin' ? [
    {
      title: "المخزون الثابت",
      description: "أدخل وأدر المخزون الأساسي لديك (كرتون + مفرد)",
      href: "/my-fixed-inventory",
      icon: Package,
      gradient: "from-[#18B2B0] to-[#0ea5a3]",
      testId: "button-admin-fixed-inventory",
    },
    {
      title: "المخزون المتحرك",
      description: "تتبع وحدّث المخزون العملي الذي تستخدمه يومياً",
      href: "/my-moving-inventory",
      icon: TruckIcon,
      gradient: "from-emerald-500 to-green-600",
      testId: "button-admin-moving-inventory",
    },
    {
      title: "لوحة مخزون الفنيين",
      description: "عرض شامل لمخزون جميع الفنيين مع التنبيهات",
      href: "/admin-inventory-overview",
      icon: LayoutDashboard,
      gradient: "from-purple-500 to-pink-600",
      testId: "button-admin-overview",
    },
    {
      title: "المستودعات",
      description: "إدارة المستودعات ونقل الكميات للفنيين",
      href: "/warehouses",
      icon: Warehouse,
      gradient: "from-orange-500 to-amber-600",
      testId: "button-admin-warehouses",
    },
    {
      title: "العمليات",
      description: "متابعة عمليات النقل والإدارة",
      href: "/operations",
      icon: ClipboardCheck,
      gradient: "from-[#18B2B0] to-cyan-600",
      testId: "button-admin-operations",
    },
    {
      title: "المستخدمين",
      description: "إدارة حسابات الفنيين والمستخدمين",
      href: "/users",
      icon: Users,
      gradient: "from-blue-500 to-indigo-600",
      testId: "button-admin-users",
    },
  ] : [
    {
      title: "المخزون الثابت",
      description: "أدخل وأدر المخزون الأساسي لديك (كرتون + مفرد)",
      href: "/my-fixed-inventory",
      icon: Package,
      gradient: "from-[#18B2B0] to-[#0ea5a3]",
      testId: "button-go-to-fixed-inventory",
    },
    {
      title: "المخزون المتحرك",
      description: "تتبع وحدّث المخزون العملي الذي تستخدمه يومياً",
      href: "/my-moving-inventory",
      icon: TruckIcon,
      gradient: "from-emerald-500 to-green-600",
      testId: "button-go-to-moving-inventory",
    },
    {
      title: "الإشعارات",
      description: "عمليات النقل التي تحتاج موافقتك من المستودعات",
      href: "/notifications",
      icon: Bell,
      gradient: "from-orange-500 to-amber-600",
      testId: "button-go-to-notifications",
      badge: pendingTransfers.length > 0 ? pendingTransfers.length : undefined,
    },
  ];

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
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/90 via-[#050508]/85 to-[#050508]/90 backdrop-blur-[2px] z-0" />
      <GridBackground />

      {/* Futuristic Header */}
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

      {/* Main Content */}
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

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {quickAccessCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.href}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Link href={card.href}>
                  <div className="group relative overflow-hidden rounded-2xl border border-[#18B2B0]/20 hover:border-[#18B2B0]/40 transition-all duration-300 h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#18B2B0]/10 via-[#0ea5a3]/10 to-[#18B2B0]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative p-6">
                      <div className="flex items-center justify-between mb-4">
                        <motion.div 
                          className={`p-3 bg-gradient-to-br ${card.gradient} rounded-xl shadow-lg relative`}
                          whileHover={{ rotate: 12, scale: 1.1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Icon className="h-6 w-6 text-white" />
                          {card.badge && (
                            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[24px] h-6 flex items-center justify-center rounded-full px-2">
                              {card.badge}
                            </Badge>
                          )}
                        </motion.div>
                        
                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#18B2B0] transition-colors" />
                        </motion.div>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#18B2B0] transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {card.description}
                      </p>

                      <Button 
                        className={`w-full mt-4 bg-gradient-to-r ${card.gradient} hover:opacity-90 text-white font-bold shadow-lg text-sm py-5 transition-all`}
                        data-testid={card.testId}
                      >
                        الانتقال
                        <ArrowRight className="mr-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* System Status with Circular Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl rounded-3xl border border-[#18B2B0]/30 p-6 lg:p-8 overflow-hidden shadow-2xl mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/10 to-transparent" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">حالة النظام</h3>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full ml-2 animate-pulse" />
                متصل
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
              <div className="flex flex-col items-center">
                <CircularProgress
                  percentage={85}
                  label="الكفاءة"
                  value="85%"
                  color="#18B2B0"
                  size={120}
                />
              </div>

              <div className="flex flex-col items-center">
                <CircularProgress
                  percentage={70}
                  label="السعة"
                  value="70%"
                  color="#0ea5a3"
                  size={120}
                />
              </div>

              <div className="flex flex-col items-center">
                <CircularProgress
                  percentage={90}
                  label="التوفر"
                  value="90%"
                  color="#10b981"
                  size={120}
                />
              </div>

              <div className="flex flex-col items-center">
                <CircularProgress
                  percentage={95}
                  label="الجودة"
                  value="95%"
                  color="#f59e0b"
                  size={120}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Technicians Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
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
