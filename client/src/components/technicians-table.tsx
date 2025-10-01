import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileSpreadsheet, Edit, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TechnicianInventory } from "@shared/schema";
import AddTechnicianModal from "./add-technician-modal";
import EditTechnicianModal from "./edit-technician-modal";
import ExcelJS from 'exceljs';

export default function TechniciansTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianInventory | null>(null);

  const { data: technicians, isLoading } = useQuery<TechnicianInventory[]>({
    queryKey: ["/api/technicians"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/technicians/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف بيانات الفني",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف البيانات",
        variant: "destructive",
      });
    },
  });

  const filteredTechnicians = technicians?.filter(
    (tech) =>
      tech.technicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (tech: TechnicianInventory) => {
    setSelectedTechnician(tech);
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف بيانات هذا الفني؟")) {
      deleteMutation.mutate(id);
    }
  };

  const handleExport = async () => {
    if (!filteredTechnicians || filteredTechnicians.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        description: "يجب أن يكون هناك بيانات لتصديرها",
        variant: "destructive",
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('تقرير الفنيين');
    
    const currentDate = new Date().toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Calculate totals
    const totalN950 = filteredTechnicians.reduce((sum, t) => sum + t.n950Devices, 0);
    const totalI900 = filteredTechnicians.reduce((sum, t) => sum + t.i900Devices, 0);
    const totalRoll = filteredTechnicians.reduce((sum, t) => sum + t.rollPaper, 0);
    const totalStickers = filteredTechnicians.reduce((sum, t) => sum + t.stickers, 0);
    const totalMobily = filteredTechnicians.reduce((sum, t) => sum + t.mobilySim, 0);
    const totalSTC = filteredTechnicians.reduce((sum, t) => sum + t.stcSim, 0);
    
    // Add title row
    worksheet.mergeCells('A1:J1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'نظام إدارة مخزون الفنيين';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 35;
    
    // Add date row
    worksheet.mergeCells('A2:J2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `تاريخ التقرير: ${currentDate}`;
    dateCell.font = { size: 12, bold: true };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    worksheet.getRow(2).height = 25;
    
    // Add header row
    const headerRow = worksheet.getRow(4);
    headerRow.values = ['#', 'اسم الفني', 'المدينة', 'أجهزة N950', 'أجهزة I900', 'أوراق رول', 'ملصقات مداى', 'شرائح موبايلي', 'شرائح STC', 'ملاحظات'];
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
    
    // Add technician data
    filteredTechnicians.forEach((tech, index) => {
      const row = worksheet.addRow([
        index + 1,
        tech.technicianName,
        tech.city,
        tech.n950Devices,
        tech.i900Devices,
        tech.rollPaper,
        tech.stickers,
        tech.mobilySim,
        tech.stcSim,
        tech.notes || ''
      ]);
      
      row.alignment = { horizontal: 'center', vertical: 'middle' };
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
      row.getCell(10).alignment = { horizontal: 'right', vertical: 'middle' };
    });
    
    // Add statistics section
    const statsStartRow = worksheet.lastRow!.number + 2;
    
    // Stats title
    worksheet.mergeCells(`A${statsStartRow}:J${statsStartRow}`);
    const statsTitle = worksheet.getCell(`A${statsStartRow}`);
    statsTitle.value = 'الإحصائيات الإجمالية';
    statsTitle.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    statsTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
    statsTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(statsStartRow).height = 30;
    
    // Stats data
    const statsData = [
      ['عدد الفنيين', filteredTechnicians.length, 'أجهزة N950', totalN950, 'أجهزة I900', totalI900],
      ['أوراق رول', totalRoll, 'ملصقات مداى', totalStickers, 'شرائح موبايلي', totalMobily],
      ['شرائح STC', totalSTC, '', '', '', '']
    ];
    
    statsData.forEach((data, idx) => {
      const row = worksheet.getRow(statsStartRow + idx + 1);
      row.values = ['', ...data];
      row.height = 25;
      
      // Style labels (odd cells)
      [2, 4, 6].forEach(col => {
        const cell = row.getCell(col);
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      // Style values (even cells)
      [3, 5, 7].forEach(col => {
        const cell = row.getCell(col);
        cell.font = { bold: true, color: { argb: 'FF1E40AF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
    // Set column widths
    worksheet.columns = [
      { width: 6 },   // #
      { width: 25 },  // اسم الفني
      { width: 18 },  // المدينة
      { width: 14 },  // N950
      { width: 14 },  // I900
      { width: 14 },  // أوراق رول
      { width: 16 },  // ملصقات مداى
      { width: 16 },  // موبايلي
      { width: 14 },  // STC
      { width: 35 },  // ملاحظات
    ];
    
    // Write file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_الفنيين_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "تم تصدير التقرير بنجاح",
      description: `تم تصدير ${filteredTechnicians.length} سجل بتنسيق احترافي`,
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">بيانات الفنيين</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="relative flex-1 sm:flex-initial">
                <Input
                  type="text"
                  placeholder="البحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                  data-testid="input-search"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 space-x-reverse bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 border-emerald-200 dark:border-emerald-800"
                  data-testid="button-export-excel"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-300 text-sm sm:text-base">تصدير</span>
                </Button>
                
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 space-x-reverse"
                  data-testid="button-add-technician"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm sm:text-base">إضافة فني</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-2 sm:p-6">
          {!filteredTechnicians || filteredTechnicians.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد بيانات"}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="whitespace-nowrap px-2 py-3 sm:px-4 sm:py-4 text-right text-xs sm:text-sm font-semibold text-foreground">اسم الفني</th>
                        <th className="whitespace-nowrap px-2 py-3 sm:px-4 sm:py-4 text-right text-xs sm:text-sm font-semibold text-foreground">المدينة</th>
                        <th className="whitespace-nowrap px-2 py-3 sm:px-4 sm:py-4 text-center text-xs sm:text-sm font-semibold text-foreground">N950</th>
                        <th className="whitespace-nowrap px-2 py-3 sm:px-4 sm:py-4 text-center text-xs sm:text-sm font-semibold text-foreground">I900</th>
                        <th className="whitespace-nowrap px-2 py-3 sm:px-4 sm:py-4 text-center text-xs sm:text-sm font-semibold text-foreground">أوراق رول</th>
                        <th className="whitespace-nowrap px-2 py-3 sm:px-4 sm:py-4 text-center text-xs sm:text-sm font-semibold text-foreground">ملصقات</th>
                        <th className="whitespace-nowrap px-2 py-3 sm:px-4 sm:py-4 text-center text-xs sm:text-sm font-semibold text-foreground">موبايلي</th>
                        <th className="whitespace-nowrap px-2 py-3 sm:px-4 sm:py-4 text-center text-xs sm:text-sm font-semibold text-foreground">STC</th>
                        <th className="hidden md:table-cell whitespace-nowrap px-2 py-3 sm:px-4 sm:py-4 text-right text-xs sm:text-sm font-semibold text-foreground">ملاحظات</th>
                        <th className="whitespace-nowrap px-2 py-3 sm:px-4 sm:py-4 text-center text-xs sm:text-sm font-semibold text-foreground">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                      {filteredTechnicians.map((tech) => (
                        <tr key={tech.id} className="hover:bg-accent/50 transition-colors">
                          <td className="whitespace-nowrap px-2 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm font-medium text-foreground" data-testid={`text-name-${tech.id}`}>
                            {tech.technicianName}
                          </td>
                          <td className="whitespace-nowrap px-2 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm text-muted-foreground" data-testid={`text-city-${tech.id}`}>
                            {tech.city}
                          </td>
                          <td className="whitespace-nowrap px-2 py-3 sm:px-4 sm:py-4 text-center text-xs sm:text-sm" data-testid={`text-n950-${tech.id}`}>
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 font-semibold">
                              {tech.n950Devices}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-2 py-3 sm:px-4 sm:py-4 text-center text-xs sm:text-sm" data-testid={`text-i900-${tech.id}`}>
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 font-semibold">
                              {tech.i900Devices}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-2 py-3 sm:px-4 sm:py-4 text-center text-xs sm:text-sm" data-testid={`text-roll-${tech.id}`}>
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 font-semibold">
                              {tech.rollPaper}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-2 py-3 sm:px-4 sm:py-4 text-center text-xs sm:text-sm" data-testid={`text-stickers-${tech.id}`}>
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-100 font-semibold">
                              {tech.stickers}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-2 py-3 sm:px-4 sm:py-4 text-center text-xs sm:text-sm" data-testid={`text-mobily-${tech.id}`}>
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 font-semibold">
                              {tech.mobilySim}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-2 py-3 sm:px-4 sm:py-4 text-center text-xs sm:text-sm" data-testid={`text-stc-${tech.id}`}>
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-100 font-semibold">
                              {tech.stcSim}
                            </span>
                          </td>
                          <td className="hidden md:table-cell px-2 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm text-muted-foreground max-w-xs truncate" data-testid={`text-notes-${tech.id}`}>
                            {tech.notes || '-'}
                          </td>
                          <td className="whitespace-nowrap px-2 py-3 sm:px-4 sm:py-4">
                            <div className="flex items-center justify-center space-x-1 space-x-reverse">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(tech)}
                                className="h-8 w-8 hover:bg-accent"
                                title="تعديل"
                                data-testid={`button-edit-${tech.id}`}
                              >
                                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(tech.id)}
                                className="h-8 w-8 hover:bg-destructive/10"
                                title="حذف"
                                data-testid={`button-delete-${tech.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {filteredTechnicians && filteredTechnicians.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                إجمالي الفنيين: <span className="font-semibold text-foreground">{filteredTechnicians.length}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AddTechnicianModal open={showAddModal} onOpenChange={setShowAddModal} />
      <EditTechnicianModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal}
        technician={selectedTechnician}
      />
    </>
  );
}
