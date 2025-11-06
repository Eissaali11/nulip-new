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
  Sparkles
} from "lucide-react";
import CreateWarehouseModal from "@/components/create-warehouse-modal";
import bannerImage from "@assets/Gemini_Generated_Image_jt32tojt32tojt32_1762464288242.png";

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

  const { data: warehouses = [], isLoading } = useQuery<WarehouseData[]>({
    queryKey: ["/api/warehouses"],
  });

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
      {/* Animated Banner */}
      <div className="relative overflow-hidden h-80 shadow-2xl">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={bannerImage}
            alt="Warehouses Banner"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#18B2B0]/60 via-slate-900/30 to-slate-900/50"></div>

        {/* Content Section */}
        <div className="relative h-full flex flex-col justify-between px-6 py-6">
          {/* Top Section - Back Button */}
          <div>
            <Link href="/admin">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <Button 
                  variant="secondary" 
                  className="bg-white/20 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/30 shadow-2xl transition-all duration-300"
                  data-testid="button-back-admin"
                >
                  <ArrowRight className="h-4 w-4 ml-2" />
                  <LayoutDashboard className="h-4 w-4 ml-2" />
                  العودة للوحة الإدارة
                </Button>
              </motion.div>
            </Link>
          </div>


          {/* Spacer for layout */}
          <div></div>
        </div>

        {/* Bottom Gradient */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </div>

      {/* Warehouses Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Add Warehouse Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">إدارة المستودعات</h2>
            <p className="text-gray-600 mt-1">تحكم كامل في مستودعاتك ومخزونك</p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600 shadow-xl text-white"
              data-testid="button-create-warehouse"
            >
              <Plus className="h-5 w-5 ml-2" />
              إضافة مستودع جديد
            </Button>
          </motion.div>
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
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={() => setShowCreateModal(true)}
                size="lg"
                className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600 shadow-lg text-lg px-8"
                data-testid="button-create-warehouse-empty"
              >
                <Plus className="h-5 w-5 ml-2" />
                إضافة مستودع جديد
              </Button>
            </motion.div>
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
