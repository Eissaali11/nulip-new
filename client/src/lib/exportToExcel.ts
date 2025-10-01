import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
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

export const exportInventoryToExcel = ({ inventory, companyName = 'نظام إدارة المخزون', reportTitle = 'تقرير المخزون الشامل' }: ExportData) => {
  // إنشاء workbook جديد
  const wb = XLSX.utils.book_new();
  
  // تحضير البيانات
  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // إنشاء البيانات للجدول
  const data = [
    // رأس التقرير
    [companyName],
    [reportTitle],
    [`تاريخ التقرير: ${currentDate}`],
    [], // سطر فارغ
    // عناوين الأعمدة
    ['#', 'اسم الصنف', 'النوع', 'الكمية المتبقية', 'الوحدة', 'الحد الأدنى', 'الحالة', 'المنطقة'],
  ];
  
  // إضافة بيانات المخزون
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
  
  // إضافة إحصائيات في النهاية
  data.push([]);
  data.push(['الإحصائيات']);
  data.push(['إجمالي الأصناف', inventory.length]);
  data.push(['الأصناف المتوفرة', inventory.filter(i => i.status === 'available').length]);
  data.push(['الأصناف المنخفضة', inventory.filter(i => i.status === 'low').length]);
  data.push(['الأصناف النافدة', inventory.filter(i => i.status === 'out').length]);
  data.push(['إجمالي الكميات', inventory.reduce((sum, item) => sum + item.quantity, 0)]);
  
  // إنشاء الورقة
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // تنسيق عرض الأعمدة
  ws['!cols'] = [
    { wch: 5 },   // #
    { wch: 25 },  // اسم الصنف
    { wch: 12 },  // النوع
    { wch: 15 },  // الكمية
    { wch: 12 },  // الوحدة
    { wch: 12 },  // الحد الأدنى
    { wch: 12 },  // الحالة
    { wch: 20 },  // المنطقة
  ];
  
  // تنسيق الصفوف (ارتفاع الصفوف)
  ws['!rows'] = [
    { hpt: 30 }, // رأس التقرير - سطر 1
    { hpt: 25 }, // عنوان التقرير - سطر 2
    { hpt: 20 }, // التاريخ - سطر 3
    { hpt: 10 }, // سطر فارغ
    { hpt: 25 }, // عناوين الأعمدة
  ];
  
  // دمج الخلايا للرأس
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // دمج رأس التقرير
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // دمج عنوان التقرير
    { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }, // دمج التاريخ
  ];
  
  // تطبيق التنسيقات على الخلايا
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) continue;
      
      const cell = ws[cellAddress];
      
      // تنسيق رأس التقرير (أول 3 أسطر)
      if (R <= 2) {
        cell.s = {
          font: { 
            name: 'Arial', 
            sz: R === 0 ? 18 : R === 1 ? 16 : 12, 
            bold: R <= 1,
            color: { rgb: "1F4788" }
          },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: "E7F3FF" } },
        };
      }
      // تنسيق عناوين الأعمدة (سطر 5)
      else if (R === 4) {
        cell.s = {
          font: { name: 'Arial', sz: 11, bold: true, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: "2C5F9E" } },
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        };
      }
      // تنسيق بيانات الجدول
      else if (R > 4 && R < data.length - 6) {
        const isEvenRow = (R - 5) % 2 === 0;
        cell.s = {
          font: { name: 'Arial', sz: 10 },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: isEvenRow ? "FFFFFF" : "F8F9FA" } },
          border: {
            top: { style: 'thin', color: { rgb: "E0E0E0" } },
            bottom: { style: 'thin', color: { rgb: "E0E0E0" } },
            left: { style: 'thin', color: { rgb: "E0E0E0" } },
            right: { style: 'thin', color: { rgb: "E0E0E0" } }
          }
        };
        
        // تلوين حسب الحالة (عمود الحالة)
        if (C === 6) {
          const status = inventory[R - 5]?.status;
          if (status === 'available') {
            cell.s.font = { ...cell.s.font, color: { rgb: "047857" }, bold: true };
          } else if (status === 'low') {
            cell.s.font = { ...cell.s.font, color: { rgb: "D97706" }, bold: true };
          } else if (status === 'out') {
            cell.s.font = { ...cell.s.font, color: { rgb: "DC2626" }, bold: true };
          }
        }
      }
      // تنسيق قسم الإحصائيات
      else if (R >= data.length - 6) {
        if (data[R][0] === 'الإحصائيات') {
          cell.s = {
            font: { name: 'Arial', sz: 14, bold: true, color: { rgb: "1F4788" } },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: "E7F3FF" } },
          };
        } else {
          cell.s = {
            font: { name: 'Arial', sz: 11, bold: C === 1 },
            alignment: { horizontal: C === 0 ? 'right' : 'center', vertical: 'center' },
            fill: { fgColor: { rgb: "F8F9FA" } },
          };
        }
      }
    }
  }
  
  // إضافة الورقة إلى الكتاب
  XLSX.utils.book_append_sheet(wb, ws, 'تقرير المخزون');
  
  // تصدير الملف
  const fileName = `تقرير_المخزون_${new Date().toISOString().split('T')[0]}.xlsx`;
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName);
};
