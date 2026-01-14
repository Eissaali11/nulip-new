import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Package, Trash2, Edit, Power, PowerOff, Search, ArrowUpDown, Box, Hash } from "lucide-react";
import type { ProductType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const productTypeFormSchema = z.object({
  name: z.string().min(1, "اسم الصنف مطلوب"),
  code: z.string().min(1, "كود الصنف مطلوب").regex(/^[a-zA-Z0-9_]+$/, "الكود يجب أن يحتوي على حروف إنجليزية وأرقام فقط"),
  category: z.enum(["devices", "sim", "papers", "accessories", "general"]),
  packagingType: z.enum(["box_only", "unit_only", "both"]),
  unitsPerBox: z.number().min(1).optional(),
  sortOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

const CATEGORY_LABELS: Record<string, string> = {
  devices: "أجهزة",
  sim: "شرائح",
  papers: "ورق ومستلزمات",
  accessories: "اكسسوارات",
  general: "عام",
};

const PACKAGING_LABELS: Record<string, string> = {
  box_only: "كرتون فقط",
  unit_only: "مفرد فقط",
  both: "كرتون ومفرد",
};

export default function ProductTypesPage() {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: productTypes = [], isLoading } = useQuery<ProductType[]>({
    queryKey: ["/api/product-types"],
  });

  const form = useForm<z.infer<typeof productTypeFormSchema>>({
    resolver: zodResolver(productTypeFormSchema),
    defaultValues: {
      name: "",
      code: "",
      category: "general",
      packagingType: "both",
      unitsPerBox: 10,
      sortOrder: 0,
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof productTypeFormSchema>) => 
      apiRequest("POST", "/api/product-types", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
      setShowModal(false);
      form.reset();
      toast({ title: "تم إنشاء الصنف بنجاح" });
    },
    onError: (error: any) => {
      toast({ 
        title: "فشل في إنشاء الصنف", 
        description: error.message || "حدث خطأ",
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<z.infer<typeof productTypeFormSchema>> }) =>
      apiRequest("PATCH", `/api/product-types/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
      setShowModal(false);
      setEditingProduct(null);
      form.reset();
      toast({ title: "تم تحديث الصنف بنجاح" });
    },
    onError: (error: any) => {
      toast({ 
        title: "فشل في تحديث الصنف", 
        description: error.message || "حدث خطأ",
        variant: "destructive" 
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/product-types/${id}/toggle-active`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
      toast({ title: "تم تحديث حالة الصنف" });
    },
    onError: () => {
      toast({ title: "فشل في تحديث الحالة", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/product-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
      toast({ title: "تم حذف الصنف بنجاح" });
    },
    onError: (error: any) => {
      toast({ 
        title: "فشل في حذف الصنف", 
        description: error.message || "لا يمكن حذف صنف مرتبط بمخزون",
        variant: "destructive" 
      });
    },
  });

  const handleEdit = (product: ProductType) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      code: product.code,
      category: product.category as any,
      packagingType: product.packagingType as any,
      unitsPerBox: product.unitsPerBox || 10,
      sortOrder: product.sortOrder || 0,
      isActive: product.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = (data: z.infer<typeof productTypeFormSchema>) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCloseModal = (open: boolean) => {
    if (!open) {
      setShowModal(false);
      setEditingProduct(null);
      form.reset();
    } else {
      setShowModal(true);
    }
  };

  const filteredProducts = productTypes.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = productTypes.filter((p) => p.isActive).length;
  const inactiveCount = productTypes.filter((p) => !p.isActive).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              إدارة الأصناف
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              إضافة وتعديل أنواع المنتجات في النظام
            </p>
          </div>
          <Dialog open={showModal} onOpenChange={handleCloseModal}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingProduct(null);
                  form.reset();
                  setShowModal(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة صنف جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "تعديل الصنف" : "إضافة صنف جديد"}
                </DialogTitle>
                <DialogDescription>
                  {editingProduct 
                    ? "قم بتعديل بيانات الصنف" 
                    : "أدخل بيانات الصنف الجديد. سيظهر تلقائياً في جميع أجزاء النظام."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم الصنف (بالعربي)</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: جهاز N950" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كود الصنف (بالإنجليزي)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="مثال: n950" 
                            {...field} 
                            disabled={!!editingProduct}
                          />
                        </FormControl>
                        <FormDescription>
                          يستخدم للتعريف الداخلي، لا يمكن تغييره لاحقاً
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الفئة</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الفئة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="devices">أجهزة</SelectItem>
                            <SelectItem value="sim">شرائح</SelectItem>
                            <SelectItem value="papers">ورق ومستلزمات</SelectItem>
                            <SelectItem value="accessories">اكسسوارات</SelectItem>
                            <SelectItem value="general">عام</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="packagingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع التغليف</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر نوع التغليف" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="both">كرتون ومفرد</SelectItem>
                            <SelectItem value="box_only">كرتون فقط</SelectItem>
                            <SelectItem value="unit_only">مفرد فقط</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch("packagingType") !== "unit_only" && (
                    <FormField
                      control={form.control}
                      name="unitsPerBox"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عدد الوحدات في الكرتون</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ترتيب العرض</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          الأرقام الأصغر تظهر أولاً
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel>نشط</FormLabel>
                          <FormDescription>
                            الأصناف غير النشطة لن تظهر في النماذج
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingProduct ? "حفظ التعديلات" : "إضافة الصنف"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => handleCloseModal(false)}>
                      إلغاء
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{productTypes.length}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الأصناف</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Power className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                  <p className="text-sm text-muted-foreground">أصناف نشطة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 rounded-full">
                  <PowerOff className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-400">{inactiveCount}</p>
                  <p className="text-sm text-muted-foreground">أصناف غير نشطة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>قائمة الأصناف</CardTitle>
                <CardDescription>
                  جميع أنواع المنتجات المتاحة في النظام
                </CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد أصناف. قم بإضافة صنف جديد."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الترتيب</TableHead>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">الكود</TableHead>
                    <TableHead className="text-right">الفئة</TableHead>
                    <TableHead className="text-right">التغليف</TableHead>
                    <TableHead className="text-right">وحدات/كرتون</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Badge variant="outline">{product.sortOrder}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm">
                          {product.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {CATEGORY_LABELS[product.category] || product.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{PACKAGING_LABELS[product.packagingType]}</TableCell>
                      <TableCell>
                        {product.packagingType !== "unit_only" ? product.unitsPerBox : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.isActive ? "default" : "secondary"}>
                          {product.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleActiveMutation.mutate(product.id)}
                            title={product.isActive ? "إلغاء التفعيل" : "تفعيل"}
                          >
                            {product.isActive ? (
                              <PowerOff className="h-4 w-4 text-orange-500" />
                            ) : (
                              <Power className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("هل أنت متأكد من حذف هذا الصنف؟")) {
                                deleteMutation.mutate(product.id);
                              }
                            }}
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
