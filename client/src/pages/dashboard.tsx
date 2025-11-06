import Header from "@/components/header";
import TechniciansTable from "@/components/technicians-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, TruckIcon, ArrowRight, LayoutDashboard, Sparkles, Users, Warehouse, ClipboardCheck, Bell, UserCircle, LogOut } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import rasscoLogo from "@assets/image_1762442473114.png";
import neoleapLogo from "@assets/image_1762442479737.png";
import madaDevice from "@assets/image_1762442486277.png";

interface WarehouseTransfer {
  id: string;
  technicianId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: pendingTransfers = [] } = useQuery<WarehouseTransfer[]>({
    queryKey: ["/api/warehouse-transfers", user?.id],
    enabled: !!user?.id && user?.role !== 'admin',
    select: (data) => data.filter(t => t.status === 'pending' && t.technicianId === user?.id),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" dir="rtl">
      {/* Animated Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/5"></div>
        
        {/* Animated Background Shapes */}
        <motion.div
          className="absolute top-0 left-0 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <div className="relative container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left Side - Logos Animation */}
            <motion.div 
              className="flex items-center gap-8"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl"
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <img src={rasscoLogo} alt="RASSCO" className="h-16 w-auto" />
              </motion.div>
              
              <motion.div
                className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl"
                whileHover={{ scale: 1.05, rotate: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <img src={neoleapLogo} alt="Neoleap" className="h-16 w-auto" />
              </motion.div>
            </motion.div>

            {/* Center - Title */}
            <motion.div 
              className="text-center flex-1"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.02, 1],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <h1 className="text-4xl lg:text-5xl font-black text-white mb-2 drop-shadow-2xl flex items-center justify-center gap-3">
                  <Sparkles className="h-10 w-10 text-yellow-300 animate-pulse" />
                  نظام إدارة المخزون
                  <Sparkles className="h-10 w-10 text-yellow-300 animate-pulse" />
                </h1>
                <p className="text-white/90 text-lg font-semibold">مرحباً بك، {user?.fullName}</p>
              </motion.div>
            </motion.div>

            {/* Right Side - Device Image */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-3xl blur-xl opacity-50"></div>
                <img src={madaDevice} alt="MADA Device" className="h-48 w-auto relative z-10 drop-shadow-2xl" />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12 fill-slate-900">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Quick Access Cards - Only for non-admin users */}
        {user?.role !== 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="border-2 border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-blue-50/50 backdrop-blur-sm overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <motion.div 
                      className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Package className="h-6 w-6 text-white drop-shadow-md" />
                    </motion.div>
                    <span className="font-black">المخزون الثابت</span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    أدخل وأدر المخزون الأساسي لديك (كرتون + مفرد)
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <Link href="/my-fixed-inventory">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-lg shadow-blue-500/50 text-base py-6" 
                        data-testid="button-go-to-fixed-inventory"
                      >
                        الذهاب للمخزون الثابت
                        <ArrowRight className="mr-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="border-2 border-green-500/50 hover:shadow-2xl hover:shadow-green-500/30 transition-all duration-300 bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-green-50/50 backdrop-blur-sm overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <motion.div 
                      className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <TruckIcon className="h-6 w-6 text-white drop-shadow-md" />
                    </motion.div>
                    <span className="font-black">المخزون المتحرك</span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    تتبع وحدّث المخزون العملي الذي تستخدمه يومياً
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <Link href="/my-moving-inventory">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg shadow-green-500/50 text-base py-6" 
                        data-testid="button-go-to-moving-inventory"
                      >
                        الذهاب للمخزون المتحرك
                        <ArrowRight className="mr-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="border-2 border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300 bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-orange-50/50 backdrop-blur-sm overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <motion.div 
                      className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg relative"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Bell className="h-6 w-6 text-white drop-shadow-md" />
                      {pendingTransfers.length > 0 && (
                        <Badge className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[24px] h-6 flex items-center justify-center rounded-full px-2">
                          {pendingTransfers.length}
                        </Badge>
                      )}
                    </motion.div>
                    <span className="font-black">الإشعارات</span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    عمليات النقل التي تحتاج موافقتك من المستودعات
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <Link href="/notifications">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold shadow-lg shadow-orange-500/50 text-base py-6" 
                        data-testid="button-go-to-notifications"
                      >
                        عرض الإشعارات
                        {pendingTransfers.length > 0 && (
                          <Badge className="mr-2 bg-white text-orange-600 font-bold">
                            {pendingTransfers.length}
                          </Badge>
                        )}
                        <ArrowRight className="mr-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="border-2 border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 bg-gradient-to-br from-purple-50/50 via-violet-50/30 to-purple-50/50 backdrop-blur-sm overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <motion.div 
                      className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <UserCircle className="h-6 w-6 text-white drop-shadow-md" />
                    </motion.div>
                    <span className="font-black">الملف الشخصي</span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    عرض معلوماتك الشخصية وتسجيل الخروج
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <Link href="/profile">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold shadow-lg shadow-purple-500/50 text-base py-6" 
                        data-testid="button-go-to-profile"
                      >
                        الملف الشخصي
                        <ArrowRight className="mr-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Admin Quick Access */}
        {user?.role === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="border-2 border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-blue-50/50 backdrop-blur-sm overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <motion.div 
                      className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Package className="h-6 w-6 text-white drop-shadow-md" />
                    </motion.div>
                    <span className="font-black">المخزون الثابت</span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    أدخل وأدر المخزون الأساسي لديك (كرتون + مفرد)
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <Link href="/my-fixed-inventory">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-lg shadow-blue-500/50 text-base py-6" 
                        data-testid="button-admin-fixed-inventory"
                      >
                        الذهاب للمخزون الثابت
                        <ArrowRight className="mr-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="border-2 border-green-500/50 hover:shadow-2xl hover:shadow-green-500/30 transition-all duration-300 bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-green-50/50 backdrop-blur-sm overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <motion.div 
                      className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <TruckIcon className="h-6 w-6 text-white drop-shadow-md" />
                    </motion.div>
                    <span className="font-black">المخزون المتحرك</span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    تتبع وحدّث المخزون العملي الذي تستخدمه يومياً
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <Link href="/my-moving-inventory">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg shadow-green-500/50 text-base py-6" 
                        data-testid="button-admin-moving-inventory"
                      >
                        الذهاب للمخزون المتحرك
                        <ArrowRight className="mr-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="border-2 border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-purple-50/50 backdrop-blur-sm overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <motion.div 
                      className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <LayoutDashboard className="h-6 w-6 text-white drop-shadow-md" />
                    </motion.div>
                    <span className="font-black">لوحة مخزون الفنيين</span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    عرض شامل لمخزون جميع الفنيين مع التنبيهات
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <Link href="/admin-inventory-overview">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg shadow-purple-500/50 text-base py-6" 
                        data-testid="button-admin-overview"
                      >
                        عرض لوحة الفنيين
                        <ArrowRight className="mr-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="border-2 border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300 bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-orange-50/50 backdrop-blur-sm overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <motion.div 
                      className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Warehouse className="h-6 w-6 text-white drop-shadow-md" />
                    </motion.div>
                    <span className="font-black">المستودعات</span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    إدارة المستودعات ونقل الكميات للفنيين
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <Link href="/warehouses">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold shadow-lg shadow-orange-500/50 text-base py-6" 
                        data-testid="button-admin-warehouses"
                      >
                        إدارة المستودعات
                        <ArrowRight className="mr-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="border-2 border-[#18B2B0]/50 hover:shadow-2xl hover:shadow-[#18B2B0]/30 transition-all duration-300 bg-gradient-to-br from-cyan-50/50 via-teal-50/30 to-cyan-50/50 backdrop-blur-sm overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <motion.div 
                      className="p-3 bg-gradient-to-br from-[#18B2B0] to-cyan-600 rounded-2xl shadow-lg"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <ClipboardCheck className="h-6 w-6 text-white drop-shadow-md" />
                    </motion.div>
                    <span className="font-black">العمليات</span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    إدارة عمليات النقل والموافقات
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <Link href="/operations">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        className="w-full bg-gradient-to-r from-[#18B2B0] to-cyan-600 hover:from-[#159a98] hover:to-cyan-700 text-white font-bold shadow-lg shadow-[#18B2B0]/50 text-base py-6" 
                        data-testid="button-admin-operations"
                      >
                        إدارة العمليات
                        <ArrowRight className="mr-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Technicians Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl text-white">
                <motion.div 
                  className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg"
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
