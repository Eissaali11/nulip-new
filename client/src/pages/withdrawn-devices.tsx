import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileSpreadsheet, Trash2, Search, Edit, PackageX, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { WithdrawnDevice } from "@shared/schema";
import AddWithdrawnDeviceModal from "@/components/add-withdrawn-device-modal";
import EditWithdrawnDeviceModal from "@/components/edit-withdrawn-device-modal";
import ExcelJS from 'exceljs';

export default function WithdrawnDevicesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<WithdrawnDevice | null>(null);

  const { data: devices, isLoading } = useQuery<WithdrawnDevice[]>({
    queryKey: ["/api/withdrawn-devices"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/withdrawn-devices/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawn-devices"] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الجهاز المسحوب",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "حدث خطأ أثناء حذف الجهاز",
        variant: "destructive",
      });
    },
  });

  const filteredDevices = devices?.filter(
    (device) =>
      device.technicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.terminalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (device: WithdrawnDevice) => {
    setSelectedDevice(device);
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف بيانات هذا الجهاز؟")) {
      deleteMutation.mutate(id);
    }
  };

  const handleExport = async () => {
    if (!filteredDevices || filteredDevices.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        description: "يجب أن يكون هناك بيانات لتصديرها",
        variant: "destructive",
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('الأجهزة المسحوبة');
    
    const currentDate = new Date().toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Add title row
    worksheet.mergeCells('A1:L1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'تقرير الأجهزة المسحوبة';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 35;
    
    // Add date row
    worksheet.mergeCells('A2:L2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `تاريخ التقرير: ${currentDate}`;
    dateCell.font = { size: 12, bold: true };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    worksheet.getRow(2).height = 25;
    
    // Add header row
    const headerRow = worksheet.getRow(4);
    headerRow.values = [
      '#',
      'المدينة',
      'اسم الفني',
      'رقم الجهاز',
      'الرقم التسلسلي',
      'البطارية',
      'كابل الشاحن',
      'رأس الشاحن',
      'وجود شريحة',
      'نوع الشريحة',
      'الضرر',
      'ملاحظات'
    ];
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;
    
    // Add borders to header
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Add device data
    filteredDevices.forEach((device, index) => {
      const row = worksheet.addRow([
        index + 1,
        device.city,
        device.technicianName,
        device.terminalId,
        device.serialNumber,
        device.battery,
        device.chargerCable,
        device.chargerHead,
        device.hasSim,
        device.simCardType || '-',
        device.damagePart || '-',
        device.notes || '-'
      ]);
      
      row.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      row.height = 22;
      
      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }
      
      // Add borders
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });
      
      // Right align text columns
      row.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(11).alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
      row.getCell(12).alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
    });
    
    // Add statistics section
    const statsStartRow = worksheet.lastRow!.number + 2;
    
    // Stats title
    worksheet.mergeCells(`A${statsStartRow}:L${statsStartRow}`);
    const statsTitle = worksheet.getCell(`A${statsStartRow}`);
    statsTitle.value = 'الإحصائيات الإجمالية';
    statsTitle.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    statsTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
    statsTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(statsStartRow).height = 30;
    
    // Stats data
    const statsRow = worksheet.getRow(statsStartRow + 1);
    statsRow.values = ['', 'إجمالي عدد الأجهزة المسحوبة', filteredDevices.length];
    statsRow.height = 25;
    statsRow.getCell(2).font = { bold: true };
    statsRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
    statsRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
    statsRow.getCell(3).font = { bold: true, color: { argb: 'FF1E40AF' } };
    statsRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Set column widths
    worksheet.columns = [
      { width: 6 },   // #
      { width: 18 },  // المدينة
      { width: 25 },  // اسم الفني
      { width: 18 },  // رقم الجهاز
      { width: 22 },  // الرقم التسلسلي
      { width: 14 },  // البطارية
      { width: 16 },  // كابل الشاحن
      { width: 16 },  // رأس الشاحن
      { width: 14 },  // وجود شريحة
      { width: 16 },  // نوع الشريحة
      { width: 25 },  // الضرر
      { width: 35 },  // ملاحظات
    ];
    
    // Write file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_الأجهزة_المسحوبة_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "تم تصدير التقرير بنجاح",
      description: `تم تصدير ${filteredDevices.length} سجل بتنسيق احترافي`,
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-b">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hover:bg-orange-100 dark:hover:bg-orange-900"
              >
                <Link href="/home" data-testid="button-back-home">
                  <ArrowRight className="h-4 w-4 ml-2" />
                  <span>العودة للرئيسية</span>
                </Link>
              </Button>
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <PackageX className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">الأجهزة المسحوبة</h2>
                  <p className="text-sm text-muted-foreground">إدارة الأجهزة المسحوبة من الخدمة</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="relative flex-1 sm:flex-initial">
                  <Input
                    type="text"
                    placeholder="ابحث..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64 bg-white dark:bg-gray-900 text-sm"
                    data-testid="input-search"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleExport}
                    variant="outline"
                    className="flex-1 sm:flex-initial gap-1.5 sm:gap-2 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-xs sm:text-sm"
                    data-testid="button-export"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-300">تصدير</span>
                  </Button>
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="flex-1 sm:flex-initial gap-1.5 sm:gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm"
                    data-testid="button-add"
                  >
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>إضافة</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredDevices && filteredDevices.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden space-y-3">
                {filteredDevices.map((device, index) => (
                  <div key={device.id} className="bg-card border border-border rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm text-foreground">{device.technicianName}</h3>
                          <span className="text-xs text-muted-foreground">• {device.city}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">جهاز: {device.terminalId}</p>
                        <p className="text-xs text-muted-foreground">تسلسلي: {device.serialNumber}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(device)}
                          className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400"
                          data-testid={`button-edit-${device.id}`}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(device.id)}
                          className="h-8 w-8 hover:bg-destructive/10"
                          data-testid={`button-delete-${device.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">البطارية: </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                          ${device.battery === 'جيدة' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                            device.battery === 'متوسطة' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                            device.battery === 'سيئة' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                          {device.battery}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">كابل: </span>
                        <span className="text-foreground">{device.chargerCable}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">رأس: </span>
                        <span className="text-foreground">{device.chargerHead}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">شريحة: </span>
                        <span className="text-foreground">{device.hasSim}</span>
                      </div>
                    </div>
                    
                    {(device.simCardType || device.damagePart || device.notes) && (
                      <div className="mt-3 pt-3 border-t border-border space-y-1 text-xs">
                        {device.simCardType && (
                          <p><span className="text-muted-foreground">نوع الشريحة:</span> {device.simCardType}</p>
                        )}
                        {device.damagePart && (
                          <p><span className="text-muted-foreground">الضرر:</span> {device.damagePart}</p>
                        )}
                        {device.notes && (
                          <p><span className="text-muted-foreground">ملاحظات:</span> {device.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto -mx-4 sm:mx-0 rounded-lg">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                    <tr>
                      <th className="hidden sm:table-cell whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">#</th>
                      <th className="hidden md:table-cell whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">المدينة</th>
                      <th className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">الفني</th>
                      <th className="whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">الجهاز</th>
                      <th className="hidden lg:table-cell whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">التسلسلي</th>
                      <th className="whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">البطارية</th>
                      <th className="hidden xl:table-cell whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">كابل</th>
                      <th className="hidden xl:table-cell whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">رأس</th>
                      <th className="hidden lg:table-cell whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">شريحة</th>
                      <th className="hidden xl:table-cell whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">نوع</th>
                      <th className="hidden xl:table-cell whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">ضرر</th>
                      <th className="hidden xl:table-cell whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">ملاحظات</th>
                      <th className="whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {filteredDevices.map((device, index) => (
                      <tr key={device.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-device-${device.id}`}>
                        <td className="hidden sm:table-cell whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-sm">
                          {index + 1}
                        </td>
                        <td className="hidden md:table-cell whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-sm">
                          {device.city}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-sm font-medium">
                          {device.technicianName}
                        </td>
                        <td className="whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-sm">
                          {device.terminalId}
                        </td>
                        <td className="hidden lg:table-cell whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-sm">
                          {device.serialNumber}
                        </td>
                        <td className="whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-sm">
                          <span className={`inline-flex items-center px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-semibold
                            ${device.battery === 'جيدة' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                              device.battery === 'متوسطة' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                              device.battery === 'سيئة' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                            {device.battery}
                          </span>
                        </td>
                        <td className="hidden xl:table-cell whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-sm">
                          {device.chargerCable}
                        </td>
                        <td className="hidden xl:table-cell whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-sm">
                          {device.chargerHead}
                        </td>
                        <td className="hidden lg:table-cell whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-sm">
                          {device.hasSim}
                        </td>
                        <td className="hidden xl:table-cell whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-sm">
                          {device.simCardType || '-'}
                        </td>
                        <td className="hidden xl:table-cell px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-sm max-w-xs truncate">
                          {device.damagePart || '-'}
                        </td>
                        <td className="hidden xl:table-cell px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-sm max-w-xs truncate">
                          {device.notes || '-'}
                        </td>
                        <td className="whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3">
                          <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(device)}
                              className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400"
                              title="تعديل"
                              data-testid={`button-edit-${device.id}`}
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(device.id)}
                              className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-destructive/10 hover:text-destructive"
                              title="حذف"
                              data-testid={`button-delete-${device.id}`}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">
                لا توجد أجهزة مسحوبة مسجلة
              </p>
              <Button onClick={() => setShowAddModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                <span>إضافة أول جهاز</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AddWithdrawnDeviceModal open={showAddModal} onOpenChange={setShowAddModal} />
      <EditWithdrawnDeviceModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal}
        device={selectedDevice}
      />
    </>
  );
}
