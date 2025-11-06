import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { InventoryItemWithStatus } from '@shared/schema';

interface ExportData {
  inventory: InventoryItemWithStatus[];
  companyName?: string;
  reportTitle?: string;
}

interface WarehouseInventory {
  id: string;
  warehouseId: string;
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

interface WarehouseData {
  id: string;
  name: string;
  location: string;
  description: string | null;
  isActive: boolean;
  regionId: string | null;
  inventory: WarehouseInventory | null;
}

interface WarehouseExportData {
  warehouses: WarehouseData[];
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

export const exportInventoryToExcel = async ({ 
  inventory, 
  companyName = 'نظام إدارة المخزون', 
  reportTitle = 'تقرير المخزون الشامل' 
}: ExportData) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('تقرير المخزون');

  worksheet.views = [{ rightToLeft: true }];

  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  worksheet.mergeCells('A1:J1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = companyName;
  titleCell.font = { size: 18, bold: true, color: { argb: 'FF18B2B0' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:J2');
  const subtitleCell = worksheet.getCell('A2');
  subtitleCell.value = reportTitle;
  subtitleCell.font = { size: 14, bold: true };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A3:J3');
  const dateCell = worksheet.getCell('A3');
  dateCell.value = `تاريخ التقرير: ${currentDate}`;
  dateCell.font = { size: 11 };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

  const headerRow = worksheet.addRow(['#', 'اسم الصنف', 'النوع', 'الكمية', 'الوحدة', 'الحد الأدنى', 'اسم الفني', 'المدينة', 'الحالة', 'المنطقة']);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF18B2B0' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  inventory.forEach((item, index) => {
    worksheet.addRow([
      index + 1,
      item.name,
      getTypeNameArabic(item.type),
      item.quantity,
      item.unit,
      item.minThreshold,
      item.technicianName || '-',
      item.city || '-',
      getStatusNameArabic(item.status),
      item.regionName || 'غير محدد'
    ]);
  });

  worksheet.columns = [
    { width: 6 },
    { width: 30 },
    { width: 15 },
    { width: 12 },
    { width: 15 },
    { width: 15 },
    { width: 20 },
    { width: 20 },
    { width: 15 },
    { width: 25 },
  ];

  worksheet.addRow([]);
  worksheet.addRow(['📊 الإحصائيات']).font = { bold: true, size: 12 };
  worksheet.addRow(['إجمالي الأصناف:', inventory.length]);
  worksheet.addRow(['الأصناف المتوفرة:', inventory.filter(i => i.status === 'available').length]);
  worksheet.addRow(['الأصناف المنخفضة:', inventory.filter(i => i.status === 'low').length]);
  worksheet.addRow(['الأصناف النافدة:', inventory.filter(i => i.status === 'out').length]);
  worksheet.addRow(['إجمالي الكميات:', inventory.reduce((sum, item) => sum + item.quantity, 0)]);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `تقرير_المخزون_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(blob, fileName);
};

export const exportWarehousesToExcel = async ({
  warehouses,
  companyName = 'نظام إدارة المخزون',
  reportTitle = 'تقرير المستودعات الشامل'
}: WarehouseExportData) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('تقرير المستودعات');

  worksheet.views = [{ rightToLeft: true }];

  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  worksheet.mergeCells('A1:W1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = companyName;
  titleCell.font = { size: 18, bold: true, color: { argb: 'FF18B2B0' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:W2');
  const subtitleCell = worksheet.getCell('A2');
  subtitleCell.value = reportTitle;
  subtitleCell.font = { size: 14, bold: true };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A3:W3');
  const dateCell = worksheet.getCell('A3');
  dateCell.value = `تاريخ التقرير: ${currentDate}`;
  dateCell.font = { size: 11 };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

  const headerRow = worksheet.addRow([
    '#',
    'اسم المستودع',
    'الموقع',
    'الحالة',
    'N950 (صناديق)',
    'N950 (قطع)',
    'I9000s (صناديق)',
    'I9000s (قطع)',
    'I9100 (صناديق)',
    'I9100 (قطع)',
    'ورق حراري (صناديق)',
    'ورق حراري (قطع)',
    'ملصقات (صناديق)',
    'ملصقات (قطع)',
    'بطاريات (صناديق)',
    'بطاريات (قطع)',
    'موبايلي (صناديق)',
    'موبايلي (قطع)',
    'STC (صناديق)',
    'STC (قطع)',
    'زين (صناديق)',
    'زين (قطع)',
    'إجمالي الأصناف'
  ]);
  
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF18B2B0' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  let totalActive = 0;
  let totalInactive = 0;
  let grandTotalItems = 0;

  warehouses.forEach((warehouse, index) => {
    const inv = warehouse.inventory;
    
    if (warehouse.isActive) {
      totalActive++;
    } else {
      totalInactive++;
    }

    const totalItems = inv ? (
      inv.n950Boxes + inv.n950Units +
      inv.i9000sBoxes + inv.i9000sUnits +
      inv.i9100Boxes + inv.i9100Units +
      inv.rollPaperBoxes + inv.rollPaperUnits +
      inv.stickersBoxes + inv.stickersUnits +
      inv.newBatteriesBoxes + inv.newBatteriesUnits +
      inv.mobilySimBoxes + inv.mobilySimUnits +
      inv.stcSimBoxes + inv.stcSimUnits +
      inv.zainSimBoxes + inv.zainSimUnits
    ) : 0;

    grandTotalItems += totalItems;

    worksheet.addRow([
      index + 1,
      warehouse.name,
      warehouse.location,
      warehouse.isActive ? 'نشط' : 'غير نشط',
      inv?.n950Boxes || 0,
      inv?.n950Units || 0,
      inv?.i9000sBoxes || 0,
      inv?.i9000sUnits || 0,
      inv?.i9100Boxes || 0,
      inv?.i9100Units || 0,
      inv?.rollPaperBoxes || 0,
      inv?.rollPaperUnits || 0,
      inv?.stickersBoxes || 0,
      inv?.stickersUnits || 0,
      inv?.newBatteriesBoxes || 0,
      inv?.newBatteriesUnits || 0,
      inv?.mobilySimBoxes || 0,
      inv?.mobilySimUnits || 0,
      inv?.stcSimBoxes || 0,
      inv?.stcSimUnits || 0,
      inv?.zainSimBoxes || 0,
      inv?.zainSimUnits || 0,
      totalItems
    ]);
  });

  worksheet.columns = [
    { width: 6 },
    { width: 25 },
    { width: 25 },
    { width: 12 },
    { width: 15 },
    { width: 12 },
    { width: 15 },
    { width: 12 },
    { width: 15 },
    { width: 12 },
    { width: 18 },
    { width: 15 },
    { width: 15 },
    { width: 12 },
    { width: 15 },
    { width: 12 },
    { width: 15 },
    { width: 12 },
    { width: 15 },
    { width: 12 },
    { width: 15 },
    { width: 12 },
    { width: 15 },
  ];

  worksheet.addRow([]);
  worksheet.addRow(['📊 الإحصائيات العامة']).font = { bold: true, size: 12 };
  worksheet.addRow(['إجمالي المستودعات:', warehouses.length]);
  worksheet.addRow(['المستودعات النشطة:', totalActive]);
  worksheet.addRow(['المستودعات غير النشطة:', totalInactive]);
  worksheet.addRow(['إجمالي الأصناف في جميع المستودعات:', grandTotalItems]);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `تقرير_المستودعات_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(blob, fileName);
};
