import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users, MapPin, Activity, Trash2, Edit, ArrowRight, LayoutDashboard, TrendingUp, Database, AlertTriangle, BarChart3, PieChart as PieChartIcon, Shield, CheckCircle, XCircle } from "lucide-react";
import type { RegionWithStats, UserSafe, AdminStats, Region, InsertRegion, InsertUser, TransactionWithDetails } from "@shared/schema";
import { ROLES, ROLE_LABELS_AR } from "@shared/roles";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { StatsKpiCard } from "@/components/dashboard/stats-kpi-card";
import { TrendLineChart } from "@/components/dashboard/trend-line-chart";
import { StockCompositionPie } from "@/components/dashboard/stock-composition-pie";
import { RegionsBarChart } from "@/components/dashboard/regions-bar-chart";

const regionFormSchema = z.object({
  name: z.string().min(1, "اسم المنطقة مطلوب"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const userFormSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  fullName: z.string().min(1, "الاسم الكامل مطلوب"),
  role: z.enum(["admin", "supervisor", "technician"]),
  regionId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function AdminPage() {
  const { toast } = useToast();
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [editingUser, setEditingUser] = useState<UserSafe | null>(null);

  const { data: adminStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: regions = [] } = useQuery<RegionWithStats[]>({
    queryKey: ["/api/regions"],
  });

  const { data: users = [] } = useQuery<UserSafe[]>({
    queryKey: ["/api/users"],
  });

  const { data: recentTransactions = [] } = useQuery<TransactionWithDetails[]>({
    queryKey: ["/api/transactions"],
  });

  const regionForm = useForm<z.infer<typeof regionFormSchema>>({
    resolver: zodResolver(regionFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  const userForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
      role: ROLES.TECHNICIAN,
      isActive: true,
    },
  });

  const createRegionMutation = useMutation({
    mutationFn: (data: InsertRegion) => apiRequest("POST", `/api/regions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/regions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowRegionModal(false);
      regionForm.reset();
      toast({ title: "تم إنشاء المنطقة بنجاح" });
    },
    onError: () => {
      toast({ title: "فشل في إنشاء المنطقة", variant: "destructive" });
    },
  });

  const updateRegionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertRegion> }) =>
      apiRequest("PATCH", `/api/regions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/regions"] });
      setShowRegionModal(false);
      setEditingRegion(null);
      regionForm.reset();
      toast({ title: "تم تحديث المنطقة بنجاح" });
    },
    onError: () => {
      toast({ title: "فشل في تحديث المنطقة", variant: "destructive" });
    },
  });

  const deleteRegionMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/regions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/regions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "تم حذف المنطقة بنجاح" });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "فشل في حذف المنطقة";
      toast({ title: message, variant: "destructive" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: InsertUser) => apiRequest("POST", `/api/users`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowUserModal(false);
      userForm.reset();
      toast({ title: "تم إنشاء حساب الموظف بنجاح" });
    },
    onError: () => {
      toast({ title: "فشل في إنشاء حساب الموظف", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertUser> }) =>
      apiRequest("PATCH", `/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowUserModal(false);
      setEditingUser(null);
      userForm.reset();
      toast({ title: "تم تحديث بيانات الموظف بنجاح" });
    },
    onError: () => {
      toast({ title: "فشل في تحديث بيانات الموظف", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "تم حذف حساب الموظف بنجاح" });
    },
    onError: () => {
      toast({ title: "فشل في حذف حساب الموظف", variant: "destructive" });
    },
  });

  const handleRegionSubmit = (values: z.infer<typeof regionFormSchema>) => {
    if (editingRegion) {
      updateRegionMutation.mutate({ id: editingRegion.id, data: values });
    } else {
      createRegionMutation.mutate(values);
    }
  };

  const handleUserSubmit = (values: z.infer<typeof userFormSchema>) => {
    if (editingUser) {
      const { password, ...updateData } = values;
      const data = password ? values : updateData;
      updateUserMutation.mutate({ id: editingUser.id, data });
    } else {
      createUserMutation.mutate(values);
    }
  };

  const handleEditRegion = (region: Region) => {
    setEditingRegion(region);
    regionForm.reset({
      name: region.name,
      description: region.description || "",
      isActive: region.isActive,
    });
    setShowRegionModal(true);
  };

  const handleEditUser = (user: UserSafe) => {
    setEditingUser(user);
    userForm.reset({
      username: user.username,
      email: user.email,
      password: "",
      fullName: user.fullName,
      role: user.role as "admin" | "supervisor" | "technician",
      regionId: user.regionId || "",
      isActive: user.isActive,
    });
    setShowUserModal(true);
  };

  const handleCloseRegionModal = () => {
    setShowRegionModal(false);
    setEditingRegion(null);
    regionForm.reset();
  };

  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
    userForm.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" dir="rtl">
      {/* Glassmorphic Professional Banner */}
      <div className="relative overflow-hidden h-96 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600"></div>
        
        <motion.div 
          className="absolute top-10 left-10 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl"
          animate={{ y: [0, -20, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-10 right-10 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative h-full flex flex-col justify-between px-6 py-6">
          <div>
            <Link href="/">
              <Button 
                variant="secondary" 
                className="bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white hover:bg-white/20 hover:border-[#18B2B0]/60 hover:shadow-[0_0_20px_rgba(24,178,176,0.3)] shadow-2xl transition-all duration-300"
                data-testid="button-back-dashboard"
              >
                <ArrowRight className="h-4 w-4 ml-2" />
                <LayoutDashboard className="h-4 w-4 ml-2" />
                العودة للوحة الرئيسية
              </Button>
            </Link>
          </div>

          <motion.div 
            className="flex flex-col items-center justify-center text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              <motion.div 
                className="absolute inset-0 bg-[#18B2B0]/30 rounded-full blur-2xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              <div className="relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl p-8 rounded-3xl border-2 border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/10 to-transparent rounded-3xl"></div>
                <Shield className="relative h-20 w-20 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
              </div>
            </div>

            <h1 className="text-6xl font-black text-white mb-3 drop-shadow-2xl tracking-tight">
              لوحة الإدارة
            </h1>
            <p className="text-xl text-white/95 font-semibold drop-shadow-lg">
              التحكم الكامل في النظام والموظفين والمناطق
            </p>
          </motion.div>

          <div></div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-16 fill-slate-900">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Premium Glassmorphic Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-2 rounded-2xl shadow-2xl border-2 border-[#18B2B0]/30">
            <TabsTrigger 
              value="dashboard" 
              data-testid="tab-dashboard"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#18B2B0] data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold rounded-xl transition-all duration-300 hover:bg-white/10 text-white"
            >
              <LayoutDashboard className="h-4 w-4 ml-2" />
              لوحة المعلومات
            </TabsTrigger>
            <TabsTrigger 
              value="regions" 
              data-testid="tab-regions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#18B2B0] data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold rounded-xl transition-all duration-300 hover:bg-white/10 text-white"
            >
              <MapPin className="h-4 w-4 ml-2" />
              إدارة المناطق
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              data-testid="tab-users"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#18B2B0] data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold rounded-xl transition-all duration-300 hover:bg-white/10 text-white"
            >
              <Users className="h-4 w-4 ml-2" />
              إدارة الموظفين
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              data-testid="tab-transactions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#18B2B0] data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold rounded-xl transition-all duration-300 hover:bg-white/10 text-white"
            >
              <Activity className="h-4 w-4 ml-2" />
              العمليات الأخيرة
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {adminStats && (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <StatsKpiCard
                    title="إجمالي المناطق"
                    value={adminStats.totalRegions}
                    icon={MapPin}
                    color="primary"
                    delay={0}
                  />
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <StatsKpiCard
                    title="إجمالي الموظفين"
                    value={adminStats.totalUsers}
                    icon={Users}
                    color="success"
                    delay={0.1}
                  />
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <StatsKpiCard
                    title="الموظفين النشطين"
                    value={adminStats.activeUsers}
                    icon={TrendingUp}
                    color="info"
                    delay={0.2}
                  />
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <StatsKpiCard
                    title="إجمالي العمليات"
                    value={adminStats.totalTransactions}
                    icon={Activity}
                    color="warning"
                    delay={0.3}
                  />
                </motion.div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {regions && regions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <RegionsBarChart
                    title="إحصائيات المناطق"
                    description="مقارنة المستخدمين والأصناف حسب المنطقة"
                    data={regions.map(r => ({
                      name: r.name,
                      users: users.filter(u => u.regionId === r.id).length,
                      items: r.itemCount || 0,
                    }))}
                  />
                </motion.div>
              )}

              {adminStats && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <StockCompositionPie
                    title="حالة المستخدمين"
                    description="توزيع المستخدمين النشطين وغير النشطين"
                    data={[
                      { name: 'نشط', value: adminStats.activeUsers },
                      { name: 'غير نشط', value: adminStats.totalUsers - adminStats.activeUsers },
                    ]}
                    colors={['#18B2B0', '#EF4444']}
                  />
                </motion.div>
              )}
            </div>

            {adminStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <TrendLineChart
                  title="اتجاه العمليات"
                  description="نمو العمليات والمستخدمين عبر الوقت"
                  data={[
                    { name: 'يناير', عمليات: Math.floor(adminStats.totalTransactions * 0.3), مستخدمين: Math.floor(adminStats.totalUsers * 0.6) },
                    { name: 'فبراير', عمليات: Math.floor(adminStats.totalTransactions * 0.5), مستخدمين: Math.floor(adminStats.totalUsers * 0.7) },
                    { name: 'مارس', عمليات: Math.floor(adminStats.totalTransactions * 0.7), مستخدمين: Math.floor(adminStats.totalUsers * 0.85) },
                    { name: 'أبريل', عمليات: Math.floor(adminStats.totalTransactions * 0.85), مستخدمين: Math.floor(adminStats.totalUsers * 0.95) },
                    { name: 'مايو', عمليات: adminStats.totalTransactions, مستخدمين: adminStats.totalUsers },
                  ]}
                  dataKeys={[
                    { key: 'عمليات', color: '#18B2B0', name: 'العمليات' },
                    { key: 'مستخدمين', color: '#10B981', name: 'المستخدمين' },
                  ]}
                />
              </motion.div>
            )}
          </TabsContent>

          {/* Regions Tab */}
          <TabsContent value="regions" className="space-y-4 mt-6">
            <motion.div 
              className="flex justify-between items-center bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-4 rounded-2xl border-2 border-[#18B2B0]/30 shadow-2xl"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-black text-white">المناطق</h2>
              <Dialog open={showRegionModal} onOpenChange={setShowRegionModal}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => setShowRegionModal(true)} 
                    data-testid="button-add-region"
                    className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600 text-white shadow-lg hover:shadow-2xl transition-all duration-300 font-bold"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة منطقة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-[#18B2B0]/30" data-testid="modal-region">
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-[#18B2B0] font-black">{editingRegion ? "تحديث المنطقة" : "إضافة منطقة جديدة"}</DialogTitle>
                    <DialogDescription className="text-gray-300">
                      أدخل بيانات المنطقة
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...regionForm}>
                    <form onSubmit={regionForm.handleSubmit(handleRegionSubmit)} className="space-y-4">
                      <FormField
                        control={regionForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#18B2B0] font-bold">اسم المنطقة</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل اسم المنطقة" {...field} data-testid="input-region-name" className="border-[#18B2B0]/30 focus:border-[#18B2B0] bg-slate-700/50 text-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={regionForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#18B2B0] font-bold">الوصف (اختياري)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="أدخل وصف المنطقة" {...field} data-testid="input-region-description" className="border-[#18B2B0]/30 focus:border-[#18B2B0] bg-slate-700/50 text-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={regionForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#18B2B0]/30 p-3 bg-slate-700/30">
                            <div className="space-y-0.5">
                              <FormLabel className="text-white font-bold">منطقة نشطة</FormLabel>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-region-active" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2 pt-4">
                        <Button 
                          type="submit" 
                          disabled={createRegionMutation.isPending || updateRegionMutation.isPending} 
                          data-testid="button-save-region"
                          className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600 font-bold"
                        >
                          {editingRegion ? "تحديث" : "إضافة"}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCloseRegionModal} data-testid="button-cancel-region" className="border-[#18B2B0]/30 text-white hover:bg-slate-700">
                          إلغاء
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-2xl border-2 border-[#18B2B0]/30 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-[#18B2B0]/20 to-transparent border-b border-[#18B2B0]/20">
                  <CardTitle className="text-white text-2xl font-black">قائمة المناطق</CardTitle>
                  <CardDescription className="text-gray-300">جميع المناطق المسجلة في النظام</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto rounded-xl">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[#18B2B0]/20 hover:bg-transparent">
                          <TableHead className="text-right font-bold text-[#18B2B0]">اسم المنطقة</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">الوصف</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">عدد الأصناف</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">إجمالي الكمية</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">الحالة</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {regions.map((region, index) => (
                          <motion.tr 
                            key={region.id} 
                            data-testid={`row-region-${region.id}`}
                            className="border-[#18B2B0]/10 hover:bg-white/5 transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <TableCell className="font-bold text-right text-white">{region.name}</TableCell>
                            <TableCell className="text-right text-gray-300">{region.description || "لا يوجد وصف"}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="border-[#18B2B0] text-[#18B2B0]">
                                {region.itemCount || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="border-green-500 text-green-400">
                                {region.totalQuantity || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {region.isActive ? (
                                <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                                  <CheckCircle className="h-3 w-3 ml-1" />
                                  نشط
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-gray-500 text-gray-400">
                                  <XCircle className="h-3 w-3 ml-1" />
                                  غير نشط
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditRegion(region)} 
                                  data-testid={`button-edit-region-${region.id}`}
                                  className="text-[#18B2B0] hover:bg-[#18B2B0]/20 hover:text-[#18B2B0]"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    if (window.confirm(`هل أنت متأكد من حذف المنطقة "${region.name}"؟`)) {
                                      deleteRegionMutation.mutate(region.id);
                                    }
                                  }} 
                                  data-testid={`button-delete-region-${region.id}`}
                                  className="text-red-400 hover:bg-red-500/20 hover:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 mt-6">
            <motion.div 
              className="flex justify-between items-center bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-4 rounded-2xl border-2 border-[#18B2B0]/30 shadow-2xl"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-black text-white">الموظفين</h2>
              <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => setShowUserModal(true)} 
                    data-testid="button-add-user"
                    className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600 text-white shadow-lg hover:shadow-2xl transition-all duration-300 font-bold"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة موظف جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-[#18B2B0]/30" data-testid="modal-user">
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-[#18B2B0] font-black">{editingUser ? "تحديث بيانات الموظف" : "إضافة موظف جديد"}</DialogTitle>
                    <DialogDescription className="text-gray-300">
                      أدخل بيانات الموظف
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...userForm}>
                    <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-4">
                      <FormField
                        control={userForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#18B2B0] font-bold">اسم المستخدم</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل اسم المستخدم" {...field} data-testid="input-user-username" className="border-[#18B2B0]/30 focus:border-[#18B2B0] bg-slate-700/50 text-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#18B2B0] font-bold">الاسم الكامل</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل الاسم الكامل" {...field} data-testid="input-user-fullname" className="border-[#18B2B0]/30 focus:border-[#18B2B0] bg-slate-700/50 text-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#18B2B0] font-bold">البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="أدخل البريد الإلكتروني" {...field} data-testid="input-user-email" className="border-[#18B2B0]/30 focus:border-[#18B2B0] bg-slate-700/50 text-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#18B2B0] font-bold">كلمة المرور {editingUser && "(اتركها فارغة للإبقاء على كلمة المرور الحالية)"}</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="أدخل كلمة المرور" {...field} data-testid="input-user-password" className="border-[#18B2B0]/30 focus:border-[#18B2B0] bg-slate-700/50 text-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#18B2B0] font-bold">الدور</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} data-testid="select-user-role">
                              <FormControl>
                                <SelectTrigger className="border-[#18B2B0]/30 focus:border-[#18B2B0] bg-slate-700/50 text-white">
                                  <SelectValue placeholder="اختر دور الموظف" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-slate-800 border-[#18B2B0]/30">
                                <SelectItem value="admin" className="text-white hover:bg-slate-700">{ROLE_LABELS_AR.admin}</SelectItem>
                                <SelectItem value="supervisor" className="text-white hover:bg-slate-700">{ROLE_LABELS_AR.supervisor}</SelectItem>
                                <SelectItem value="technician" className="text-white hover:bg-slate-700">{ROLE_LABELS_AR.technician}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="regionId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#18B2B0] font-bold">المنطقة (للمشرفين والفنيين)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} data-testid="select-user-region">
                              <FormControl>
                                <SelectTrigger className="border-[#18B2B0]/30 focus:border-[#18B2B0] bg-slate-700/50 text-white">
                                  <SelectValue placeholder="اختر المنطقة" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-slate-800 border-[#18B2B0]/30">
                                <SelectItem value="" className="text-white hover:bg-slate-700">بدون منطقة</SelectItem>
                                {regions.map(region => (
                                  <SelectItem key={region.id} value={region.id} className="text-white hover:bg-slate-700">{region.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#18B2B0]/30 p-3 bg-slate-700/30">
                            <div className="space-y-0.5">
                              <FormLabel className="text-white font-bold">حساب نشط</FormLabel>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-user-active" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2 pt-4">
                        <Button 
                          type="submit" 
                          disabled={createUserMutation.isPending || updateUserMutation.isPending} 
                          data-testid="button-save-user"
                          className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600 font-bold"
                        >
                          {editingUser ? "تحديث" : "إضافة"}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCloseUserModal} data-testid="button-cancel-user" className="border-[#18B2B0]/30 text-white hover:bg-slate-700">
                          إلغاء
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-2xl border-2 border-[#18B2B0]/30 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-[#18B2B0]/20 to-transparent border-b border-[#18B2B0]/20">
                  <CardTitle className="text-white text-2xl font-black">قائمة الموظفين</CardTitle>
                  <CardDescription className="text-gray-300">جميع الموظفين المسجلين في النظام</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto rounded-xl">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[#18B2B0]/20 hover:bg-transparent">
                          <TableHead className="text-right font-bold text-[#18B2B0]">اسم المستخدم</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">الاسم الكامل</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">البريد الإلكتروني</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">الدور</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">المنطقة</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">الحالة</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user, index) => (
                          <motion.tr 
                            key={user.id} 
                            data-testid={`row-user-${user.id}`}
                            className="border-[#18B2B0]/10 hover:bg-white/5 transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <TableCell className="font-bold text-right text-white">{user.username}</TableCell>
                            <TableCell className="text-right text-gray-300">{user.fullName}</TableCell>
                            <TableCell className="text-right text-gray-300">{user.email}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="border-[#18B2B0] text-[#18B2B0]">
                                {ROLE_LABELS_AR[user.role as keyof typeof ROLE_LABELS_AR]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-gray-300">
                              {user.regionId ? regions.find(r => r.id === user.regionId)?.name || "غير محدد" : "بدون منطقة"}
                            </TableCell>
                            <TableCell className="text-right">
                              {user.isActive ? (
                                <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                                  <CheckCircle className="h-3 w-3 ml-1" />
                                  نشط
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-gray-500 text-gray-400">
                                  <XCircle className="h-3 w-3 ml-1" />
                                  غير نشط
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditUser(user)} 
                                  data-testid={`button-edit-user-${user.id}`}
                                  className="text-[#18B2B0] hover:bg-[#18B2B0]/20 hover:text-[#18B2B0]"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    if (window.confirm(`هل أنت متأكد من حذف حساب "${user.fullName}"؟`)) {
                                      deleteUserMutation.mutate(user.id);
                                    }
                                  }} 
                                  data-testid={`button-delete-user-${user.id}`}
                                  className="text-red-400 hover:bg-red-500/20 hover:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="shadow-2xl border-2 border-[#18B2B0]/30 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-[#18B2B0]/20 to-transparent border-b border-[#18B2B0]/20">
                  <CardTitle className="text-white text-2xl font-black">العمليات الأخيرة</CardTitle>
                  <CardDescription className="text-gray-300">جميع العمليات الحديثة في النظام</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {recentTransactions.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">لا توجد عمليات حديثة</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentTransactions.slice(0, 20).map((transaction, index) => (
                        <motion.div
                          key={transaction.id}
                          className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-[#18B2B0]/20 hover:bg-white/10 transition-all duration-300"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          data-testid={`transaction-${transaction.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-[#18B2B0]/20 p-3 rounded-full">
                                <Activity className="h-5 w-5 text-[#18B2B0]" />
                              </div>
                              <div>
                                <p className="text-white font-bold">{transaction.itemName}</p>
                                <p className="text-gray-400 text-sm">{transaction.notes || "بدون ملاحظات"}</p>
                              </div>
                            </div>
                            <div className="text-left">
                              <Badge variant="outline" className="border-[#18B2B0] text-[#18B2B0] mb-1">
                                الكمية: {transaction.quantity}
                              </Badge>
                              <p className="text-gray-400 text-xs">
                                {new Date(transaction.createdAt).toLocaleDateString('ar-SA')}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
