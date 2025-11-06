import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Warehouse, 
  MapPin, 
  Package,
  Trash2,
  ArrowRight,
  Box,
  FileText,
  Sticker,
  Battery,
  Smartphone,
  Send,
  History,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import UpdateWarehouseInventoryModal from "@/components/update-warehouse-inventory-modal";
import TransferFromWarehouseModal from "@/components/transfer-from-warehouse-modal";

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

interface WarehouseTransferRaw {
  id: string;
  warehouseId: string;
  technicianId: string;
  technicianName: string;
  itemType: string;
  packagingType: string;
  quantity: number;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  respondedAt?: string;
  createdAt: string;
}

interface WarehouseTransfer {
  id: string;
  warehouseId: string;
  technicianId: string;
  technicianName: string;
  n950?: number;
  n950PackagingType?: string;
  i9000s?: number;
  i9000sPackagingType?: string;
  i9100?: number;
  i9100PackagingType?: string;
  rollPaper?: number;
  rollPaperPackagingType?: string;
  stickers?: number;
  stickersPackagingType?: string;
  newBatteries?: number;
  newBatteriesPackagingType?: string;
  mobilySim?: number;
  mobilySimPackagingType?: string;
  stcSim?: number;
  stcSimPackagingType?: string;
  zainSim?: number;
  zainSimPackagingType?: string;
  notes?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  respondedAt?: string;
  createdAt: string;
}

