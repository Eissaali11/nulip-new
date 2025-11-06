import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Warehouse, 
  Plus, 
  MapPin, 
  Package, 
  AlertTriangle,
  ArrowRight,
  LayoutDashboard,
  Sparkles,
  Download
} from "lucide-react";
import CreateWarehouseModal from "@/components/create-warehouse-modal";
import bannerImage from "@assets/Gemini_Generated_Image_1iknau1iknau1ikn_1762464877305.png";
import { exportWarehousesToExcel } from "@/lib/exportToExcel";
import { useToast } from "@/hooks/use-toast";

interface WarehouseInventory {
  id: string;
  warehouseId: string;
  n950Boxes: number;
  n950Units: number;
  i9000sBoxes: number;
  i9000sUnits: number;
  i9100Boxes: number;
  i9100Units: number;
  rollPaperBoxes: number;
  rollPaperUnits: number;
  stickersBoxes: number;
  stickersUnits: number;
  newBatteriesBoxes: number;
  newBatteriesUnits: number;
  mobilySimBoxes: number;
  mobilySimUnits: number;
  stcSimBoxes: number;
  stcSimUnits: number;
  zainSimBoxes: number;
  zainSimUnits: number;
}

interface WarehouseData {
  id: string;
  name: string;
  location: string;
  description: string | null;
  isActive: boolean;
  regionId: string | null;
  inventory: WarehouseInventory | null;
}

