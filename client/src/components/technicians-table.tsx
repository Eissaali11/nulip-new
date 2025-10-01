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
import * as XLSX from 'xlsx';

export default function TechniciansTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

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

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف بيانات هذا الفني؟")) {
      deleteMutation.mutate(id);
    }
  };

  const handleExport = () => {
    if (!filteredTechnicians || filteredTechnicians.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        description: "يجب أن يكون هناك بيانات لتصديرها",
        variant: "destructive",
      });
      return;
    }

    const wb = XLSX.utils.book_new();
    
    const currentDate = new Date().toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Build data array
    const data: any[][] = [
      ['نظام إدارة مخزون الفنيين'],
      [`تاريخ التقرير: ${currentDate}`],
      [],
      ['#', 'اسم الفني', 'المدينة', 'أجهزة N950', 'أجهزة I900', 'أوراق رول', 'ملصقات مداء', 'شرائح موبايلي', 'شرائح STC', 'ملاحظات'],
    ];
    
    // Add technician data
    filteredTechnicians.forEach((tech, index) => {
      data.push([
        index + 1,
        tech.technicianName,
        tech.city,
        tech.n950Devices,
        tech.i900Devices,
        tech.rollPaper,
        tech.stickers,
        tech.mobilySim,
        tech.stcSim,
        tech.notes || '-'
      ]);
    });
    
    // Add summary statistics in organized rows
    const statsStartRow = data.length + 1;
    data.push([]);
    data.push(['الإحصائيات الإجمالية', '', '', '', '', '', '', '', '', '']);
    data.push([
      'إجمالي الفنيين',
      filteredTechnicians.length,
      'إجمالي N950',
      filteredTechnicians.reduce((sum, t) => sum + t.n950Devices, 0),
      'إجمالي I900',
      filteredTechnicians.reduce((sum, t) => sum + t.i900Devices, 0),
      'إجمالي أوراق رول',
      filteredTechnicians.reduce((sum, t) => sum + t.rollPaper, 0),
      '',
      ''
    ]);
    data.push([
      'إجمالي ملصقات',
      filteredTechnicians.reduce((sum, t) => sum + t.stickers, 0),
      'إجمالي موبايلي',
      filteredTechnicians.reduce((sum, t) => sum + t.mobilySim, 0),
      'إجمالي STC',
      filteredTechnicians.reduce((sum, t) => sum + t.stcSim, 0),
      '',
      '',
      '',
      ''
    ]);
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 8 },   // #
      { wch: 25 },  // اسم الفني
      { wch: 18 },  // المدينة
      { wch: 14 },  // N950
      { wch: 14 },  // I900
      { wch: 14 },  // أوراق رول
      { wch: 16 },  // ملصقات مداء
      { wch: 16 },  // موبايلي
      { wch: 14 },  // STC
      { wch: 35 },  // ملاحظات
    ];
    
    // Set row heights for better appearance
    ws['!rows'] = [
      { hpt: 30 },  // Title row
      { hpt: 20 },  // Date row
      { hpt: 10 },  // Empty row
      { hpt: 25 },  // Header row
    ];
    
    // Merge cells for title and headers
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },  // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },  // Date
      { s: { r: statsStartRow + 1, c: 0 }, e: { r: statsStartRow + 1, c: 9 } },  // Stats title
    ];
    
    // Apply cell styles
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        
        // Initialize cell style
        if (!ws[cellAddress].s) ws[cellAddress].s = {};
        
        // Title row (0)
        if (R === 0) {
          ws[cellAddress].s = {
            font: { bold: true, sz: 18, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "1F4788" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
        
        // Date row (1)
        else if (R === 1) {
          ws[cellAddress].s = {
            font: { sz: 12, color: { rgb: "444444" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
        
        // Header row (3)
        else if (R === 3) {
          ws[cellAddress].s = {
            font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "2E7D32" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          };
        }
        
        // Data rows
        else if (R > 3 && R < statsStartRow) {
          ws[cellAddress].s = {
            alignment: { horizontal: C === 0 ? "center" : (C === 1 || C === 2 || C === 9 ? "right" : "center"), vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "DDDDDD" } },
              bottom: { style: "thin", color: { rgb: "DDDDDD" } },
              left: { style: "thin", color: { rgb: "DDDDDD" } },
              right: { style: "thin", color: { rgb: "DDDDDD" } }
            },
            fill: { fgColor: { rgb: R % 2 === 0 ? "F5F5F5" : "FFFFFF" } }
          };
        }
        
        // Stats title row
        else if (R === statsStartRow + 1) {
          ws[cellAddress].s = {
            font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "FF6F00" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
        
        // Stats data rows
        else if (R > statsStartRow + 1) {
          ws[cellAddress].s = {
            font: { bold: C % 2 === 0, sz: 11 },
            fill: { fgColor: { rgb: "FFF3E0" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "FFB74D" } },
              bottom: { style: "thin", color: { rgb: "FFB74D" } },
              left: { style: "thin", color: { rgb: "FFB74D" } },
              right: { style: "thin", color: { rgb: "FFB74D" } }
            }
          };
        }
      }
    }
    
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير الفنيين');
    
    const fileName = `تقرير_الفنيين_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
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
    </>
  );
}
