import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  XCircle,
  Search
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
  performedBy: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  respondedAt?: string;
  createdAt: string;
}

interface WarehouseTransfer {
  id: string;
  allIds: string[];
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
  const [showDeleteTransfersDialog, setShowDeleteTransfersDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransferIds, setSelectedTransferIds] = useState<Set<string>>(new Set());

  const { data: warehouse, isLoading: warehouseLoading } = useQuery<WarehouseData>({
    queryKey: ["/api/warehouses", warehouseId],
    enabled: !!warehouseId,
  });

  const { data: rawTransfers, isLoading: transfersLoading } = useQuery<WarehouseTransferRaw[]>({
    queryKey: ["/api/warehouse-transfers"],
  });

  const allTransfers: WarehouseTransfer[] = rawTransfers ? (() => {
    const filtered = rawTransfers.filter((t) => t.warehouseId === warehouseId);
    
    const grouped = filtered.reduce((acc, transfer) => {
      const date = new Date(transfer.createdAt);
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const key = `${transfer.technicianId}-${dayKey}-${transfer.performedBy}-${transfer.status}-${transfer.notes || 'no-notes'}`;
      
      if (!acc[key]) {
        acc[key] = {
          id: transfer.id,
          allIds: [],
          warehouseId: transfer.warehouseId,
          technicianId: transfer.technicianId,
          technicianName: transfer.technicianName,
          notes: transfer.notes,
          status: transfer.status,
          rejectionReason: transfer.rejectionReason,
          respondedAt: transfer.respondedAt,
          createdAt: transfer.createdAt,
        } as WarehouseTransfer;
      }
      
      acc[key].allIds.push(transfer.id);
      (acc[key] as any)[transfer.itemType] = transfer.quantity;
      (acc[key] as any)[`${transfer.itemType}PackagingType`] = transfer.packagingType;
      
      return acc;
    }, {} as Record<string, WarehouseTransfer>);
    
    return Object.values(grouped);
  })() : [];

  const transfers = allTransfers.filter(transfer => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      transfer.technicianName.toLowerCase().includes(query) ||
      (transfer.notes && transfer.notes.toLowerCase().includes(query))
    );
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

