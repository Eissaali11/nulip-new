import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TruckIcon, MinusCircle, ArrowRight, ArrowLeftRight, FileDown } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { UpdateMovingInventoryModal } from "@/components/update-moving-inventory-modal";
import { TransferToMovingModal } from "@/components/transfer-to-moving-modal";
import { useLocation } from "wouter";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface MovingInventory {
  id: string;
  technicianName: string;
  city: string;
  n950Devices: number;
  i900Devices: number;
  rollPaper: number;
  stickers: number;
  mobilySim: number;
  stcSim: number;
  zainSim: number;
}

interface FixedInventory {
  n950Boxes: number;
  n950Units: number;
  i900Boxes: number;
  i900Units: number;
  rollPaperBoxes: number;
  rollPaperUnits: number;
  stickersBoxes: number;
  stickersUnits: number;
  mobilySimBoxes: number;
  mobilySimUnits: number;
  stcSimBoxes: number;
  stcSimUnits: number;
  zainSimBoxes: number;
  zainSimUnits: number;
}

export default function MyMovingInventory() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const { data: inventory, isLoading } = useQuery<MovingInventory>({
    queryKey: [`/api/technicians/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: fixedInventory } = useQuery<FixedInventory>({
    queryKey: [`/api/technician-fixed-inventory/${user?.id}`],
    enabled: !!user?.id,
  });

  const getTotalItems = () => {
    if (!inventory) return 0;
    return (
      inventory.n950Devices +
      inventory.i900Devices +
      inventory.rollPaper +
      inventory.stickers +
      inventory.mobilySim +
      inventory.stcSim +
      inventory.zainSim
    );
  };

  const exportToExcel = async () => {
    if (!inventory) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('المخزون المتحرك');

    // Set RTL
    worksheet.views = [{ rightToLeft: true }];

    // Add title
    worksheet.mergeCells('A1:C1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'تقرير المخزون المتحرك';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Add date
    worksheet.mergeCells('A2:C2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `التاريخ: ${new Date().toLocaleDateString('ar-SA')}`;
    dateCell.alignment = { horizontal: 'center' };

    // Add headers
    worksheet.addRow([]);
    const headerRow = worksheet.addRow(['الصنف', 'الكمية', 'الوحدة']);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add data
    const data = [
      ['أجهزة N950', inventory.n950Devices, 'جهاز'],
      ['أجهزة I900', inventory.i900Devices, 'جهاز'],
      ['أوراق رول', inventory.rollPaper, 'رول'],
      ['ملصقات مدى', inventory.stickers, 'ملصق'],
      ['شرائح موبايلي', inventory.mobilySim, 'شريحة'],
      ['شرائح STC', inventory.stcSim, 'شريحة'],
      ['شرائح زين', inventory.zainSim, 'شريحة'],
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

    // Add total
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

    // Set column widths
    worksheet.columns = [
      { width: 25 },
      { width: 15 },
      { width: 15 }
    ];

    // Generate file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `المخزون_المتحرك_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <TruckIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">لا يوجد مخزون متحرك</h3>
            <p className="text-muted-foreground">
              قم بنقل بعض العناصر من المخزون الثابت أولاً
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
            className="hover:bg-accent"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <TruckIcon className="h-6 w-6 sm:h-8 sm:w-8" />
              المخزون المتحرك
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              المخزون الذي تستخدمه في العمل اليومي
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <Button 
            onClick={() => setShowTransferModal(true)}
            className="flex-1 sm:flex-none"
            variant="outline"
            data-testid="button-transfer-inventory"
          >
            <ArrowLeftRight className="w-4 h-4 ml-2" />
            نقل من الثابت
          </Button>
          <Button 
            onClick={() => setShowUpdateModal(true)}
            className="flex-1 sm:flex-none"
            data-testid="button-update-inventory"
          >
            <MinusCircle className="w-4 h-4 ml-2" />
            تحديث المخزون
          </Button>
          <Button 
            onClick={exportToExcel}
            className="flex-1 sm:flex-none"
            variant="secondary"
            data-testid="button-export-excel"
          >
            <FileDown className="w-4 h-4 ml-2" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-700 dark:text-blue-300">إجمالي العناصر</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100" data-testid="text-total-items">
              {getTotalItems()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-700 dark:text-purple-300">الأجهزة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-900 dark:text-purple-100" data-testid="text-total-devices">
              {inventory.n950Devices + inventory.i900Devices}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-700 dark:text-amber-300">الملحقات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-900 dark:text-amber-100" data-testid="text-total-accessories">
              {inventory.rollPaper + inventory.stickers}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-700 dark:text-green-300">الشرائح</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900 dark:text-green-100" data-testid="text-total-sims">
              {inventory.mobilySim + inventory.stcSim}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Inventory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* N950 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center justify-between">
              <span>أجهزة N950</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-sm font-semibold">
                {inventory.n950Devices}
              </span>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* I900 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center justify-between">
              <span>أجهزة I900</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 text-sm font-semibold">
                {inventory.i900Devices}
              </span>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Roll Paper */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center justify-between">
              <span>أوراق رول</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 text-sm font-semibold">
                {inventory.rollPaper}
              </span>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Stickers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center justify-between">
              <span>ملصقات مداى</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100 text-sm font-semibold">
                {inventory.stickers}
              </span>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Mobily SIM */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center justify-between">
              <span>شرائح موبايلي</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-sm font-semibold">
                {inventory.mobilySim}
              </span>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* STC SIM */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center justify-between">
              <span>شرائح STC</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-100 text-sm font-semibold">
                {inventory.stcSim}
              </span>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Zain SIM */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center justify-between">
              <span>شرائح زين</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 text-sm font-semibold">
                {inventory.zainSim}
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Transfer Modal */}
      {fixedInventory && (
        <TransferToMovingModal
          open={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          technicianId={user?.id || ''}
          fixedInventory={fixedInventory}
        />
      )}

      {/* Update Modal */}
      {inventory && (
        <UpdateMovingInventoryModal
          open={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          technicianId={user?.id || ''}
          currentInventory={inventory}
        />
      )}
    </div>
  );
}
