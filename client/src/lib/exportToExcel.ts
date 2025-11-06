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
  companyName = 'نظام إدارة المخزون - RAS Saudi',
  reportTitle = 'تقرير المستودعات الشامل'
}: WarehouseExportData) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('تقرير المستودعات');

  worksheet.views = [{ rightToLeft: true }];

  const currentDate = new Date();
  const arabicDate = currentDate.toLocaleDateString('ar-SA', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const time = currentDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

  worksheet.mergeCells('A1:W1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = companyName;
  titleCell.font = { size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF18B2B0' }
  };
  titleCell.border = {
    top: { style: 'medium', color: { argb: 'FF18B2B0' } },
    left: { style: 'medium', color: { argb: 'FF18B2B0' } },
    bottom: { style: 'medium', color: { argb: 'FF18B2B0' } },
    right: { style: 'medium', color: { argb: 'FF18B2B0' } }
  };
  worksheet.getRow(1).height = 35;

  worksheet.mergeCells('A2:W2');
  const subtitleCell = worksheet.getCell('A2');
  subtitleCell.value = reportTitle;
  subtitleCell.font = { size: 16, bold: true, color: { argb: 'FF18B2B0' } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  subtitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0F7F6' }
  };
  worksheet.getRow(2).height = 28;

  worksheet.mergeCells('A3:W3');
  const dateCell = worksheet.getCell('A3');
  dateCell.value = `تاريخ التقرير: ${arabicDate} - الساعة: ${time}`;
  dateCell.font = { size: 12, bold: true };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
  dateCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0F9FF' }
  };
  worksheet.getRow(3).height = 25;

  worksheet.addRow([]);

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
  
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4A5568' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });

  let totalActive = 0;
  let totalInactive = 0;
  let grandTotalItems = 0;

  let totals = {
    n950Boxes: 0, n950Units: 0,
    i9000sBoxes: 0, i9000sUnits: 0,
    i9100Boxes: 0, i9100Units: 0,
    rollPaperBoxes: 0, rollPaperUnits: 0,
    stickersBoxes: 0, stickersUnits: 0,
    newBatteriesBoxes: 0, newBatteriesUnits: 0,
    mobilySimBoxes: 0, mobilySimUnits: 0,
    stcSimBoxes: 0, stcSimUnits: 0,
    zainSimBoxes: 0, zainSimUnits: 0
  };

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

    if (inv) {
      totals.n950Boxes += inv.n950Boxes || 0;
      totals.n950Units += inv.n950Units || 0;
      totals.i9000sBoxes += inv.i9000sBoxes || 0;
      totals.i9000sUnits += inv.i9000sUnits || 0;
      totals.i9100Boxes += inv.i9100Boxes || 0;
      totals.i9100Units += inv.i9100Units || 0;
      totals.rollPaperBoxes += inv.rollPaperBoxes || 0;
      totals.rollPaperUnits += inv.rollPaperUnits || 0;
      totals.stickersBoxes += inv.stickersBoxes || 0;
      totals.stickersUnits += inv.stickersUnits || 0;
      totals.newBatteriesBoxes += inv.newBatteriesBoxes || 0;
      totals.newBatteriesUnits += inv.newBatteriesUnits || 0;
      totals.mobilySimBoxes += inv.mobilySimBoxes || 0;
      totals.mobilySimUnits += inv.mobilySimUnits || 0;
      totals.stcSimBoxes += inv.stcSimBoxes || 0;
      totals.stcSimUnits += inv.stcSimUnits || 0;
      totals.zainSimBoxes += inv.zainSimBoxes || 0;
      totals.zainSimUnits += inv.zainSimUnits || 0;
    }

    const dataRow = worksheet.addRow([
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
    
    dataRow.alignment = { horizontal: 'center', vertical: 'middle' };
    dataRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
  });

  const totalRow = worksheet.addRow([
    '',
    'الإجمالي',
    '',
    '',
    totals.n950Boxes,
    totals.n950Units,
    totals.i9000sBoxes,
    totals.i9000sUnits,
    totals.i9100Boxes,
    totals.i9100Units,
    totals.rollPaperBoxes,
    totals.rollPaperUnits,
    totals.stickersBoxes,
    totals.stickersUnits,
    totals.newBatteriesBoxes,
    totals.newBatteriesUnits,
    totals.mobilySimBoxes,
    totals.mobilySimUnits,
    totals.stcSimBoxes,
    totals.stcSimUnits,
    totals.zainSimBoxes,
    totals.zainSimUnits,
    grandTotalItems
  ]);

  totalRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
  totalRow.alignment = { horizontal: 'center', vertical: 'middle' };
  totalRow.height = 25;
  totalRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF16A085' }
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });

  const totalBoxRow = worksheet.addRow([
    '',
    'إجمالي الصناديق',
    '',
    '',
    totals.n950Boxes,
    '',
    totals.i9000sBoxes,
    '',
    totals.i9100Boxes,
    '',
    totals.rollPaperBoxes,
    '',
    totals.stickersBoxes,
    '',
    totals.newBatteriesBoxes,
    '',
    totals.mobilySimBoxes,
    '',
    totals.stcSimBoxes,
    '',
    totals.zainSimBoxes,
    '',
    ''
  ]);

  totalBoxRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
  totalBoxRow.alignment = { horizontal: 'center', vertical: 'middle' };
  totalBoxRow.height = 25;
  totalBoxRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF16A085' }
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
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
  
  const statsHeaderRow = worksheet.addRow(['الإحصائيات العامة']);
  worksheet.mergeCells(statsHeaderRow.number, 1, statsHeaderRow.number, 23);
  statsHeaderRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  statsHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
  statsHeaderRow.height = 28;
  statsHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF16A085' }
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF000000' } },
      left: { style: 'medium', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'medium', color: { argb: 'FF000000' } }
    };
  });

  const statsLabelRow = worksheet.addRow([
    'إجمالي المستودعات',
    warehouses.length,
    'N950 (صناديق)',
    totals.n950Boxes,
    'I9000s (صناديق)',
    totals.i9000sBoxes,
    'I9100 (صناديق)',
    totals.i9100Boxes
  ]);
  statsLabelRow.alignment = { horizontal: 'center', vertical: 'middle' };
  statsLabelRow.eachCell((cell, colNumber) => {
    if (colNumber % 2 === 1) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0F7F6' }
      };
      cell.font = { bold: true };
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });

  const statsRow2 = worksheet.addRow([
    'ورق حراري (صناديق)',
    totals.rollPaperBoxes,
    'ملصقات (صناديق)',
    totals.stickersBoxes,
    'بطاريات (صناديق)',
    totals.newBatteriesBoxes,
    'موبايلي (صناديق)',
    totals.mobilySimBoxes
  ]);
  statsRow2.alignment = { horizontal: 'center', vertical: 'middle' };
  statsRow2.eachCell((cell, colNumber) => {
    if (colNumber % 2 === 1) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0F7F6' }
      };
      cell.font = { bold: true };
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });

  const statsRow3 = worksheet.addRow([
    'STC (صناديق)',
    totals.stcSimBoxes,
    'زين (صناديق)',
    totals.zainSimBoxes,
    'المستودعات النشطة',
    totalActive,
    'المستودعات غير النشطة',
    totalInactive
  ]);
  statsRow3.alignment = { horizontal: 'center', vertical: 'middle' };
  statsRow3.eachCell((cell, colNumber) => {
    if (colNumber % 2 === 1) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0F7F6' }
      };
      cell.font = { bold: true };
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `تقرير_المستودعات_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(blob, fileName);
};