  const deleteTransfersMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return await apiRequest("DELETE", "/api/warehouse-transfers", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      setSelectedTransferIds(new Set());
      setShowDeleteTransfersDialog(false);
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف السجلات المحددة",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "حدث خطأ أثناء حذف السجلات",
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
            <div className="flex flex-col gap-4">
              <CardTitle className="flex items-center gap-3 text-right text-2xl">
                <div className="p-2 rounded-lg bg-gradient-to-r from-[#18B2B0] to-teal-500 text-white">
                  <History className="h-6 w-6" />
                </div>
                سجل النقل
                <Badge className="mr-auto bg-[#18B2B0]">{allTransfers.length} عملية</Badge>
              </CardTitle>
              
              <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="ابحث عن عملية بالفني أو الملاحظات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 border-2 border-gray-200 focus:border-[#18B2B0] focus:ring-[#18B2B0] rounded-xl shadow-sm text-right"
                    data-testid="input-search-transfers"
                  />
                </div>
                
                {selectedTransferIds.size > 0 && (
                  <Button
                    onClick={() => setShowDeleteTransfersDialog(true)}
                    variant="destructive"
                    className="flex items-center gap-2"
                    data-testid="button-delete-selected-transfers"
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف ({selectedTransferIds.size})
                  </Button>
                )}
              </div>
            </div>
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
              <div className="grid grid-cols-1 gap-4">
                {transfers.map((transfer, index) => {
                  const items: Array<{name: string, quantity: number, type: string}> = [];
                  if (transfer.n950) items.push({name: 'N950', quantity: transfer.n950, type: transfer.n950PackagingType || 'box'});
                  if (transfer.i9000s) items.push({name: 'I9000s', quantity: transfer.i9000s, type: transfer.i9000sPackagingType || 'box'});
                  if (transfer.i9100) items.push({name: 'I9100', quantity: transfer.i9100, type: transfer.i9100PackagingType || 'box'});
                  if (transfer.rollPaper) items.push({name: 'ورق', quantity: transfer.rollPaper, type: transfer.rollPaperPackagingType || 'box'});
                  if (transfer.stickers) items.push({name: 'ملصقات', quantity: transfer.stickers, type: transfer.stickersPackagingType || 'box'});
                  if (transfer.newBatteries) items.push({name: 'بطاريات', quantity: transfer.newBatteries, type: transfer.newBatteriesPackagingType || 'box'});
                  if (transfer.mobilySim) items.push({name: 'موبايلي', quantity: transfer.mobilySim, type: transfer.mobilySimPackagingType || 'box'});
                  if (transfer.stcSim) items.push({name: 'STC', quantity: transfer.stcSim, type: transfer.stcSimPackagingType || 'box'});
                  if (transfer.zainSim) items.push({name: 'زين', quantity: transfer.zainSim, type: transfer.zainSimPackagingType || 'box'});

                  const getStatusColor = (status?: string) => {
                    switch (status) {
                      case 'pending':
                        return {bg: 'from-yellow-50 to-amber-50', border: 'border-yellow-200', icon: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700'};
                      case 'accepted':
                        return {bg: 'from-green-50 to-emerald-50', border: 'border-green-200', icon: 'text-green-600', badge: 'bg-green-100 text-green-700'};
                      case 'rejected':
                        return {bg: 'from-red-50 to-rose-50', border: 'border-red-200', icon: 'text-red-600', badge: 'bg-red-100 text-red-700'};
                      default:
                        return {bg: 'from-gray-50 to-slate-50', border: 'border-gray-200', icon: 'text-gray-600', badge: 'bg-gray-100 text-gray-700'};
                    }
                  };

                  const statusColor = getStatusColor(transfer.status);
                  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
                  const isSelected = selectedTransferIds.has(transfer.id);

                  return (
                    <motion.div
                      key={transfer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative overflow-hidden rounded-xl border-2 ${statusColor.border} bg-gradient-to-r ${statusColor.bg} p-5 shadow-md hover:shadow-xl transition-all ${isSelected ? 'ring-2 ring-[#18B2B0]' : ''}`}
                      data-testid={`transfer-card-${transfer.id}`}
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#18B2B0] via-teal-400 to-cyan-400"></div>
                      
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const newSelected = new Set(selectedTransferIds);
                              if (isSelected) {
                                newSelected.delete(transfer.id);
                              } else {
                                newSelected.add(transfer.id);
                              }
                              setSelectedTransferIds(newSelected);
                            }}
                            className="cursor-pointer"
                          >
                            <Checkbox 
                              checked={isSelected}
                              className="h-5 w-5 border-2"
                              data-testid={`checkbox-transfer-${transfer.id}`}
                            />
                          </div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2.5 rounded-lg bg-white/70 ${statusColor.icon} shadow-sm`}>
                              <Send className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-800">{transfer.technicianName}</h3>
                              <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDistanceToNow(new Date(transfer.createdAt), { addSuffix: true, locale: ar })}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={`${statusColor.badge} text-sm px-3 py-1 shadow-sm`}>
                            {transfer.status === 'pending' && <><Clock className="h-3.5 w-3.5 mr-1.5" />قيد الانتظار</>}
                            {transfer.status === 'accepted' && <><CheckCircle className="h-3.5 w-3.5 mr-1.5" />مقبول</>}
                            {transfer.status === 'rejected' && <><XCircle className="h-3.5 w-3.5 mr-1.5" />مرفوض</>}
                          </Badge>
                          <Badge variant="outline" className="bg-white/70 border-[#18B2B0]/30 text-[#18B2B0] font-bold shadow-sm">
                            <Package className="h-3.5 w-3.5 mr-1.5" />
                            {totalItems} قطعة
                          </Badge>
                        </div>
                      </div>

                      <Link href={`/transfer-details/${transfer.id}`}>
                        <div className="cursor-pointer group">

                        <div className="bg-white/70 rounded-lg p-4 border border-gray-200/50 shadow-sm mb-3">
                          <p className="text-xs font-semibold text-gray-500 mb-2.5">الأصناف المنقولة</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-br from-[#18B2B0]/5 to-teal-50/50 border border-[#18B2B0]/10">
                                <Package className="h-4 w-4 text-[#18B2B0] flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-[#18B2B0] truncate">{item.name}</p>
                                  <p className="text-xs text-gray-600">
                                    {item.quantity} {item.type === 'box' ? 'كرتون' : 'وحدة'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {transfer.notes && (
                          <div className="bg-white/70 rounded-lg p-3 border border-gray-200/50 shadow-sm">
                            <p className="text-xs font-semibold text-gray-500 mb-1.5">ملاحظات</p>
                            <p className="text-sm text-gray-700">{transfer.notes}</p>
                          </div>
                        )}

                          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge className="bg-[#18B2B0] text-white text-xs shadow-md">
                              <ArrowRight className="h-3 w-3 mr-1" />
                              عرض التفاصيل
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
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

      <AlertDialog open={showDeleteTransfersDialog} onOpenChange={setShowDeleteTransfersDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">تأكيد حذف السجلات</AlertDialogTitle>
            <AlertDialogDescription className="text-lg">
              هل أنت متأكد من حذف {selectedTransferIds.size} سجل نقل؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-transfers">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const allIdsToDelete = allTransfers
                  .filter(t => selectedTransferIds.has(t.id))
                  .flatMap(t => t.allIds);
                deleteTransfersMutation.mutate(allIdsToDelete);
              }}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete-transfers"
            >
              {deleteTransfersMutation.isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
