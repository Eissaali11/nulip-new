import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileSpreadsheet, Edit, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TechnicianInventory } from "@shared/schema";
import AddTechnicianModal from "./add-technician-modal";
import * as XLSX from 'xlsx';

export default function TechniciansTable() {
  const { toast } = useToast();
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
    
    const data: any[][] = [
      ['نظام إدارة المخزون'],
      ['تقرير بيانات الفنيين'],
      [`تاريخ التقرير: ${currentDate}`],
      [],
      ['#', 'اسم الفني', 'المدينة', 'أجهزة N950', 'أجهزة I900', 'أوراق رول ملصقات', 'شرائح موبايلي', 'شرائح STC', 'ملاحظات'],
    ];
    
    filteredTechnicians.forEach((tech, index) => {
      data.push([
        index + 1,
        tech.technicianName,
        tech.city,
        tech.n950Devices,
        tech.i900Devices,
        tech.rollPapers,
        tech.mobilySim,
        tech.stcSim,
        tech.notes || '-'
      ]);
    });
    
    data.push([]);
    data.push(['📊 الإحصائيات']);
    data.push(['إجمالي الفنيين:', filteredTechnicians.length]);
    data.push(['إجمالي أجهزة N950:', filteredTechnicians.reduce((sum, t) => sum + t.n950Devices, 0)]);
    data.push(['إجمالي أجهزة I900:', filteredTechnicians.reduce((sum, t) => sum + t.i900Devices, 0)]);
    data.push(['إجمالي الأوراق:', filteredTechnicians.reduce((sum, t) => sum + t.rollPapers, 0)]);
    data.push(['إجمالي شرائح موبايلي:', filteredTechnicians.reduce((sum, t) => sum + t.mobilySim, 0)]);
    data.push(['إجمالي شرائح STC:', filteredTechnicians.reduce((sum, t) => sum + t.stcSim, 0)]);
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    const colWidths = [
      { wch: 6 },   // #
      { wch: 25 },  // اسم الفني
      { wch: 20 },  // المدينة
      { wch: 15 },  // N950
      { wch: 15 },  // I900
      { wch: 20 },  // أوراق
      { wch: 18 },  // موبايلي
      { wch: 15 },  // STC
      { wch: 30 },  // ملاحظات
    ];
    ws['!cols'] = colWidths;
    
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
    ];
    ws['!merges'] = merges;
    
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير الفنيين');
    
    const fileName = `تقرير_الفنيين_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "تم تصدير التقرير بنجاح",
      description: `تم تصدير ${filteredTechnicians.length} سجل`,
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">بيانات الفنيين</h2>
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="البحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="input-search"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              </div>
              
              <Button
                onClick={handleExport}
                variant="outline"
                className="flex items-center space-x-2 space-x-reverse bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 border-emerald-200 dark:border-emerald-800"
                data-testid="button-export-excel"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300">تصدير Excel</span>
              </Button>
              
              <Button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 space-x-reverse"
                data-testid="button-add-technician"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة فني</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {!filteredTechnicians || filteredTechnicians.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد بيانات"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-right p-4 font-medium text-foreground">اسم الفني</th>
                    <th className="text-right p-4 font-medium text-foreground">المدينة</th>
                    <th className="text-right p-4 font-medium text-foreground">أجهزة N950</th>
                    <th className="text-right p-4 font-medium text-foreground">أجهزة I900</th>
                    <th className="text-right p-4 font-medium text-foreground">أوراق رول</th>
                    <th className="text-right p-4 font-medium text-foreground">شرائح موبايلي</th>
                    <th className="text-right p-4 font-medium text-foreground">شرائح STC</th>
                    <th className="text-right p-4 font-medium text-foreground">ملاحظات</th>
                    <th className="text-right p-4 font-medium text-foreground">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTechnicians.map((tech) => (
                    <tr key={tech.id} className="hover:bg-accent/50 transition-colors">
                      <td className="p-4 font-medium text-foreground" data-testid={`text-name-${tech.id}`}>
                        {tech.technicianName}
                      </td>
                      <td className="p-4 text-muted-foreground" data-testid={`text-city-${tech.id}`}>
                        {tech.city}
                      </td>
                      <td className="p-4 text-center" data-testid={`text-n950-${tech.id}`}>
                        {tech.n950Devices}
                      </td>
                      <td className="p-4 text-center" data-testid={`text-i900-${tech.id}`}>
                        {tech.i900Devices}
                      </td>
                      <td className="p-4 text-center" data-testid={`text-papers-${tech.id}`}>
                        {tech.rollPapers}
                      </td>
                      <td className="p-4 text-center" data-testid={`text-mobily-${tech.id}`}>
                        {tech.mobilySim}
                      </td>
                      <td className="p-4 text-center" data-testid={`text-stc-${tech.id}`}>
                        {tech.stcSim}
                      </td>
                      <td className="p-4 text-muted-foreground text-sm" data-testid={`text-notes-${tech.id}`}>
                        {tech.notes || '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-accent"
                            title="تعديل"
                            data-testid={`button-edit-${tech.id}`}
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(tech.id)}
                            className="hover:bg-destructive/10"
                            title="حذف"
                            data-testid={`button-delete-${tech.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddTechnicianModal open={showAddModal} onOpenChange={setShowAddModal} />
    </>
  );
}
