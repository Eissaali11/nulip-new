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
  LayoutDashboard 
} from "lucide-react";
import CreateWarehouseModal from "@/components/create-warehouse-modal";

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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Link href="/admin">
          <Button variant="outline" className="flex items-center space-x-2 space-x-reverse" data-testid="button-back-admin">
            <ArrowRight className="h-4 w-4" />
            <LayoutDashboard className="h-4 w-4" />
            <span>العودة للوحة الإدارة</span>
          </Button>
        </Link>
        <div className="text-right">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 justify-end">
            <Warehouse className="h-8 w-8" />
            إدارة المستودعات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">عرض وإدارة جميع المستودعات</p>
        </div>
      </div>

      {/* Add Warehouse Button */}
      <div className="flex justify-start">
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          data-testid="button-create-warehouse"
        >
          <Plus className="h-5 w-5 ml-2" />
          إضافة مستودع جديد
        </Button>
      </div>

      {/* Warehouses Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
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
          className="text-center py-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white mb-4">
            <Warehouse className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            لا توجد مستودعات
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            ابدأ بإضافة مستودع جديد لإدارة المخزون
          </p>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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
                    className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-2 hover:border-primary"
                    data-testid={`card-warehouse-${warehouse.id}`}
                  >
                    <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                    <CardContent className="p-6 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 text-right">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors" data-testid={`text-warehouse-name-${warehouse.id}`}>
                            {warehouse.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-2 text-gray-600 dark:text-gray-400 text-sm">
                            <MapPin className="h-4 w-4" />
                            <span data-testid={`text-warehouse-location-${warehouse.id}`}>{warehouse.location}</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                          <Warehouse className="h-6 w-6" />
                        </div>
                      </div>

                      {/* Description */}
                      {warehouse.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2" data-testid={`text-warehouse-description-${warehouse.id}`}>
                          {warehouse.description}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                        <div className="text-center p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Package className="h-4 w-4 text-green-600" />
                          </div>
                          <p className="text-2xl font-bold text-green-600" data-testid={`text-total-items-${warehouse.id}`}>{totalItems}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">إجمالي القطع</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                          </div>
                          <p className="text-2xl font-bold text-orange-600" data-testid={`text-low-stock-${warehouse.id}`}>{lowStockCount}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">مخزون منخفض</p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex justify-between items-center pt-3 border-t">
                        <Badge 
                          variant={warehouse.isActive ? "default" : "secondary"}
                          className={warehouse.isActive ? "bg-gradient-to-r from-green-500 to-emerald-500" : ""}
                          data-testid={`badge-status-${warehouse.id}`}
                        >
                          {warehouse.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                        <span className="text-sm text-primary font-semibold group-hover:translate-x-[-4px] transition-transform">
                          عرض التفاصيل ←
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

      {/* Create Warehouse Modal */}
      <CreateWarehouseModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
}
