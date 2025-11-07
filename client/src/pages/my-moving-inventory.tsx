import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TruckIcon, MinusCircle, ArrowRight, ArrowLeftRight, FileDown, Home, Package, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { UpdateMovingInventoryModal } from "@/components/update-moving-inventory-modal";
import { TransferToMovingModal } from "@/components/transfer-to-moving-modal";
import { useLocation } from "wouter";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface MovingInventory {
  id: string;
  technicianName: string;
  city: string;
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

interface FixedInventory {
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

interface WarehouseTransfer {
  id: string;
  warehouseId: string;
  technicianId: string;
  itemType: string;
  packagingType: string;
  quantity: number;
  performedBy: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  respondedAt?: Date;
  createdAt: Date;
  warehouseName?: string;
  technicianName?: string;
  performedByName?: string;
  itemNameAr?: string;
}

export default function MyMovingInventory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: inventory, isLoading, refetch } = useQuery<MovingInventory>({
    queryKey: [`/api/technicians/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: fixedInventory } = useQuery<FixedInventory>({
    queryKey: [`/api/technician-fixed-inventory/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: pendingTransfers } = useQuery<WarehouseTransfer[]>({
    queryKey: ["/api/warehouse-transfers", user?.id],
    enabled: !!user?.id,
    select: (data) => data.filter(t => t.status === 'pending' && t.technicianId === user?.id),
  });

  const acceptMutation = useMutation({
    mutationFn: async (transferId: string) => {
      return apiRequest("POST", `/api/warehouse-transfers/${transferId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      queryClient.invalidateQueries({ queryKey: [`/api/technicians/${user?.id}`] });
      toast({
        title: "تم القبول",
        description: "تم قبول عملية النقل بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل قبول عملية النقل",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ transferId, reason }: { transferId: string; reason?: string }) => {
      return apiRequest("POST", `/api/warehouse-transfers/${transferId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      setRejectDialogOpen(false);
      setSelectedTransferId(null);
      setRejectionReason("");
      toast({
        title: "تم الرفض",
        description: "تم رفض عملية النقل",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل رفض عملية النقل",
        variant: "destructive",
      });
    },
  });

  const handleReject = (transferId: string) => {
    setSelectedTransferId(transferId);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (selectedTransferId) {
      rejectMutation.mutate({ transferId: selectedTransferId, reason: rejectionReason });
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "تم التحديث",
      description: "تم تحديث المخزون بنجاح",
    });
  };

  const getTotalItems = () => {
    if (!inventory) return 0;
    return (
      (inventory.n950Boxes || 0) + (inventory.n950Units || 0) +
      (inventory.i9000sBoxes || 0) + (inventory.i9000sUnits || 0) +
      (inventory.i9100Boxes || 0) + (inventory.i9100Units || 0) +
      (inventory.rollPaperBoxes || 0) + (inventory.rollPaperUnits || 0) +
      (inventory.stickersBoxes || 0) + (inventory.stickersUnits || 0) +
      (inventory.newBatteriesBoxes || 0) + (inventory.newBatteriesUnits || 0) +
      (inventory.mobilySimBoxes || 0) + (inventory.mobilySimUnits || 0) +
      (inventory.stcSimBoxes || 0) + (inventory.stcSimUnits || 0) +
      (inventory.zainSimBoxes || 0) + (inventory.zainSimUnits || 0)
    );
  };

  const exportToExcel = async () => {
    if (!inventory) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('المخزون المتحرك');

    worksheet.views = [{ rightToLeft: true }];

    worksheet.mergeCells('A1:C1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'تقرير المخزون المتحرك';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF18B2B0' }
    };
    worksheet.getRow(1).height = 30;
    
    worksheet.mergeCells('A2:C2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `التاريخ: ${new Date().toLocaleDateString('ar-SA')}`;
    dateCell.alignment = { horizontal: 'center' };
    dateCell.font = { bold: true };
    dateCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0F7F7' }
    };
    worksheet.getRow(2).height = 25;

    worksheet.addRow([]);
    const headerRow = worksheet.addRow(['الصنف', 'الكمية', 'الوحدة']);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF18B2B0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    const data = [
      ['أجهزة N950 - كرتون', inventory.n950Boxes || 0, 'كرتون'],
      ['أجهزة N950 - وحدات', inventory.n950Units || 0, 'جهاز'],
      ['أجهزة I9000s - كرتون', inventory.i9000sBoxes || 0, 'كرتون'],
      ['أجهزة I9000s - وحدات', inventory.i9000sUnits || 0, 'جهاز'],
      ['أجهزة I9100 - كرتون', inventory.i9100Boxes || 0, 'كرتون'],
      ['أجهزة I9100 - وحدات', inventory.i9100Units || 0, 'جهاز'],
      ['أوراق رول - كرتون', inventory.rollPaperBoxes || 0, 'كرتون'],
      ['أوراق رول - وحدات', inventory.rollPaperUnits || 0, 'رول'],
      ['ملصقات مدى - كرتون', inventory.stickersBoxes || 0, 'كرتون'],
      ['ملصقات مدى - وحدات', inventory.stickersUnits || 0, 'ملصق'],
      ['بطاريات جديدة - كرتون', inventory.newBatteriesBoxes || 0, 'كرتون'],
      ['بطاريات جديدة - وحدات', inventory.newBatteriesUnits || 0, 'بطارية'],
      ['شرائح موبايلي - كرتون', inventory.mobilySimBoxes || 0, 'كرتون'],
      ['شرائح موبايلي - وحدات', inventory.mobilySimUnits || 0, 'شريحة'],
      ['شرائح STC - كرتون', inventory.stcSimBoxes || 0, 'كرتون'],
      ['شرائح STC - وحدات', inventory.stcSimUnits || 0, 'شريحة'],
      ['شرائح زين - كرتون', inventory.zainSimBoxes || 0, 'كرتون'],
      ['شرائح زين - وحدات', inventory.zainSimUnits || 0, 'شريحة'],
    ];

    data.forEach(row => {
      const dataRow = worksheet.addRow(row);
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center' };
      });
    });

    worksheet.addRow([]);
    const totalRow = worksheet.addRow(['الإجمالي', getTotalItems(), 'قطعة']);
    totalRow.font = { bold: true };
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center' };
    });

    worksheet.columns = [
      { width: 25 },
      { width: 15 },
      { width: 15 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `المخزون_المتحرك_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#E0F7F7] to-white">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4 animate-spin">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#18B2B0] border-r-[#18B2B0]"></div>
          </div>
          <p className="text-slate-700 text-base font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E0F7F7] to-white flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full bg-white border border-gray-200 shadow-lg">
          <CardContent className="py-12 text-center">
            <TruckIcon className="h-20 w-20 mx-auto mb-6 text-[#18B2B0]" />
            <h3 className="text-2xl font-bold mb-3 text-gray-900">لا يوجد مخزون متحرك</h3>
            <p className="text-gray-600 mb-6">
              قم بنقل بعض العناصر من المخزون الثابت أولاً
            </p>
            <button
              onClick={() => setLocation("/")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#18B2B0] text-white font-medium rounded-lg hover:bg-[#16a09e] transition-all duration-200 text-sm touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
              type="button"
            >
              <Home className="w-4 h-4" />
              <span>العودة للصفحة الرئيسية</span>
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E0F7F7] to-white" dir="rtl">
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#18B2B0] rounded-xl">
                <TruckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  المخزون المتحرك
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  {inventory?.technicianName} - {inventory?.city}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setLocation('/')}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-white border-2 border-[#18B2B0] text-[#18B2B0] font-medium rounded-lg hover:bg-[#18B2B0] hover:text-white transition-all duration-200 text-sm touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
                type="button"
                data-testid="button-back-home"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">الرئيسية</span>
              </button>
              
              <button
                onClick={() => setShowTransferModal(true)}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#18B2B0] text-white font-medium rounded-lg hover:bg-[#16a09e] transition-all duration-200 text-sm touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
                type="button"
                data-testid="button-transfer-from-fixed"
              >
                <ArrowLeftRight className="h-4 w-4" />
                <span>نقل من الثابت</span>
              </button>
              
              <button
                onClick={handleRefresh}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
                type="button"
                data-testid="button-refresh"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">تحديث</span>
              </button>
              
              <button
                onClick={() => setShowUpdateModal(true)}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition-all duration-200 text-sm touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
                type="button"
                data-testid="button-update-inventory"
              >
                <MinusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">تحديث المخزون</span>
              </button>
              
              <button
                onClick={exportToExcel}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-all duration-200 text-sm touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
                type="button"
                data-testid="button-export-excel"
              >
                <FileDown className="h-4 w-4" />
                <span>تصدير Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#E0F7F7] via-white to-[#E0F7F7]/30 rounded-xl shadow-lg border border-[#18B2B0]/20 p-4 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-24 h-24 bg-[#18B2B0]/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-gradient-to-br from-[#18B2B0] to-[#16a09e] rounded-lg shadow-md">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xs font-medium text-gray-700">إجمالي العناصر</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#18B2B0]" data-testid="text-total-items">
                {getTotalItems()}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-purple-50/30 rounded-xl shadow-lg border border-purple-100 p-4 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md">
                  <TruckIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xs font-medium text-gray-700">الأجهزة</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600" data-testid="text-total-devices">
                {(inventory.n950Boxes || 0) + (inventory.n950Units || 0) + (inventory.i9000sBoxes || 0) + (inventory.i9000sUnits || 0) + (inventory.i9100Boxes || 0) + (inventory.i9100Units || 0)}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-amber-50/30 rounded-xl shadow-lg border border-amber-100 p-4 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xs font-medium text-gray-700">الملحقات</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-amber-600" data-testid="text-total-accessories">
                {(inventory.rollPaperBoxes || 0) + (inventory.rollPaperUnits || 0) + (inventory.stickersBoxes || 0) + (inventory.stickersUnits || 0) + (inventory.newBatteriesBoxes || 0) + (inventory.newBatteriesUnits || 0)}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-green-50/30 rounded-xl shadow-lg border border-green-100 p-4 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xs font-medium text-gray-700">الشرائح</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-green-600" data-testid="text-total-sims">
                {(inventory.mobilySimBoxes || 0) + (inventory.mobilySimUnits || 0) + (inventory.stcSimBoxes || 0) + (inventory.stcSimUnits || 0) + (inventory.zainSimBoxes || 0) + (inventory.zainSimUnits || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Transfers */}
        {pendingTransfers && pendingTransfers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">طلبات النقل المعلقة ({pendingTransfers.length})</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الصنف</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">المستودع</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">{transfer.itemNameAr}</TableCell>
                      <TableCell>{transfer.quantity} {transfer.packagingType === 'boxes' ? 'كرتون' : 'مفرد'}</TableCell>
                      <TableCell>{transfer.warehouseName}</TableCell>
                      <TableCell className="text-sm">{format(new Date(transfer.createdAt), 'PPp', { locale: ar })}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <button
                            onClick={() => acceptMutation.mutate(transfer.id)}
                            className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded hover:bg-green-600 transition-colors touch-manipulation"
                            style={{ WebkitTapHighlightColor: 'transparent', minHeight: '36px' }}
                            disabled={acceptMutation.isPending}
                          >
                            قبول
                          </button>
                          <button
                            onClick={() => handleReject(transfer.id)}
                            className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 transition-colors touch-manipulation"
                            style={{ WebkitTapHighlightColor: 'transparent', minHeight: '36px' }}
                            disabled={rejectMutation.isPending}
                          >
                            رفض
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Detailed Inventory */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-[#18B2B0] to-[#16a09e] rounded-lg">
              <Package className="h-4 w-4 text-white" />
            </div>
            تفاصيل المخزون
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: 'أجهزة N950', boxes: inventory.n950Boxes || 0, units: inventory.n950Units || 0, colorFrom: '[#E0F7F7]', colorTo: 'white', textColor: '[#18B2B0]', borderColor: '[#18B2B0]/20', bgGlow: '[#18B2B0]/10', icon: '📱' },
              { label: 'أجهزة I9000s', boxes: inventory.i9000sBoxes || 0, units: inventory.i9000sUnits || 0, colorFrom: 'purple-50', colorTo: 'white', textColor: 'purple-600', borderColor: 'purple-100', bgGlow: 'purple-500/5', icon: '📱' },
              { label: 'أجهزة I9100', boxes: inventory.i9100Boxes || 0, units: inventory.i9100Units || 0, colorFrom: 'indigo-50', colorTo: 'white', textColor: 'indigo-600', borderColor: 'indigo-100', bgGlow: 'indigo-500/5', icon: '📱' },
              { label: 'أوراق رول', boxes: inventory.rollPaperBoxes || 0, units: inventory.rollPaperUnits || 0, colorFrom: 'amber-50', colorTo: 'white', textColor: 'amber-600', borderColor: 'amber-100', bgGlow: 'amber-500/5', icon: '📄' },
              { label: 'ملصقات مداى', boxes: inventory.stickersBoxes || 0, units: inventory.stickersUnits || 0, colorFrom: 'orange-50', colorTo: 'white', textColor: 'orange-600', borderColor: 'orange-100', bgGlow: 'orange-500/5', icon: '🏷️' },
              { label: 'بطاريات جديدة', boxes: inventory.newBatteriesBoxes || 0, units: inventory.newBatteriesUnits || 0, colorFrom: 'yellow-50', colorTo: 'white', textColor: 'yellow-600', borderColor: 'yellow-100', bgGlow: 'yellow-500/5', icon: '🔋' },
              { label: 'شرائح موبايلي', boxes: inventory.mobilySimBoxes || 0, units: inventory.mobilySimUnits || 0, colorFrom: 'green-50', colorTo: 'white', textColor: 'green-600', borderColor: 'green-100', bgGlow: 'green-500/5', icon: '📶' },
              { label: 'شرائح STC', boxes: inventory.stcSimBoxes || 0, units: inventory.stcSimUnits || 0, colorFrom: 'teal-50', colorTo: 'white', textColor: 'teal-600', borderColor: 'teal-100', bgGlow: 'teal-500/5', icon: '📶' },
              { label: 'شرائح زين', boxes: inventory.zainSimBoxes || 0, units: inventory.zainSimUnits || 0, colorFrom: 'cyan-50', colorTo: 'white', textColor: 'cyan-600', borderColor: 'cyan-100', bgGlow: 'cyan-500/5', icon: '📶' },
            ].map((item, index) => (
              <div
                key={index}
                className={`relative overflow-hidden bg-gradient-to-br from-${item.colorFrom} via-white to-${item.colorTo}/30 rounded-xl p-4 border border-${item.borderColor} shadow-md backdrop-blur-sm`}
              >
                <div className={`absolute top-0 right-0 w-20 h-20 bg-${item.bgGlow} rounded-full blur-2xl`}></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{item.icon}</span>
                    <h3 className="font-medium text-gray-900">{item.label}</h3>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">كراتين:</span>
                      <span className="font-bold text-gray-900">{item.boxes}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">مفرد:</span>
                      <span className="font-bold text-gray-900">{item.units}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">الإجمالي:</span>
                        <span className={`text-lg font-bold text-${item.textColor}`}>
                          {item.boxes + item.units}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showUpdateModal && (
        <UpdateMovingInventoryModal
          open={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          technicianId={user?.id || ''}
          currentInventory={inventory}
        />
      )}

      {showTransferModal && fixedInventory && (
        <TransferToMovingModal
          open={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          technicianId={user?.id || ''}
          fixedInventory={fixedInventory}
        />
      )}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>رفض عملية النقل</DialogTitle>
            <DialogDescription>
              يرجى إدخال سبب الرفض (اختياري)
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="سبب الرفض..."
            className="min-h-[100px]"
          />
          <DialogFooter className="gap-2">
            <button
              onClick={() => setRejectDialogOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors text-sm touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent', minHeight: '40px' }}
              type="button"
            >
              إلغاء
            </button>
            <button
              onClick={handleConfirmReject}
              className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors text-sm touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent', minHeight: '40px' }}
              type="button"
            >
              تأكيد الرفض
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
