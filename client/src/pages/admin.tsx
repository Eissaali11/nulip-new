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
import { Plus, Users, MapPin, Activity, Trash2, Edit, ArrowRight, LayoutDashboard } from "lucide-react";
import type { RegionWithStats, UserSafe, AdminStats, Region, InsertRegion, InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
      // Only include password if it's not empty
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
      password: "", // Don't pre-fill password
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Link href="/">
          <Button variant="outline" className="flex items-center space-x-2 space-x-reverse" data-testid="button-back-dashboard">
            <ArrowRight className="h-4 w-4" />
            <LayoutDashboard className="h-4 w-4" />
            <span>العودة للوحة الرئيسية</span>
          </Button>
        </Link>
        <div className="text-right">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">لوحة الإدارة</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">إدارة المناطق والموظفين ومتابعة العمليات</p>
        </div>
      </div>

      {/* Stats Cards */}
      {adminStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي المناطق</p>
                  <p className="text-2xl font-bold text-primary">{adminStats.totalRegions}</p>
                </div>
                <MapPin className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي الموظفين</p>
                  <p className="text-2xl font-bold text-green-600">{adminStats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الموظفين النشطين</p>
                  <p className="text-2xl font-bold text-blue-600">{adminStats.activeUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي العمليات</p>
                  <p className="text-2xl font-bold text-orange-600">{adminStats.totalTransactions}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="regions" className="w-full" key={`admin-tabs-${Date.now()}`}>
        <TabsList className="grid w-full grid-cols-3 bg-muted p-1 h-10">
          <TabsTrigger value="regions" data-testid="tab-regions" className="data-[state=active]:bg-background">إدارة المناطق</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users" className="data-[state=active]:bg-background">إدارة الموظفين</TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions" className="data-[state=active]:bg-background">العمليات الأخيرة</TabsTrigger>
        </TabsList>

        {/* Regions Tab */}
        <TabsContent value="regions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">المناطق</h2>
            <Dialog open={showRegionModal} onOpenChange={setShowRegionModal}>
              <DialogTrigger asChild>
                <Button onClick={() => setShowRegionModal(true)} data-testid="button-add-region">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة منطقة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" data-testid="modal-region">
                <DialogHeader>
                  <DialogTitle>{editingRegion ? "تحديث المنطقة" : "إضافة منطقة جديدة"}</DialogTitle>
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
                            <Input placeholder="أدخل اسم المنطقة" {...field} data-testid="input-region-name" />
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
                            <Textarea placeholder="أدخل وصف المنطقة" {...field} data-testid="input-region-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={regionForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
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
                      <Button type="submit" disabled={createRegionMutation.isPending || updateRegionMutation.isPending} data-testid="button-save-region">
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

          <Card>
            <CardHeader>
              <CardTitle>قائمة المناطق</CardTitle>
              <CardDescription>جميع المناطق المسجلة في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم المنطقة</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">عدد الأصناف</TableHead>
                    <TableHead className="text-right">إجمالي الكمية</TableHead>
                    <TableHead className="text-right">المخزون المنخفض</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regions.map((region) => (
                    <TableRow key={region.id} data-testid={`row-region-${region.id}`}>
                      <TableCell className="font-medium text-right">{region.name}</TableCell>
                      <TableCell className="text-right">{region.description || "لا يوجد"}</TableCell>
                      <TableCell className="text-right">{region.itemCount}</TableCell>
                      <TableCell className="text-right">{region.totalQuantity}</TableCell>
                      <TableCell className="text-right">{region.lowStockCount}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={region.isActive ? "default" : "secondary"}>
                          {region.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditRegion(region)} data-testid={`button-edit-region-${region.id}`}>
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
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">الموظفين</h2>
            <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
              <DialogTrigger asChild>
                <Button onClick={() => setShowUserModal(true)} data-testid="button-add-user">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة موظف جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" data-testid="modal-user">
                <DialogHeader>
                  <DialogTitle>{editingUser ? "تحديث بيانات الموظف" : "إضافة موظف جديد"}</DialogTitle>
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
                            <Input placeholder="أدخل الاسم الكامل" {...field} data-testid="input-user-fullname" />
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
                            <Input placeholder="أدخل اسم المستخدم" {...field} data-testid="input-user-username" />
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
                            <Input type="email" placeholder="أدخل البريد الإلكتروني" {...field} data-testid="input-user-email" />
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
                              <SelectTrigger data-testid="select-user-role">
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
                              <SelectTrigger data-testid="select-user-region">
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
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
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
                      <Button type="submit" disabled={createUserMutation.isPending || updateUserMutation.isPending} data-testid="button-save-user">
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

          <Card>
            <CardHeader>
              <CardTitle>قائمة الموظفين</CardTitle>
              <CardDescription>جميع الموظفين المسجلين في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم الكامل</TableHead>
                    <TableHead className="text-right">اسم المستخدم</TableHead>
                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right">الدور</TableHead>
                    <TableHead className="text-right">المنطقة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const userRegion = regions.find(r => r.id === user.regionId);
                    return (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell className="font-medium text-right">{user.fullName}</TableCell>
                        <TableCell className="text-right">{user.username}</TableCell>
                        <TableCell className="text-right">{user.email}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role === "admin" ? "مدير" : "موظف"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{userRegion?.name || "غير محدد"}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "نشط" : "غير نشط"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditUser(user)} data-testid={`button-edit-user-${user.id}`}>
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
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>العمليات الأخيرة</CardTitle>
              <CardDescription>آخر العمليات التي تمت في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              {adminStats?.recentTransactions && adminStats.recentTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الصنف</TableHead>
                      <TableHead className="text-right">نوع العملية</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">الموظف</TableHead>
                      <TableHead className="text-right">المنطقة</TableHead>
                      <TableHead className="text-right">السبب</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminStats.recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                        <TableCell className="text-right">{transaction.itemName}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={transaction.type === "add" ? "default" : "destructive"}>
                            {transaction.type === "add" ? "إضافة" : "سحب"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{transaction.quantity}</TableCell>
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
                <p className="text-center text-gray-500 py-8">لا توجد عمليات حتى الآن</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}