export default function WarehousesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();

  const { data: warehouses = [], isLoading } = useQuery<WarehouseData[]>({
    queryKey: ["/api/warehouses"],
  });

  const handleExportWarehouses = async () => {
    if (warehouses && warehouses.length > 0) {
      try {
        await exportWarehousesToExcel({ warehouses });
        toast({ 
          title: "تم تصدير التقرير بنجاح", 
          description: "تم حفظ ملف Excel في جهازك" 
        });
      } catch (error) {
        toast({ 
          title: "حدث خطأ أثناء التصدير", 
          description: "يرجى المحاولة مرة أخرى",
          variant: "destructive" 
        });
      }
    } else {
      toast({ 
        title: "لا توجد مستودعات للتصدير", 
        variant: "destructive" 
      });
    }
  };

  const calculateTotalItems = (inventory: WarehouseInventory | null) => {
    if (!inventory) return 0;
    return (
      inventory.n950Boxes + inventory.n950Units +
      inventory.i9000sBoxes + inventory.i9000sUnits +
      inventory.i9100Boxes + inventory.i9100Units +
      inventory.rollPaperBoxes + inventory.rollPaperUnits +
      inventory.stickersBoxes + inventory.stickersUnits +
      inventory.newBatteriesBoxes + inventory.newBatteriesUnits +
      inventory.mobilySimBoxes + inventory.mobilySimUnits +
      inventory.stcSimBoxes + inventory.stcSimUnits +
      inventory.zainSimBoxes + inventory.zainSimUnits
    );
  };

  const calculateLowStockCount = (inventory: WarehouseInventory | null) => {
    if (!inventory) return 0;
    const threshold = 5;
    let count = 0;
    
    if ((inventory.n950Boxes + inventory.n950Units) < threshold) count++;
    if ((inventory.i9000sBoxes + inventory.i9000sUnits) < threshold) count++;
    if ((inventory.i9100Boxes + inventory.i9100Units) < threshold) count++;
    if ((inventory.rollPaperBoxes + inventory.rollPaperUnits) < threshold) count++;
    if ((inventory.stickersBoxes + inventory.stickersUnits) < threshold) count++;
    if ((inventory.newBatteriesBoxes + inventory.newBatteriesUnits) < threshold) count++;
    if ((inventory.mobilySimBoxes + inventory.mobilySimUnits) < threshold) count++;
    if ((inventory.stcSimBoxes + inventory.stcSimUnits) < threshold) count++;
    if ((inventory.zainSimBoxes + inventory.zainSimUnits) < threshold) count++;
    
    return count;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50" dir="rtl">
      {/* Elegant Professional Banner */}
      <motion.div 
        className="relative overflow-hidden h-96 shadow-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Background Image with Zoom Effect */}
        <motion.div 
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <img
            src={bannerImage}
            alt="Warehouses Banner"
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Multi-Layer Gradient Overlays for Depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-[#18B2B0]/30 to-slate-900/75"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/50"></div>

        {/* Elegant Decorative Glow Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#18B2B0]/20 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-400/15 rounded-full blur-3xl opacity-50"></div>

        {/* Top Premium Border Accent */}
        <motion.div 
          className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#18B2B0] to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        ></motion.div>

        {/* Content Section */}
        <div className="relative h-full flex flex-col justify-between px-6 py-6">
          {/* Top Section - Back Button with Elegant Animation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
          >
            <Link href="/admin">
              <motion.div
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <Button 
                  variant="secondary" 
                  className="bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white hover:bg-white/20 hover:border-[#18B2B0]/60 hover:shadow-[0_0_20px_rgba(24,178,176,0.3)] shadow-2xl transition-all duration-300 group"
                  data-testid="button-back-admin"
                >
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-[-3px] transition-transform duration-300" />
                  <LayoutDashboard className="h-4 w-4 ml-2" />
                  الرجوع للقائمة الرئيسية
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Center Premium Icon with Sophisticated Animation */}
          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.9, ease: "easeOut" }}
          >
            <div className="relative">
              {/* Static Elegant Glow Effect */}
              <div className="absolute inset-0 bg-[#18B2B0]/30 rounded-full blur-2xl"></div>
              
              {/* Premium Glass Card */}
              <div className="relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl p-8 rounded-3xl border-2 border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/10 to-transparent rounded-3xl"></div>
                <Warehouse className="relative h-20 w-20 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
              </div>
            </div>
          </motion.div>

          {/* Bottom Spacer */}
          <div></div>
        </div>

        {/* Elegant Bottom Gradient Fade */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-slate-50 via-slate-50/60 to-transparent"></div>
        
        {/* Bottom Premium Border Accent */}
        <motion.div 
          className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#18B2B0]/60 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
        ></motion.div>
      </motion.div>

      {/* Warehouses Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Add Warehouse Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">إدارة المستودعات</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">تحكم كامل في مستودعاتك ومخزونك</p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto flex-wrap">
            <Button 
              onClick={handleExportWarehouses}
              variant="outline"
              className="border-2 border-[#18B2B0] text-[#18B2B0] hover:bg-[#18B2B0]/10 hover:border-[#16a09e] shadow-lg transition-all flex-1 sm:flex-none text-sm sm:text-base"
              data-testid="button-export-warehouses"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
              تصدير إلى Excel
            </Button>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600 shadow-xl text-white transition-all flex-1 sm:flex-none text-sm sm:text-base"
              data-testid="button-create-warehouse"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
              إضافة مستودع جديد
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border-2">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : warehouses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-[#18B2B0] to-teal-500 text-white mb-6 shadow-2xl">
              <Warehouse className="h-12 w-12" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              لا توجد مستودعات
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              ابدأ بإضافة أول مستودع لإدارة المخزون بكفاءة
            </p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              size="lg"
              className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600 shadow-lg text-base sm:text-lg px-6 sm:px-8 transition-all"
              data-testid="button-create-warehouse-empty"
            >
              <Plus className="h-5 w-5 ml-2" />
              إضافة مستودع جديد
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {warehouses.map((warehouse) => {
              const totalItems = calculateTotalItems(warehouse.inventory);
              const lowStockCount = calculateLowStockCount(warehouse.inventory);

              return (
                <motion.div key={warehouse.id} variants={itemVariants}>
                  <Link href={`/warehouses/${warehouse.id}`}>
                    <Card 
                      className="group hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border-2 hover:border-[#18B2B0] bg-white/80 backdrop-blur-sm"
                      data-testid={`card-warehouse-${warehouse.id}`}
                    >
                      <div className="h-2 bg-gradient-to-r from-[#18B2B0] via-teal-400 to-cyan-400" />
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 text-right">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-[#18B2B0] transition-colors" data-testid={`text-warehouse-name-${warehouse.id}`}>
                              {warehouse.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-3 text-gray-600 dark:text-gray-400">
                              <MapPin className="h-4 w-4 text-[#18B2B0]" />
                              <span data-testid={`text-warehouse-location-${warehouse.id}`}>{warehouse.location}</span>
                            </div>
                          </div>
                          <motion.div 
                            className="p-3 rounded-xl bg-gradient-to-br from-[#18B2B0] to-teal-500 text-white shadow-lg"
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.6 }}
                          >
                            <Warehouse className="h-7 w-7" />
                          </motion.div>
                        </div>

                        {warehouse.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg" data-testid={`text-warehouse-description-${warehouse.id}`}>
                            {warehouse.description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-4 border-t-2 border-gray-100">
                          <motion.div 
                            className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-100"
                            whileHover={{ scale: 1.05 }}
                          >
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <Package className="h-5 w-5 text-emerald-600" />
                            </div>
                            <p className="text-3xl font-black text-emerald-600" data-testid={`text-total-items-${warehouse.id}`}>{totalItems}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mt-1">إجمالي القطع</p>
                          </motion.div>
                          <motion.div 
                            className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-100"
                            whileHover={{ scale: 1.05 }}
                          >
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <AlertTriangle className="h-5 w-5 text-orange-600" />
                            </div>
                            <p className="text-3xl font-black text-orange-600" data-testid={`text-low-stock-${warehouse.id}`}>{lowStockCount}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mt-1">مخزون منخفض</p>
                          </motion.div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t-2 border-gray-100">
                          <Badge 
                            variant={warehouse.isActive ? "default" : "secondary"}
                            className={warehouse.isActive ? "bg-gradient-to-r from-[#18B2B0] to-teal-500 shadow-md text-white" : ""}
                            data-testid={`badge-status-${warehouse.id}`}
                          >
                            {warehouse.isActive ? "● نشط" : "○ غير نشط"}
                          </Badge>
                          <span className="text-sm text-[#18B2B0] font-bold group-hover:translate-x-[-4px] transition-transform flex items-center gap-2">
                            عرض التفاصيل
                            <Sparkles className="h-4 w-4" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      <CreateWarehouseModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
}
