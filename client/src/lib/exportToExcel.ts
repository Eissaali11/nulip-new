import * as XLSX from 'xlsx';
import { InventoryItemWithStatus } from '@shared/schema';

interface ExportData {
  inventory: InventoryItemWithStatus[];
  companyName?: string;
  reportTitle?: string;
}

const getTypeNameArabic = (type: string): string => {
  switch (type) {
    case 'devices':
      return 'أجهزة';
    case 'sim':
      return 'شرائح';
    case 'papers':
      return 'أوراق';
    default:
      return type;
  }
};

const getStatusNameArabic = (status: string): string => {
  switch (status) {
    case 'available':
      return 'متوفر';
    case 'low':
      return 'منخفض';
    case 'out':
      return 'نافد';
    default:
      return status;
  }
};

export const exportInventoryToExcel = ({ 
  inventory, 
  companyName = 'نظام إدارة المخزون', 
  reportTitle = 'تقرير المخزون الشامل' 
}: ExportData) => {
  const wb = XLSX.utils.book_new();
  
  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // إنشاء البيانات
  const data: any[][] = [
    [companyName],
    [reportTitle],
    [`تاريخ التقرير: ${currentDate}`],
    [],
    ['#', 'اسم الصنف', 'النوع', 'الكمية', 'الوحدة', 'الحد الأدنى', 'الحالة', 'المنطقة'],
  ];
  
  inventory.forEach((item, index) => {
    data.push([
      index + 1,
      item.name,
      getTypeNameArabic(item.type),
      item.quantity,
      item.unit,
      item.minThreshold,
      getStatusNameArabic(item.status),
      item.regionName || 'غير محدد'
    ]);
  });
  
  data.push([]);
  data.push(['📊 الإحصائيات']);
  data.push(['إجمالي الأصناف:', inventory.length]);
  data.push(['الأصناف المتوفرة:', inventory.filter(i => i.status === 'available').length]);
  data.push(['الأصناف المنخفضة:', inventory.filter(i => i.status === 'low').length]);
  data.push(['الأصناف النافدة:', inventory.filter(i => i.status === 'out').length]);
  data.push(['إجمالي الكميات:', inventory.reduce((sum, item) => sum + item.quantity, 0)]);
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // تعيين عرض الأعمدة
  const colWidths = [
    { wch: 6 },   // #
    { wch: 30 },  // اسم الصنف
    { wch: 15 },  // النوع
    { wch: 12 },  // الكمية
    { wch: 15 },  // الوحدة
    { wch: 15 },  // الحد الأدنى
    { wch: 15 },  // الحالة
    { wch: 25 },  // المنطقة
  ];
  ws['!cols'] = colWidths;
  
  // دمج خلايا الرأس
  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
  ];
  ws['!merges'] = merges;
  
  XLSX.utils.book_append_sheet(wb, ws, 'تقرير المخزون');
  
  const fileName = `تقرير_المخزون_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
