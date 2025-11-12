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
import { Plus, Users, MapPin, Activity, Trash2, Edit, ArrowRight, LayoutDashboard, TrendingUp, Database, AlertTriangle, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import type { RegionWithStats, UserSafe, AdminStats, Region, InsertRegion, InsertUser } from "@shared/schema";
import { ROLES, ROLE_LABELS_AR } from "@shared/roles";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import bannerImage from "@assets/Gemini_Generated_Image_1iknau1iknau1ikn_1762464877305.png";
import { StatsKpiCard } from "@/components/dashboard/stats-kpi-card";
import { TrendLineChart } from "@/components/dashboard/trend-line-chart";
import { StockCompositionPie } from "@/components/dashboard/stock-composition-pie";
import { RegionsBarChart } from "@/components/dashboard/regions-bar-chart";

// Form schemas
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

  // Queries
  const { data: adminStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: regions = [] } = useQuery<RegionWithStats[]>({
    queryKey: ["/api/regions"],
  });

  const { data: users = [] } = useQuery<UserSafe[]>({
    queryKey: ["/api/users"],
  });

  // Forms
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

  // Mutations
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

  // Handlers
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
      {/* Modern Professional Banner */}
      <div className="relative overflow-hidden h-96 shadow-2xl">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600"></div>
        
        {/* Animated Background Shapes */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50"></div>

        {/* Content Section */}
        <div className="relative h-full flex flex-col justify-between px-6 py-6">
          {/* Top Section - Back Button */}
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

          {/* Center Premium Content */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative">
              {/* Static Elegant Glow Effect */}
              <div className="absolute inset-0 bg-[#18B2B0]/30 rounded-full blur-2xl"></div>
              
              {/* Premium Glass Card with Icon */}
              <div className="relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl p-8 rounded-3xl border-2 border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/10 to-transparent rounded-3xl"></div>
                <LayoutDashboard className="relative h-20 w-20 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
              </div>
            </div>

            {/* Title and Description */}
            <h1 className="text-5xl font-black text-white mb-3 drop-shadow-2xl tracking-tight">
              لوحة الإدارة
            </h1>
            <p className="text-xl text-white/95 font-semibold drop-shadow-lg">
              إدارة شاملة للنظام والموظفين والعمليات
            </p>
          </div>

          {/* Bottom Spacer */}
          <div></div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12 fill-slate-900">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Enhanced Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-[#18B2B0]/20">
            <TabsTrigger 
              value="dashboard" 
              data-testid="tab-dashboard"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#18B2B0] data-[state=active]:to-teal-500 data-[state=active]:text-white font-semibold rounded-lg transition-all duration-300"
            >
              <LayoutDashboard className="h-4 w-4 ml-2" />
              لوحة المعلومات
            </TabsTrigger>
            <TabsTrigger 
              value="regions" 
              data-testid="tab-regions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#18B2B0] data-[state=active]:to-teal-500 data-[state=active]:text-white font-semibold rounded-lg transition-all duration-300"
            >
              <MapPin className="h-4 w-4 ml-2" />
              إدارة المناطق
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              data-testid="tab-users"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#18B2B0] data-[state=active]:to-teal-500 data-[state=active]:text-white font-semibold rounded-lg transition-all duration-300"
            >
              <Users className="h-4 w-4 ml-2" />
              إدارة الموظفين
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              data-testid="tab-transactions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#18B2B0] data-[state=active]:to-teal-500 data-[state=active]:text-white font-semibold rounded-lg transition-all duration-300"
            >
              <Activity className="h-4 w-4 ml-2" />
              العمليات الأخيرة
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* KPI Cards */}
            {adminStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsKpiCard
                  title="إجمالي المناطق"
                  value={adminStats.totalRegions}
                  icon={MapPin}
                  color="primary"
                  delay={0}
                />
                <StatsKpiCard
                  title="إجمالي الموظفين"
                  value={adminStats.totalUsers}
                  icon={Users}
                  color="success"
                  delay={0.1}
                />
                <StatsKpiCard
                  title="الموظفين النشطين"
                  value={adminStats.activeUsers}
                  icon={TrendingUp}
                  color="info"
                  delay={0.2}
                />
                <StatsKpiCard
                  title="إجمالي العمليات"
                  value={adminStats.totalTransactions}
                  icon={Activity}
                  color="warning"
                  delay={0.3}
                />
              </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Regions Bar Chart */}
              {regions && regions.length > 0 && (
                <RegionsBarChart
                  title="إحصائيات المناطق"
                  description="مقارنة المستخدمين والأصناف حسب المنطقة"
                  data={regions.map(r => ({
                    name: r.name,
                    users: users.filter(u => u.regionId === r.id).length,
                    items: r.itemCount || 0,
                  }))}
                />
              )}

              {/* User Status Pie */}
              {adminStats && (
                <StockCompositionPie
                  title="حالة المستخدمين"
                  description="توزيع المستخدمين النشطين وغير النشطين"
                  data={[
                    { name: 'نشط', value: adminStats.activeUsers },
                    { name: 'غير نشط', value: adminStats.totalUsers - adminStats.activeUsers },
                  ]}
                  colors={['#18B2B0', '#EF4444']}
                />
              )}
            </div>

            {/* Trend Line Chart */}
            {adminStats && (
              <TrendLineChart
                title="اتجاه العمليات"
                description="نمو العمليات والمستخدمين عبر الوقت"
                data={[
                  { name: 'يناير', عمليات: 120, مستخدمين: 15 },
                  { name: 'فبراير', عمليات: 200, مستخدمين: 18 },
                  { name: 'مارس', عمليات: 280, مستخدمين: 22 },
                  { name: 'أبريل', عمليات: 350, مستخدمين: 25 },
                  { name: 'مايو', عمليات: adminStats.totalTransactions, مستخدمين: adminStats.totalUsers },
                ]}
                dataKeys={[
                  { key: 'عمليات', color: '#18B2B0', name: 'العمليات' },
                  { key: 'مستخدمين', color: '#10B981', name: 'المستخدمين' },
                ]}
              />
            )}
          </TabsContent>

          {/* Regions Tab */}
          <TabsContent value="regions" className="space-y-4 mt-6">
            <div className="flex justify-between items-center bg-white/10 backdrop-blur-xl p-4 rounded-xl border border-white/20">
              <h2 className="text-2xl font-bold text-white">المناطق</h2>
              <Dialog open={showRegionModal} onOpenChange={setShowRegionModal}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => setShowRegionModal(true)} 
                    data-testid="button-add-region"
                    className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة منطقة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" data-testid="modal-region">
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-[#18B2B0]">{editingRegion ? "تحديث المنطقة" : "إضافة منطقة جديدة"}</DialogTitle>
                    <DialogDescription>
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
                            <FormLabel>اسم المنطقة</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل اسم المنطقة" {...field} data-testid="input-region-name" className="border-[#18B2B0]/30 focus:border-[#18B2B0]" />
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
                            <FormLabel>الوصف (اختياري)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="أدخل وصف المنطقة" {...field} data-testid="input-region-description" className="border-[#18B2B0]/30 focus:border-[#18B2B0]" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={regionForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#18B2B0]/30 p-3">
                            <div className="space-y-0.5">
                              <FormLabel>منطقة نشطة</FormLabel>
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
                          className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600"
                        >
                          {editingRegion ? "تحديث" : "إضافة"}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCloseRegionModal} data-testid="button-cancel-region">
                          إلغاء
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/10 to-transparent rounded-2xl blur-2xl"></div>
              <Card className="relative shadow-xl border border-white/20 bg-white/10 backdrop-blur-xl">
                <CardHeader className="bg-white/5">
                  <CardTitle className="text-white">قائمة المناطق</CardTitle>
                  <CardDescription className="text-gray-300">جميع المناطق المسجلة في النظام</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto rounded-xl">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-right font-bold text-gray-300">اسم المنطقة</TableHead>
                          <TableHead className="text-right font-bold text-gray-300">الوصف</TableHead>
                          <TableHead className="text-right font-bold text-gray-300">عدد الأصناف</TableHead>
                          <TableHead className="text-right font-bold text-gray-300">إجمالي الكمية</TableHead>
                          <TableHead className="text-right font-bold text-gray-300">المخزون المنخفض</TableHead>
                          <TableHead className="text-right font-bold text-gray-300">الحالة</TableHead>
                          <TableHead className="text-right font-bold text-gray-300">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {regions.map((region) => (
                          <TableRow key={region.id} data-testid={`row-region-${region.id}`} className="border-white/5 hover:bg-white/5 transition-colors">
                            <TableCell className="font-medium text-right text-white">{region.name}</TableCell>
                            <TableCell className="text-right text-gray-300">{region.description || "لا يوجد"}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="border-[#18B2B0] text-[#18B2B0]">{region.itemCount}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="border-blue-500 text-blue-600">{region.totalQuantity}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {region.lowStockCount > 0 ? (
                            <Badge variant="outline" className="border-red-500 text-red-600">
                              <AlertTriangle className="h-3 w-3 ml-1" />
                              {region.lowStockCount}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-500 text-green-600">0</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={region.isActive ? "default" : "secondary"}
                            className={region.isActive ? "bg-gradient-to-r from-[#18B2B0] to-teal-500" : ""}
                          >
                            {region.isActive ? "نشط" : "غير نشط"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEditRegion(region)} 
                              data-testid={`button-edit-region-${region.id}`}
                              className="hover:bg-[#18B2B0]/10 hover:border-[#18B2B0]"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteRegionMutation.mutate(region.id)}
                              disabled={deleteRegionMutation.isPending}
                              data-testid={`button-delete-region-${region.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 mt-6">
            <div className="flex justify-between items-center bg-white/10 backdrop-blur-xl p-4 rounded-xl border border-white/20">
              <h2 className="text-2xl font-bold text-white">الموظفين</h2>
              <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => setShowUserModal(true)} 
                    data-testid="button-add-user"
                    className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة موظف جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" data-testid="modal-user">
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-[#18B2B0]">{editingUser ? "تحديث بيانات الموظف" : "إضافة موظف جديد"}</DialogTitle>
                    <DialogDescription>
                      أدخل بيانات الموظف
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...userForm}>
                    <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-4">
                      <FormField
                        control={userForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم الكامل</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل الاسم الكامل" {...field} data-testid="input-user-fullname" className="border-[#18B2B0]/30 focus:border-[#18B2B0]" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم المستخدم</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل اسم المستخدم" {...field} data-testid="input-user-username" className="border-[#18B2B0]/30 focus:border-[#18B2B0]" />
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
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="أدخل البريد الإلكتروني" {...field} data-testid="input-user-email" className="border-[#18B2B0]/30 focus:border-[#18B2B0]" />
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
                            <FormLabel>{editingUser ? "كلمة المرور الجديدة (اختياري)" : "كلمة المرور"}</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder={editingUser ? "اتركه فارغًا للاحتفاظ بكلمة المرور الحالية" : "أدخل كلمة المرور"}
                                {...field}
                                data-testid="input-user-password"
                                className="border-[#18B2B0]/30 focus:border-[#18B2B0]"
                              />
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
                            <FormLabel>الدور</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-user-role" className="border-[#18B2B0]/30 focus:border-[#18B2B0]">
                                  <SelectValue placeholder="اختر الدور" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={ROLES.TECHNICIAN}>{ROLE_LABELS_AR[ROLES.TECHNICIAN]}</SelectItem>
                                <SelectItem value={ROLES.SUPERVISOR}>{ROLE_LABELS_AR[ROLES.SUPERVISOR]}</SelectItem>
                                <SelectItem value={ROLES.ADMIN}>{ROLE_LABELS_AR[ROLES.ADMIN]}</SelectItem>
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
                            <FormLabel>المنطقة</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-user-region" className="border-[#18B2B0]/30 focus:border-[#18B2B0]">
                                  <SelectValue placeholder="اختر المنطقة" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {regions.map((region) => (
                                  <SelectItem key={region.id} value={region.id}>
                                    {region.name}
                                  </SelectItem>
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
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#18B2B0]/30 p-3">
                            <div className="space-y-0.5">
                              <FormLabel>حساب نشط</FormLabel>
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
                          className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600"
                        >
                          {editingUser ? "تحديث" : "إضافة"}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCloseUserModal} data-testid="button-cancel-user">
                          إلغاء
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="shadow-xl border-[#18B2B0]/20 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-[#18B2B0]/10 to-teal-50/50">
                <CardTitle className="text-[#18B2B0]">قائمة الموظفين</CardTitle>
                <CardDescription>جميع الموظفين المسجلين في النظام</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#18B2B0]/20">
                      <TableHead className="text-right font-bold">الاسم الكامل</TableHead>
                      <TableHead className="text-right font-bold">اسم المستخدم</TableHead>
                      <TableHead className="text-right font-bold">البريد الإلكتروني</TableHead>
                      <TableHead className="text-right font-bold">الدور</TableHead>
                      <TableHead className="text-right font-bold">المنطقة</TableHead>
                      <TableHead className="text-right font-bold">الحالة</TableHead>
                      <TableHead className="text-right font-bold">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const userRegion = regions.find(r => r.id === user.regionId);
                      return (
                        <TableRow key={user.id} data-testid={`row-user-${user.id}`} className="hover:bg-[#18B2B0]/5 transition-colors">
                          <TableCell className="font-medium text-right">{user.fullName}</TableCell>
                          <TableCell className="text-right">{user.username}</TableCell>
                          <TableCell className="text-right">{user.email}</TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant={user.role === ROLES.ADMIN ? "default" : "secondary"}
                              className={user.role === ROLES.ADMIN ? "bg-gradient-to-r from-[#18B2B0] to-teal-500" : 
                                         user.role === ROLES.SUPERVISOR ? "bg-gradient-to-r from-blue-500 to-cyan-500" : ""}
                            >
                              {ROLE_LABELS_AR[user.role as keyof typeof ROLE_LABELS_AR] || user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{userRegion?.name || "غير محدد"}</TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant={user.isActive ? "default" : "secondary"}
                              className={user.isActive ? "bg-gradient-to-r from-green-500 to-emerald-500" : ""}
                            >
                              {user.isActive ? "نشط" : "غير نشط"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleEditUser(user)} 
                                data-testid={`button-edit-user-${user.id}`}
                                className="hover:bg-[#18B2B0]/10 hover:border-[#18B2B0]"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteUserMutation.mutate(user.id)}
                                disabled={deleteUserMutation.isPending}
                                data-testid={`button-delete-user-${user.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4 mt-6">
            <Card className="shadow-xl border-[#18B2B0]/20 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-[#18B2B0]/10 to-teal-50/50">
                <CardTitle className="text-[#18B2B0]">العمليات الأخيرة</CardTitle>
                <CardDescription>آخر العمليات التي تمت في النظام</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {adminStats?.recentTransactions && adminStats.recentTransactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#18B2B0]/20">
                        <TableHead className="text-right font-bold">الصنف</TableHead>
                        <TableHead className="text-right font-bold">نوع العملية</TableHead>
                        <TableHead className="text-right font-bold">الكمية</TableHead>
                        <TableHead className="text-right font-bold">الموظف</TableHead>
                        <TableHead className="text-right font-bold">المنطقة</TableHead>
                        <TableHead className="text-right font-bold">السبب</TableHead>
                        <TableHead className="text-right font-bold">التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminStats.recentTransactions.map((transaction) => (
                        <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`} className="hover:bg-[#18B2B0]/5 transition-colors">
                          <TableCell className="text-right font-medium">{transaction.itemName}</TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant={transaction.type === "add" ? "default" : "destructive"}
                              className={transaction.type === "add" ? "bg-gradient-to-r from-green-500 to-emerald-500" : ""}
                            >
                              {transaction.type === "add" ? "إضافة" : "سحب"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="border-[#18B2B0] text-[#18B2B0] font-bold">{transaction.quantity}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{transaction.userName}</TableCell>
                          <TableCell className="text-right">{transaction.regionName}</TableCell>
                          <TableCell className="text-right">{transaction.reason || "غير محدد"}</TableCell>
                          <TableCell className="text-right">
                            {new Date(transaction.createdAt!).toLocaleDateString("ar-SA")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Database className="h-16 w-16 text-[#18B2B0]/30 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">لا توجد عمليات حتى الآن</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
