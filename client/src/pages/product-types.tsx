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
import { Plus, Package, Trash2, Edit, Power, PowerOff, Search, ArrowUpDown, Box, Hash, ArrowRight, LayoutDashboard, Sparkles, Layers } from "lucide-react";
import type { ProductType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Link } from "wouter";

const productTypeFormSchema = z.object({
  name: z.string().min(1, "اسم الصنف مطلوب"),
  code: z.string().min(1, "كود الصنف مطلوب").regex(/^[a-zA-Z0-9_]+$/, "الكود يجب أن يحتوي على حروف إنجليزية وأرقام فقط"),
  category: z.enum(["devices", "sim", "papers", "accessories", "general"]),
  packagingType: z.enum(["box_only", "unit_only", "both"]),
  unitsPerBox: z.number().min(1).optional().default(10),
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
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof productTypeFormSchema>) => 
      apiRequest("POST", "/api/product-types", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/product-types/active"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/product-types/active"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/product-types/active"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/product-types/active"] });
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
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden" dir="rtl">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10 space-y-8">
        {/* Navigation */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex justify-start"
        >
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-slate-400 hover:text-primary hover:bg-white/5 transition-all">
              <ArrowRight className="h-4 w-4" />
              <span>العودة للرئيسية</span>
            </Button>
          </Link>
        </motion.div>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-2">
              <Sparkles className="w-3 h-3" />
              <span>إعدادات النظام المتطورة</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-lg shadow-primary/20">
                <Package className="h-10 w-10 text-white" />
              </div>
              إدارة الأصناف
            </h1>
            <p className="text-slate-400 max-w-lg text-lg">
              تحكم كامل في أنواع المنتجات، الفئات، وطرق التغليف الديناميكية في نظام StockPro.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Dialog open={showModal} onOpenChange={handleCloseModal}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingProduct(null);
                    form.reset();
                    setShowModal(true);
                  }}
                  className="h-14 px-8 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-3"
                >
                  <Plus className="h-6 w-6" />
                  إضافة صنف جديد
                </Button>
              </DialogTrigger>
              {/* Modal content remains similar but styled */}
              <DialogContent className="max-w-md bg-[#0f0f15] border-white/10 text-white" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">
                    {editingProduct ? "تعديل بيانات الصنف" : "تعريف صنف جديد"}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {editingProduct 
                      ? "قم بتحديث معلومات الصنف بدقة لضمان دقة التقارير" 
                      : "أدخل البيانات الأساسية للصنف الجديد ليتم اعتماده في المستودعات"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 pt-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">اسم الصنف</FormLabel>
                          <FormControl>
                            <Input placeholder="مثال: Lebara Sim" className="bg-white/5 border-white/10 h-12 focus:border-primary focus:ring-1 focus:ring-primary" {...field} />
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
                          <FormLabel className="text-slate-300">الكود البرمجي (Unique Code)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="مثال: lebara_sim" 
                              className="bg-white/5 border-white/10 h-12 font-mono uppercase"
                              {...field} 
                              disabled={!!editingProduct}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">الفئة</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white/5 border-white/10 h-12">
                                  <SelectValue placeholder="اختر الفئة" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-[#1a1a24] border-white/10 text-white">
                                <SelectItem value="devices">أجهزة</SelectItem>
                                <SelectItem value="sim">شرائح</SelectItem>
                                <SelectItem value="papers">مستلزمات</SelectItem>
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
                            <FormLabel className="text-slate-300">نوع التعبئة</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white/5 border-white/10 h-12">
                                  <SelectValue placeholder="التغليف" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-[#1a1a24] border-white/10 text-white">
                                <SelectItem value="both">كرتون ومفرد</SelectItem>
                                <SelectItem value="box_only">كرتون فقط</SelectItem>
                                <SelectItem value="unit_only">مفرد فقط</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch("packagingType") !== "unit_only" && (
                      <FormField
                        control={form.control}
                        name="unitsPerBox"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">السعة (وحدة/كرتون)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                className="bg-white/5 border-white/10 h-12"
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
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-xl border border-white/10 p-4 bg-white/5">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-bold text-white">تفعيل الصنف</FormLabel>
                            <FormDescription className="text-xs text-slate-400">
                              يسمح بظهور الصنف في عمليات الجرد والنقل
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
                    <div className="flex gap-3 pt-2">
                      <Button 
                        type="submit" 
                        className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-bold"
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        {editingProduct ? "حفظ التغييرات" : "اعتماد الصنف"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="h-12 border-white/10 bg-white/5 hover:bg-white/10"
                        onClick={() => handleCloseModal(false)}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "إجمالي الأنواع", value: productTypes.length, icon: Layers, color: "text-blue-400", bg: "bg-blue-400/10" },
            { label: "نشط حالياً", value: activeCount, icon: Power, color: "text-green-400", bg: "bg-green-400/10" },
            { label: "معطل", value: inactiveCount, icon: PowerOff, color: "text-slate-400", bg: "bg-slate-400/10" },
            { label: "الفئات المستخدمة", value: new Set(productTypes.map(p => p.category)).size, icon: LayoutDashboard, color: "text-purple-400", bg: "bg-purple-400/10" }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-md overflow-hidden relative group hover:border-primary/30 transition-all">
                <div className={`absolute top-0 right-0 w-1 h-full ${stat.bg.replace('/10', '')}`} />
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-white">{stat.value}</p>
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Area */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
          <CardHeader className="border-b border-white/5 p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-primary" />
                <CardTitle className="text-2xl font-bold">قائمة التعريفات</CardTitle>
              </div>
              <div className="relative w-full md:w-80 group">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="بحث عن صنف، كود، أو فئة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 pr-12 bg-black/20 border-white/10 focus:border-primary rounded-2xl transition-all placeholder:text-slate-600"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-right text-slate-400 font-bold h-14">الصنف</TableHead>
                    <TableHead className="text-right text-slate-400 font-bold">التصنيف</TableHead>
                    <TableHead className="text-right text-slate-400 font-bold">نظام التعبئة</TableHead>
                    <TableHead className="text-right text-slate-400 font-bold">السعة</TableHead>
                    <TableHead className="text-right text-slate-400 font-bold">الحالة</TableHead>
                    <TableHead className="text-center text-slate-400 font-bold">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i} className="border-white/5"><TableCell colSpan={6} className="h-16 animate-pulse bg-white/5" /></TableRow>
                    ))
                  ) : filteredProducts.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-64 text-center text-slate-500 text-lg">لم يتم العثور على أي نتائج تطابق بحثك</TableCell></TableRow>
                  ) : (
                    filteredProducts.map((product, idx) => (
                      <motion.tr 
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.05 * idx }}
                        className="group border-white/5 hover:bg-white/10 transition-colors"
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {product.name[0]}
                            </div>
                            <div>
                              <p className="font-bold text-white text-base">{product.name}</p>
                              <code className="text-xs text-slate-500 uppercase tracking-tighter">{product.code}</code>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-white/10 hover:bg-white/20 text-slate-300 border-none px-3 py-1 rounded-lg">
                            {CATEGORY_LABELS[product.category]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400 font-medium">
                          {PACKAGING_LABELS[product.packagingType]}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {product.packagingType !== "unit_only" ? (
                            <div className="flex items-center gap-2">
                              <span className="text-primary font-black">{product.unitsPerBox}</span>
                              <span className="text-xs opacity-50">وحدة/كرتون</span>
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`border-none rounded-full px-4 ${product.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${product.isActive ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                            {product.isActive ? "نشط" : "معطل"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(product)}
                              className="hover:bg-blue-500/20 hover:text-blue-400 rounded-xl"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleActiveMutation.mutate(product.id)}
                              className={`rounded-xl ${product.isActive ? "hover:bg-orange-500/20 hover:text-orange-400" : "hover:bg-green-500/20 hover:text-green-400"}`}
                            >
                              {product.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("سيتم حذف الصنف نهائياً، هل أنت متأكد؟")) {
                                  deleteMutation.mutate(product.id);
                                }
                              }}
                              className="hover:bg-red-500/20 hover:text-red-400 rounded-xl"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