export default function WarehouseDetailsPage() {
  const [, params] = useRoute("/warehouses/:id");
  const warehouseId = params?.id || "";
  const { toast } = useToast();

  const [showUpdateInventoryModal, setShowUpdateInventoryModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: warehouse, isLoading: warehouseLoading } = useQuery<WarehouseData>({
    queryKey: ["/api/warehouses", warehouseId],
    enabled: !!warehouseId,
  });

  const { data: transfers = [], isLoading: transfersLoading } = useQuery<WarehouseTransfer[]>({
    queryKey: ["/api/warehouse-transfers"],
    select: (rawData: WarehouseTransferRaw[]) => {
      const filtered = rawData.filter((t) => t.warehouseId === warehouseId);
      
      const grouped = filtered.reduce((acc, transfer) => {
        const key = `${transfer.technicianId}-${transfer.createdAt}-${transfer.notes || ''}`;
        
        if (!acc[key]) {
          acc[key] = {
            id: transfer.id,
            warehouseId: transfer.warehouseId,
            technicianId: transfer.technicianId,
            technicianName: transfer.technicianName,
            notes: transfer.notes,
            status: transfer.status,
            rejectionReason: transfer.rejectionReason,
            respondedAt: transfer.respondedAt,
            createdAt: transfer.createdAt,
          };
        }
        
        acc[key][transfer.itemType] = transfer.quantity;
        acc[key][`${transfer.itemType}PackagingType`] = transfer.packagingType;
        
        return acc;
      }, {} as Record<string, WarehouseTransfer>);
      
      return Object.values(grouped);
    },
  });

  const deleteWarehouseMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/warehouses/${warehouseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({
        title: "تم حذف المستودع",
        description: "تم حذف المستودع بنجاح",
      });
      window.location.href = "/warehouses";
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "حدث خطأ أثناء حذف المستودع",
        variant: "destructive",
      });
    },
  });

  const inventoryItems = [
    { 
      name: "أجهزة N950", 
      boxes: warehouse?.inventory?.n950Boxes || 0,
      units: warehouse?.inventory?.n950Units || 0,
      icon: Box,
      gradient: "from-[#18B2B0] to-teal-500"
    },
    { 
      name: "أجهزة I9000s", 
      boxes: warehouse?.inventory?.i9000sBoxes || 0,
      units: warehouse?.inventory?.i9000sUnits || 0,
      icon: Box,
      gradient: "from-purple-500 to-pink-500"
    },
    { 
      name: "أجهزة I9100", 
      boxes: warehouse?.inventory?.i9100Boxes || 0,
      units: warehouse?.inventory?.i9100Units || 0,
      icon: Box,
      gradient: "from-indigo-500 to-blue-500"
    },
    { 
      name: "ورق الطباعة", 
      boxes: warehouse?.inventory?.rollPaperBoxes || 0,
      units: warehouse?.inventory?.rollPaperUnits || 0,
      icon: FileText,
      gradient: "from-amber-500 to-orange-500"
    },
    { 
      name: "الملصقات", 
      boxes: warehouse?.inventory?.stickersBoxes || 0,
      units: warehouse?.inventory?.stickersUnits || 0,
      icon: Sticker,
      gradient: "from-pink-500 to-rose-500"
    },
    { 
      name: "البطاريات الجديدة", 
      boxes: warehouse?.inventory?.newBatteriesBoxes || 0,
      units: warehouse?.inventory?.newBatteriesUnits || 0,
      icon: Battery,
      gradient: "from-green-500 to-emerald-500"
    },
    { 
      name: "شرائح موبايلي", 
      boxes: warehouse?.inventory?.mobilySimBoxes || 0,
      units: warehouse?.inventory?.mobilySimUnits || 0,
      icon: Smartphone,
      gradient: "from-teal-500 to-cyan-500"
    },
    { 
      name: "شرائح STC", 
      boxes: warehouse?.inventory?.stcSimBoxes || 0,
      units: warehouse?.inventory?.stcSimUnits || 0,
      icon: Smartphone,
      gradient: "from-blue-600 to-indigo-600"
    },
    { 
      name: "شرائح زين", 
      boxes: warehouse?.inventory?.zainSimBoxes || 0,
      units: warehouse?.inventory?.zainSimUnits || 0,
      icon: Smartphone,
      gradient: "from-purple-600 to-violet-600"
    },
  ];

  if (warehouseLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-[#18B2B0] to-teal-500 text-white mb-6">
            <Warehouse className="h-12 w-12" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">المستودع غير موجود</h2>
          <Link href="/warehouses">
            <Button className="bg-gradient-to-r from-[#18B2B0] to-teal-500" data-testid="button-back-warehouses">
              العودة للمستودعات
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalInventory = inventoryItems.reduce((sum, item) => sum + item.boxes + item.units, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50" dir="rtl">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#18B2B0] via-teal-500 to-cyan-500 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/5"></div>
        
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="relative px-6 py-8">
          <Link href="/warehouses">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <Button 
                variant="secondary" 
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 shadow-lg"
                data-testid="button-back-warehouses"
              >
                <ArrowRight className="h-4 w-4 ml-2" />
                <Warehouse className="h-4 w-4 ml-2" />
                العودة للمستودعات
              </Button>
            </motion.div>
          </Link>
          
          <motion.div 
            className="text-center mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-4 mb-3">
              <Badge 
                variant={warehouse.isActive ? "default" : "secondary"}
                className={warehouse.isActive ? "bg-white/20 backdrop-blur-sm text-white border-white/30 shadow-lg text-lg px-4 py-2" : "text-lg px-4 py-2"}
                data-testid="badge-warehouse-status"
              >
                {warehouse.isActive ? "● نشط" : "○ غير نشط"}
              </Badge>
            </div>
            <h1 className="text-5xl font-black text-white mb-3 drop-shadow-lg" data-testid="text-warehouse-name">
              {warehouse.name}
            </h1>
            <div className="flex items-center gap-2 justify-center text-white/90 text-lg mb-2">
              <MapPin className="h-5 w-5" />
              <span data-testid="text-warehouse-location">{warehouse.location}</span>
            </div>
            {warehouse.description && (
              <p className="mt-2 text-white/80 max-w-2xl mx-auto text-lg" data-testid="text-warehouse-description">
                {warehouse.description}
              </p>
            )}
            
            <div className="mt-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 text-white">
              <TrendingUp className="h-5 w-5" />
              <span className="font-bold text-lg">إجمالي المخزون:</span>
              <span className="text-2xl font-black">{totalInventory}</span>
              <span>قطعة</span>
            </div>
          </motion.div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-3 justify-center flex-wrap">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setShowUpdateInventoryModal(true)}
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg text-lg"
              data-testid="button-update-inventory"
            >
              <RefreshCw className="h-5 w-5 ml-2" />
              تحديث المخزون
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setShowTransferModal(true)}
              size="lg"
              className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600 shadow-lg text-lg"
              data-testid="button-transfer-to-technician"
            >
              <Send className="h-5 w-5 ml-2" />
              نقل إلى فني
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="shadow-lg text-lg"
              data-testid="button-delete-warehouse"
            >
              <Trash2 className="h-5 w-5 ml-2" />
              حذف المستودع
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <Card className="border-2 border-[#18B2B0]/20 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b-2 border-[#18B2B0]/10 bg-gradient-to-r from-[#18B2B0]/5 to-teal-50/50">
            <CardTitle className="flex items-center gap-3 text-right text-2xl">
              <div className="p-2 rounded-lg bg-gradient-to-r from-[#18B2B0] to-teal-500 text-white">
                <Package className="h-6 w-6" />
              </div>
              المخزون الحالي
              <Sparkles className="h-5 w-5 text-[#18B2B0] mr-auto" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {inventoryItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="p-5 rounded-xl border-2 border-gray-100 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all"
                  data-testid={`inventory-item-${index}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${item.gradient} text-white shadow-md`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-lg">{item.name}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:bg-blue-900/20 border border-blue-100">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">كراتين</p>
                      <p className="text-2xl font-black text-blue-600" data-testid={`boxes-${index}`}>{item.boxes}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:bg-purple-900/20 border border-purple-100">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">وحدات</p>
                      <p className="text-2xl font-black text-purple-600" data-testid={`units-${index}`}>{item.units}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t-2 border-gray-100 text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">الإجمالي</p>
                    <p className="text-3xl font-black bg-gradient-to-r from-[#18B2B0] to-teal-500 bg-clip-text text-transparent" data-testid={`total-${index}`}>
                      {item.boxes + item.units}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer History */}
      <div className="max-w-7xl mx-auto px-6 pb-10">
        <Card className="border-2 border-[#18B2B0]/20 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b-2 border-[#18B2B0]/10 bg-gradient-to-r from-[#18B2B0]/5 to-teal-50/50">
            <CardTitle className="flex items-center gap-3 text-right text-2xl">
              <div className="p-2 rounded-lg bg-gradient-to-r from-[#18B2B0] to-teal-500 text-white">
                <History className="h-6 w-6" />
              </div>
              سجل النقل
              <Badge className="mr-auto bg-[#18B2B0]">{transfers.length} عملية</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {transfersLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : transfers.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 mb-4">
                  <History className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-semibold">
                  لا توجد عمليات نقل حتى الآن
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-[#18B2B0]/5 to-teal-50/50">
                      <TableHead className="text-right font-bold">التاريخ</TableHead>
                      <TableHead className="text-right font-bold">الفني</TableHead>
                      <TableHead className="text-right font-bold">الأصناف المنقولة</TableHead>
                      <TableHead className="text-right font-bold">الحالة</TableHead>
                      <TableHead className="text-right font-bold">ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map((transfer) => {
                      const items: string[] = [];
                      if (transfer.n950) items.push(`N950: ${transfer.n950} ${transfer.n950PackagingType === 'box' ? 'كرتون' : 'وحدة'}`);
                      if (transfer.i9000s) items.push(`I9000s: ${transfer.i9000s} ${transfer.i9000sPackagingType === 'box' ? 'كرتون' : 'وحدة'}`);
                      if (transfer.i9100) items.push(`I9100: ${transfer.i9100} ${transfer.i9100PackagingType === 'box' ? 'كرتون' : 'وحدة'}`);
                      if (transfer.rollPaper) items.push(`ورق: ${transfer.rollPaper} ${transfer.rollPaperPackagingType === 'box' ? 'كرتون' : 'وحدة'}`);
                      if (transfer.stickers) items.push(`ملصقات: ${transfer.stickers} ${transfer.stickersPackagingType === 'box' ? 'كرتون' : 'وحدة'}`);
                      if (transfer.newBatteries) items.push(`بطاريات: ${transfer.newBatteries} ${transfer.newBatteriesPackagingType === 'box' ? 'كرتون' : 'وحدة'}`);
                      if (transfer.mobilySim) items.push(`موبايلي: ${transfer.mobilySim} ${transfer.mobilySimPackagingType === 'box' ? 'كرتون' : 'وحدة'}`);
                      if (transfer.stcSim) items.push(`STC: ${transfer.stcSim} ${transfer.stcSimPackagingType === 'box' ? 'كرتون' : 'وحدة'}`);
                      if (transfer.zainSim) items.push(`زين: ${transfer.zainSim} ${transfer.zainSimPackagingType === 'box' ? 'كرتون' : 'وحدة'}`);

                      const getStatusBadge = (status?: string) => {
                        switch (status) {
                          case 'pending':
                            return (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                <Clock className="h-3 w-3 mr-1" />
                                قيد الانتظار
                              </Badge>
                            );
                          case 'accepted':
                            return (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                مقبول
                              </Badge>
                            );
                          case 'rejected':
                            return (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                <XCircle className="h-3 w-3 mr-1" />
                                مرفوض
                              </Badge>
                            );
                          default:
                            return (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                -
                              </Badge>
                            );
                        }
                      };

                      return (
                        <TableRow key={transfer.id} className="hover:bg-[#18B2B0]/5 transition-colors" data-testid={`transfer-row-${transfer.id}`}>
                          <TableCell className="text-right" data-testid={`transfer-date-${transfer.id}`}>
                            <Badge variant="outline" className="font-mono">
                              {formatDistanceToNow(new Date(transfer.createdAt), { addSuffix: true, locale: ar })}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold" data-testid={`transfer-technician-${transfer.id}`}>
                            {transfer.technicianName}
                          </TableCell>
                          <TableCell className="text-right" data-testid={`transfer-items-${transfer.id}`}>
                            <div className="flex flex-wrap gap-1">
                              {items.map((item, idx) => (
                                <Badge key={idx} className="bg-[#18B2B0]/10 text-[#18B2B0] border-[#18B2B0]/20">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right" data-testid={`transfer-status-${transfer.id}`}>
                            {getStatusBadge(transfer.status)}
                          </TableCell>
                          <TableCell className="text-right text-sm text-gray-600" data-testid={`transfer-notes-${transfer.id}`}>
                            {transfer.notes || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <UpdateWarehouseInventoryModal
        open={showUpdateInventoryModal}
        onOpenChange={setShowUpdateInventoryModal}
        warehouseId={warehouseId}
        currentInventory={warehouse.inventory}
      />

      <TransferFromWarehouseModal
        open={showTransferModal}
        onOpenChange={setShowTransferModal}
        warehouseId={warehouseId}
        warehouseName={warehouse.name}
        currentInventory={warehouse.inventory}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">هل أنت متأكد من حذف المستودع؟</AlertDialogTitle>
            <AlertDialogDescription className="text-lg">
              سيتم حذف المستودع "{warehouse.name}" وجميع بياناته بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteWarehouseMutation.mutate()}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteWarehouseMutation.isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
