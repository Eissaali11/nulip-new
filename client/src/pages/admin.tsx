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
import { Plus, Users, MapPin, Activity, Trash2, Edit, ArrowRight, LayoutDashboard, TrendingUp, Database, AlertTriangle } from "lucide-react";
import type { RegionWithStats, UserSafe, AdminStats, Region, InsertRegion, InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@assets/5fd20532dbfff_cropped-RASSAUDI-Logo_1762460814438.png";

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
  role: z.enum(["admin", "employee"]),
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
      role: "employee",
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
      role: user.role as "admin" | "employee",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50" dir="rtl">
      {/* Animated Logo Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#18B2B0] via-teal-500 to-[#18B2B0] shadow-2xl">
        <div className="absolute inset-0 bg-black/5"></div>
        
        {/* Animated logos - Right to Left */}
        <div className="flex gap-16 py-8 animate-[scroll-rtl_30s_linear_infinite] whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <img
              key={`rtl-${i}`}
              src={logoPath}
              alt="RAS Saudi Logo"
              className="h-16 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
            />
          ))}
        </div>

        {/* Animated logos - Left to Right (reversed) */}
        <div className="flex gap-16 py-8 animate-[scroll-ltr_25s_linear_infinite] whitespace-nowrap border-t border-white/10">
          {[...Array(10)].map((_, i) => (
            <img
              key={`ltr-${i}`}
              src={logoPath}
              alt="RAS Saudi Logo"
              className="h-16 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
            />
          ))}
        </div>

        {/* Overlay gradient for smooth edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#18B2B0] to-transparent pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#18B2B0] to-transparent pointer-events-none"></div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Navigation Header */}
        <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#18B2B0]/20">
          <Link href="/">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 hover:bg-[#18B2B0]/10 hover:border-[#18B2B0] transition-all duration-300" 
              data-testid="button-back-dashboard"
            >
              <ArrowRight className="h-5 w-5 text-[#18B2B0]" />
              <LayoutDashboard className="h-5 w-5 text-[#18B2B0]" />
              <span className="font-semibold">العودة للوحة الرئيسية</span>
            </Button>
          </Link>
          <div className="text-right">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#18B2B0] via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              لوحة الإدارة
            </h1>
            <p className="text-gray-600 mt-2 text-lg">إدارة شاملة للنظام والموظفين والعمليات</p>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        {adminStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Regions Card */}
            <Card className="relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0] via-teal-500 to-cyan-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="text-right text-white">
                    <p className="text-sm font-medium opacity-90 mb-1">إجمالي المناطق</p>
                    <p className="text-4xl font-bold">{adminStats.totalRegions}</p>
                    <p className="text-xs opacity-75 mt-2">منطقة نشطة</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                    <MapPin className="h-10 w-10 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Users Card */}
            <Card className="relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="text-right text-white">
                    <p className="text-sm font-medium opacity-90 mb-1">إجمالي الموظفين</p>
                    <p className="text-4xl font-bold">{adminStats.totalUsers}</p>
                    <p className="text-xs opacity-75 mt-2">موظف مسجل</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Users Card */}
            <Card className="relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="text-right text-white">
                    <p className="text-sm font-medium opacity-90 mb-1">الموظفين النشطين</p>
                    <p className="text-4xl font-bold">{adminStats.activeUsers}</p>
                    <p className="text-xs opacity-75 mt-2">نشط حالياً</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                    <TrendingUp className="h-10 w-10 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Transactions Card */}
            <Card className="relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="text-right text-white">
                    <p className="text-sm font-medium opacity-90 mb-1">إجمالي العمليات</p>
                    <p className="text-4xl font-bold">{adminStats.totalTransactions}</p>
                    <p className="text-xs opacity-75 mt-2">عملية منجزة</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                    <Activity className="h-10 w-10 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Tabs */}
        <Tabs defaultValue="regions" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-[#18B2B0]/20">
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

          {/* Regions Tab */}
          <TabsContent value="regions" className="space-y-4 mt-6">
            <div className="flex justify-between items-center bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-[#18B2B0]/20">
              <h2 className="text-2xl font-bold text-[#18B2B0]">المناطق</h2>
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

            <Card className="shadow-xl border-[#18B2B0]/20 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-[#18B2B0]/10 to-teal-50/50">
                <CardTitle className="text-[#18B2B0]">قائمة المناطق</CardTitle>
                <CardDescription>جميع المناطق المسجلة في النظام</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#18B2B0]/20">
                      <TableHead className="text-right font-bold">اسم المنطقة</TableHead>
                      <TableHead className="text-right font-bold">الوصف</TableHead>
                      <TableHead className="text-right font-bold">عدد الأصناف</TableHead>
                      <TableHead className="text-right font-bold">إجمالي الكمية</TableHead>
                      <TableHead className="text-right font-bold">المخزون المنخفض</TableHead>
                      <TableHead className="text-right font-bold">الحالة</TableHead>
                      <TableHead className="text-right font-bold">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regions.map((region) => (
                      <TableRow key={region.id} data-testid={`row-region-${region.id}`} className="hover:bg-[#18B2B0]/5 transition-colors">
                        <TableCell className="font-medium text-right">{region.name}</TableCell>
                        <TableCell className="text-right">{region.description || "لا يوجد"}</TableCell>
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 mt-6">
            <div className="flex justify-between items-center bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-[#18B2B0]/20">
              <h2 className="text-2xl font-bold text-[#18B2B0]">الموظفين</h2>
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
                                <SelectItem value="employee">موظف</SelectItem>
                                <SelectItem value="admin">مدير</SelectItem>
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
                              variant={user.role === "admin" ? "default" : "secondary"}
                              className={user.role === "admin" ? "bg-gradient-to-r from-[#18B2B0] to-teal-500" : ""}
                            >
                              {user.role === "admin" ? "مدير" : "موظف"}
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
