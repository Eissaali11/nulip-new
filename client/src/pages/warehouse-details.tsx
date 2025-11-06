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
  Edit,
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
    select: (data) => data.filter((t) => t.warehouseId === warehouseId),
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
      gradient: "from-blue-500 to-cyan-500"
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
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">المستودع غير موجود</h2>
        <Link href="/warehouses">
          <Button className="mt-4" data-testid="button-back-warehouses">
            العودة للمستودعات
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <Link href="/warehouses">
          <Button variant="outline" className="flex items-center space-x-2 space-x-reverse" data-testid="button-back-warehouses">
            <ArrowRight className="h-4 w-4" />
            <Warehouse className="h-4 w-4" />
            <span>العودة للمستودعات</span>
          </Button>
        </Link>
        <div className="flex-1 text-right">
          <div className="flex items-center gap-3 justify-end">
            <Badge 
              variant={warehouse.isActive ? "default" : "secondary"}
              className={warehouse.isActive ? "bg-gradient-to-r from-green-500 to-emerald-500" : ""}
              data-testid="badge-warehouse-status"
            >
              {warehouse.isActive ? "نشط" : "غير نشط"}
            </Badge>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-warehouse-name">
              {warehouse.name}
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-2 text-gray-600 dark:text-gray-400 justify-end">
            <MapPin className="h-4 w-4" />
            <span data-testid="text-warehouse-location">{warehouse.location}</span>
          </div>
          {warehouse.description && (
            <p className="mt-2 text-gray-600 dark:text-gray-400" data-testid="text-warehouse-description">
              {warehouse.description}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end flex-wrap">
        <Button
          onClick={() => setShowUpdateInventoryModal(true)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          data-testid="button-update-inventory"
        >
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث المخزون
        </Button>
        <Button
          onClick={() => setShowTransferModal(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          data-testid="button-transfer-to-technician"
        >
          <Send className="h-4 w-4 ml-2" />
          نقل إلى فني
        </Button>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
          data-testid="button-delete-warehouse"
        >
          <Trash2 className="h-4 w-4 ml-2" />
          حذف المستودع
        </Button>
      </div>

      {/* Inventory Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Package className="h-5 w-5" />
            المخزون الحالي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {inventoryItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-lg border bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900"
                data-testid={`inventory-item-${index}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${item.gradient} text-white`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold">{item.name}</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                    <p className="text-xs text-gray-600 dark:text-gray-400">كراتين</p>
                    <p className="text-lg font-bold text-blue-600" data-testid={`boxes-${index}`}>{item.boxes}</p>
                  </div>
                  <div className="text-center p-2 rounded bg-purple-50 dark:bg-purple-900/20">
                    <p className="text-xs text-gray-600 dark:text-gray-400">وحدات</p>
                    <p className="text-lg font-bold text-purple-600" data-testid={`units-${index}`}>{item.units}</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400">الإجمالي</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white" data-testid={`total-${index}`}>
                    {item.boxes + item.units}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>

      {/* Transfer History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <History className="h-5 w-5" />
            سجل النقل
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transfersLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : transfers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              لا توجد عمليات نقل حتى الآن
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الفني</TableHead>
                  <TableHead className="text-right">الأصناف</TableHead>
                  <TableHead className="text-right">ملاحظات</TableHead>
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

                  return (
                    <TableRow key={transfer.id} data-testid={`transfer-row-${transfer.id}`}>
                      <TableCell className="text-right" data-testid={`transfer-date-${transfer.id}`}>
                        {formatDistanceToNow(new Date(transfer.createdAt), { addSuffix: true, locale: ar })}
                      </TableCell>
                      <TableCell className="text-right" data-testid={`transfer-technician-${transfer.id}`}>
                        {transfer.technicianName}
                      </TableCell>
                      <TableCell className="text-right" data-testid={`transfer-items-${transfer.id}`}>
                        {items.join(", ")}
                      </TableCell>
                      <TableCell className="text-right" data-testid={`transfer-notes-${transfer.id}`}>
                        {transfer.notes || "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف المستودع؟</AlertDialogTitle>
            <AlertDialogDescription>
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
