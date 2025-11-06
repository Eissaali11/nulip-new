import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight, ArrowLeft, Edit, Trash2, Plus, FileDown, Box, Smartphone, FileText, Sticker, Battery } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { TransferToMovingModal } from "@/components/transfer-to-moving-modal";
import { EditFixedInventoryModal } from "@/components/edit-fixed-inventory-modal";
import { useLocation } from "wouter";
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
  const [, setLocation] = useLocation();

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

    data.forEach((row, index) => {
      const dataRow = worksheet.addRow(row);
      dataRow.height = 25;
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      if (index % 2 === 0) {
        dataRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        });
      }
    });

    worksheet.addRow([]);
    const grandTotal = data.reduce((sum, row) => sum + (row[3] as number), 0);

    const totalRow = worksheet.addRow(['الإجمالي الكلي', '', '', grandTotal]);
    totalRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    totalRow.height = 35;
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF059669' }
      };
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'medium' },
        bottom: { style: 'medium' },
        right: { style: 'medium' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    worksheet.columns = [
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `المخزون_الثابت_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6" dir="rtl">
        <div className="text-center py-12">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
          </div>
          <p className="mt-4 text-lg font-medium bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            جاري تحميل المخزون الثابت...
          </p>
        </div>
      </div>
    );
  }

  const itemsConfig = [
    {
      name: 'أجهزة N950',
      icon: Box,
      boxes: existingInventory?.n950Boxes || 0,
      units: existingInventory?.n950Units || 0,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
      borderColor: 'border-blue-300 dark:border-blue-700',
    },
    {
      name: 'أجهزة I9000s',
      icon: Box,
      boxes: existingInventory?.i9000sBoxes || 0,
      units: existingInventory?.i9000sUnits || 0,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
      borderColor: 'border-purple-300 dark:border-purple-700',
    },
    {
      name: 'أجهزة I9100',
      icon: Box,
      boxes: existingInventory?.i9100Boxes || 0,
      units: existingInventory?.i9100Units || 0,
      gradient: 'from-indigo-500 to-blue-500',
      bgGradient: 'from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30',
      borderColor: 'border-indigo-300 dark:border-indigo-700',
    },
    {
      name: 'أوراق رول',
      icon: FileText,
      boxes: existingInventory?.rollPaperBoxes || 0,
      units: existingInventory?.rollPaperUnits || 0,
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
      borderColor: 'border-amber-300 dark:border-amber-700',
    },
    {
      name: 'ملصقات مدى',
      icon: Sticker,
      boxes: existingInventory?.stickersBoxes || 0,
      units: existingInventory?.stickersUnits || 0,
      gradient: 'from-rose-500 to-red-500',
      bgGradient: 'from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30',
      borderColor: 'border-rose-300 dark:border-rose-700',
    },
    {
      name: 'بطاريات جديدة',
      icon: Battery,
      boxes: existingInventory?.newBatteriesBoxes || 0,
      units: existingInventory?.newBatteriesUnits || 0,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
      borderColor: 'border-emerald-300 dark:border-emerald-700',
    },
    {
      name: 'شرائح موبايلي',
      icon: Smartphone,
      boxes: existingInventory?.mobilySimBoxes || 0,
      units: existingInventory?.mobilySimUnits || 0,
      gradient: 'from-green-500 to-lime-500',
      bgGradient: 'from-green-50 to-lime-50 dark:from-green-950/30 dark:to-lime-950/30',
      borderColor: 'border-green-300 dark:border-green-700',
    },
    {
      name: 'شرائح STC',
      icon: Smartphone,
      boxes: existingInventory?.stcSimBoxes || 0,
      units: existingInventory?.stcSimUnits || 0,
      gradient: 'from-teal-500 to-cyan-500',
      bgGradient: 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30',
      borderColor: 'border-teal-300 dark:border-teal-700',
    },
    {
      name: 'شرائح زين',
      icon: Smartphone,
      boxes: existingInventory?.zainSimBoxes || 0,
      units: existingInventory?.zainSimUnits || 0,
      gradient: 'from-violet-500 to-purple-500',
      bgGradient: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
      borderColor: 'border-violet-300 dark:border-violet-700',
    },
  ];

  const grandTotal = itemsConfig.reduce((total, item) => {
    return total + getTotalForItem(item.boxes, item.units);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950" dir="rtl">
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/')}
                className="shrink-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0"
                data-testid="button-back"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white flex items-center gap-3" data-testid="text-page-title">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Package className="h-8 w-8 sm:h-10 sm:w-10" />
                  </div>
                  المخزون الثابت
                </h1>
                <p className="text-sm sm:text-base text-white/90 mt-2 font-medium">
                  إدارة مخزونك الأساسي بدقة واحترافية
                </p>
              </div>
            </div>

            {!existingInventory ? (
              <Button 
                onClick={() => setShowEditModal(true)}
                className="bg-white hover:bg-gray-100 text-blue-600 font-semibold shadow-lg"
                data-testid="button-add-inventory"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة مخزون ثابت
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <Button 
                  onClick={() => setShowEditModal(true)}
                  className="flex-1 sm:flex-initial bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30 shadow-lg"
                  data-testid="button-edit-inventory"
                >
                  <Edit className="w-4 h-4 ml-2" />
                  تعديل المخزون
                </Button>
                <Button 
                  onClick={() => setShowTransferModal(true)}
                  className="flex-1 sm:flex-initial bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30 shadow-lg"
                  data-testid="button-transfer-to-moving"
                >
                  <ArrowLeft className="w-4 h-4 ml-2" />
                  نقل للمتحرك
                </Button>
                <Button 
                  onClick={exportToExcel}
                  className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                  data-testid="button-export-excel"
                >
                  <FileDown className="w-4 h-4 ml-2" />
                  تصدير Excel
                </Button>
                <Button 
                  onClick={() => {
                    if (confirm('هل أنت متأكد من حذف المخزون الثابت؟')) {
                      deleteMutation.mutate();
                    }
                  }}
                  variant="destructive"
                  className="flex-1 sm:flex-initial shadow-lg"
                  data-testid="button-delete-inventory"
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف
                </Button>
              </div>
            )}
          </div>
        </div>

        {existingInventory ? (
          <>
            {/* Grand Total Card */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/5"></div>
              <CardContent className="p-6 sm:p-8 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">إجمالي الأصناف</p>
                    <p className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent" data-testid="text-grand-total">
                      {grandTotal.toLocaleString('ar-SA')}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl">
                    <Package className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Items Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {itemsConfig.map((item) => {
                const Icon = item.icon;
                const total = getTotalForItem(item.boxes, item.units);

                return (
                  <Card 
                    key={item.name}
                    className={`group border-2 ${item.borderColor} hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br ${item.bgGradient} overflow-hidden`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 bg-gradient-to-br ${item.gradient} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg sm:text-xl font-bold">
                              {item.name}
                            </CardTitle>
                            <p className={`text-3xl font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                              {total.toLocaleString('ar-SA')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                          <p className="text-sm text-muted-foreground mb-1">كراتين</p>
                          <p className="text-2xl font-bold">{item.boxes.toLocaleString('ar-SA')}</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                          <p className="text-sm text-muted-foreground mb-1">وحدات</p>
                          <p className="text-2xl font-bold">{item.units.toLocaleString('ar-SA')}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <Card className="border-2 border-dashed border-slate-300 dark:border-slate-700">
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
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
      </div>

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
