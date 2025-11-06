import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Edit, Trash2, Plus, FileDown, Box, Smartphone, FileText, Sticker, Battery, ArrowRightLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { TransferToMovingModal } from "@/components/transfer-to-moving-modal";
import { EditFixedInventoryModal } from "@/components/edit-fixed-inventory-modal";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface FixedInventory {
  id?: string;
  technicianId: string;
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

export default function MyFixedInventory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: existingInventory, isLoading } = useQuery<FixedInventory>({
    queryKey: [`/api/technician-fixed-inventory/${user?.id}`],
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(
        "DELETE",
        `/api/technician-fixed-inventory/${user?.id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/technician-fixed-inventory/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fixed-inventory-dashboard'] });
      toast({
        title: "✓ تم الحذف بنجاح",
        description: "تم حذف المخزون الثابت",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "✗ فشل الحذف",
        description: "حدث خطأ أثناء حذف البيانات",
      });
    },
  });

  const getTotalForItem = (boxes: number, units: number) => {
    return boxes + units;
  };

  const exportToExcel = async () => {
    if (!existingInventory) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('المخزون الثابت');

    worksheet.views = [{ rightToLeft: true }];

    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'تقرير المخزون الثابت';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 40;
    
    worksheet.mergeCells('A2:D2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `التاريخ: ${new Date().toLocaleDateString('ar-SA')}`;
    dateCell.font = { size: 12, italic: true };
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    dateCell.alignment = { horizontal: 'center' };
    worksheet.getRow(2).height = 25;

    worksheet.addRow([]);
    const headerRow = worksheet.addRow(['الصنف', 'كراتين', 'وحدات', 'الإجمالي']);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    const data = [
      ['أجهزة N950', existingInventory.n950Boxes, existingInventory.n950Units, getTotalForItem(existingInventory.n950Boxes, existingInventory.n950Units)],
      ['أجهزة I9000s', existingInventory.i9000sBoxes, existingInventory.i9000sUnits, getTotalForItem(existingInventory.i9000sBoxes, existingInventory.i9000sUnits)],
      ['أجهزة I9100', existingInventory.i9100Boxes, existingInventory.i9100Units, getTotalForItem(existingInventory.i9100Boxes, existingInventory.i9100Units)],
      ['أوراق رول', existingInventory.rollPaperBoxes, existingInventory.rollPaperUnits, getTotalForItem(existingInventory.rollPaperBoxes, existingInventory.rollPaperUnits)],
      ['ملصقات مدى', existingInventory.stickersBoxes, existingInventory.stickersUnits, getTotalForItem(existingInventory.stickersBoxes, existingInventory.stickersUnits)],
      ['بطاريات جديدة', existingInventory.newBatteriesBoxes, existingInventory.newBatteriesUnits, getTotalForItem(existingInventory.newBatteriesBoxes, existingInventory.newBatteriesUnits)],
      ['شرائح موبايلي', existingInventory.mobilySimBoxes, existingInventory.mobilySimUnits, getTotalForItem(existingInventory.mobilySimBoxes, existingInventory.mobilySimUnits)],
      ['شرائح STC', existingInventory.stcSimBoxes, existingInventory.stcSimUnits, getTotalForItem(existingInventory.stcSimBoxes, existingInventory.stcSimUnits)],
      ['شرائح زين', existingInventory.zainSimBoxes, existingInventory.zainSimUnits, getTotalForItem(existingInventory.zainSimBoxes, existingInventory.zainSimUnits)],
    ];

    data.forEach((rowData) => {
      const row = worksheet.addRow(rowData);
      row.alignment = { horizontal: 'center', vertical: 'middle' };
      row.height = 25;
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    const grandTotal = data.reduce((sum, row) => sum + (row[3] as number), 0);
    const totalRow = worksheet.addRow(['الإجمالي الكلي', '', '', grandTotal]);
    totalRow.font = { bold: true, size: 14 };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
    totalRow.alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.height = 30;
    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
      };
    });

    worksheet.columns = [
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `المخزون_الثابت_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.xlsx`);

    toast({
      title: "✓ تم التصدير بنجاح",
      description: "تم تصدير البيانات إلى ملف Excel",
    });
  };

  const itemsConfig = [
    {
      name: 'أجهزة N950',
      icon: Box,
      boxes: existingInventory?.n950Boxes || 0,
      units: existingInventory?.n950Units || 0,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
    },
    {
      name: 'أجهزة I9000s',
      icon: Smartphone,
      boxes: existingInventory?.i9000sBoxes || 0,
      units: existingInventory?.i9000sUnits || 0,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
    },
    {
      name: 'أجهزة I9100',
      icon: Smartphone,
      boxes: existingInventory?.i9100Boxes || 0,
      units: existingInventory?.i9100Units || 0,
      gradient: 'from-indigo-500 to-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100',
      borderColor: 'border-indigo-200',
    },
    {
      name: 'أوراق رول',
      icon: FileText,
      boxes: existingInventory?.rollPaperBoxes || 0,
      units: existingInventory?.rollPaperUnits || 0,
      gradient: 'from-amber-500 to-amber-600',
      bgGradient: 'from-amber-50 to-amber-100',
      borderColor: 'border-amber-200',
    },
    {
      name: 'ملصقات مدى',
      icon: Sticker,
      boxes: existingInventory?.stickersBoxes || 0,
      units: existingInventory?.stickersUnits || 0,
      gradient: 'from-pink-500 to-pink-600',
      bgGradient: 'from-pink-50 to-pink-100',
      borderColor: 'border-pink-200',
    },
    {
      name: 'بطاريات جديدة',
      icon: Battery,
      boxes: existingInventory?.newBatteriesBoxes || 0,
      units: existingInventory?.newBatteriesUnits || 0,
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
      borderColor: 'border-green-200',
    },
    {
      name: 'شرائح موبايلي',
      icon: Smartphone,
      boxes: existingInventory?.mobilySimBoxes || 0,
      units: existingInventory?.mobilySimUnits || 0,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100',
      borderColor: 'border-emerald-200',
    },
    {
      name: 'شرائح STC',
      icon: Smartphone,
      boxes: existingInventory?.stcSimBoxes || 0,
      units: existingInventory?.stcSimUnits || 0,
      gradient: 'from-cyan-500 to-cyan-600',
      bgGradient: 'from-cyan-50 to-cyan-100',
      borderColor: 'border-cyan-200',
    },
    {
      name: 'شرائح زين',
      icon: Smartphone,
      boxes: existingInventory?.zainSimBoxes || 0,
      units: existingInventory?.zainSimUnits || 0,
      gradient: 'from-violet-500 to-violet-600',
      bgGradient: 'from-violet-50 to-violet-100',
      borderColor: 'border-violet-200',
    },
  ];

  const grandTotal = itemsConfig.reduce((sum, item) => sum + getTotalForItem(item.boxes, item.units), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const handleDeleteClick = () => {
    if (window.confirm('هل أنت متأكد من حذف المخزون الثابت؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl" dir="rtl">
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-xl mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Package className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1">المخزون الثابت</h1>
                <p className="text-white/90 text-sm">إدارة مخزونك الأساسي بدقة واحترافية</p>
              </div>
            </div>

            {existingInventory && (
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={() => setShowEditModal(true)}
                  className="bg-white/90 hover:bg-white text-blue-600 font-semibold shadow-lg"
                  data-testid="button-edit-inventory"
                >
                  <Edit className="w-4 h-4 ml-2" />
                  تعديل المخزون
                </Button>
                <Button 
                  onClick={() => setShowTransferModal(true)}
                  className="bg-purple-500 hover:bg-purple-600 text-white font-semibold shadow-lg"
                  data-testid="button-transfer-to-moving"
                >
                  <ArrowRightLeft className="w-4 h-4 ml-2" />
                  نقل للمتحرك
                </Button>
                <Button 
                  onClick={exportToExcel}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold shadow-lg"
                  data-testid="button-export-excel"
                >
                  <FileDown className="w-4 h-4 ml-2" />
                  تصدير Excel
                </Button>
                <Button 
                  onClick={handleDeleteClick}
                  variant="destructive"
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg"
                  data-testid="button-delete-inventory"
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف
                </Button>
              </div>
            )}

            {!existingInventory && (
              <Button 
                onClick={() => setShowEditModal(true)}
                className="bg-white hover:bg-gray-100 text-blue-600 font-semibold shadow-lg"
                data-testid="button-add-inventory"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة مخزون ثابت
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {existingInventory ? (
        <>
          <Card className="border-2 border-blue-200 shadow-xl bg-gradient-to-br from-slate-50 to-blue-50 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wider mb-1">إجمالي الأصناف</p>
                  <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" data-testid="text-grand-total">
                    {grandTotal.toLocaleString('ar-SA')}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl">
                  <Package className="h-12 w-12 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {itemsConfig.map((item) => {
              const Icon = item.icon;
              const total = getTotalForItem(item.boxes, item.units);

              return (
                <Card 
                  key={item.name}
                  className={`group border-2 ${item.borderColor} hover:shadow-lg transition-all duration-200 bg-gradient-to-br ${item.bgGradient}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 bg-gradient-to-br ${item.gradient} rounded-xl`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">{item.name}</CardTitle>
                        <p className={`text-2xl font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                          {total.toLocaleString('ar-SA')}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">كراتين</p>
                        <p className="text-xl font-bold">{item.boxes.toLocaleString('ar-SA')}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">وحدات</p>
                        <p className="text-xl font-bold">{item.units.toLocaleString('ar-SA')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <Card className="border-2 border-dashed border-slate-300">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">لا يوجد مخزون ثابت</h3>
            <p className="text-muted-foreground mb-4">ابدأ بإضافة مخزونك الثابت الآن</p>
            <Button 
              onClick={() => setShowEditModal(true)}
              data-testid="button-add-first-inventory"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة مخزون ثابت
            </Button>
          </CardContent>
        </Card>
      )}

      {showTransferModal && existingInventory && (
        <TransferToMovingModal
          open={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          technicianId={user?.id || ''}
          fixedInventory={existingInventory}
        />
      )}

      {showEditModal && (
        <EditFixedInventoryModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          inventory={existingInventory}
        />
      )}
    </div>
  );
}
