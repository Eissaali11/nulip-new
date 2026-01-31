import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Home, ArrowRight, AlertTriangle, CheckCircle, XCircle, Package, TrendingUp, User, BarChart3, FileDown, Search, X } from "lucide-react";
import { useLocation } from "wouter";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Navbar } from "@/components/dashboard/Navbar";
import { GridBackground } from "@/components/dashboard/GridBackground";
import dashboardBg from "@assets/image_1762515061799.png";
import { useAuth } from "@/lib/auth";
import { useActiveItemTypes, getItemTypeVisuals, type ItemType } from "@/hooks/use-item-types";

interface TechnicianInventoryData {
  technicianId: string;
  technicianName: string;
  city: string;
  regionId: string;
  fixedInventory: {
    id: string;
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
    lowStockThreshold: number;
    criticalStockThreshold: number;
  } | null;
  movingInventory: {
    id: string;
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
  } | null;
  alertLevel: 'good' | 'warning' | 'critical';
}

const legacyFieldMapping: Record<string, { boxes: string; units: string }> = {
  n950: { boxes: "n950Boxes", units: "n950Units" },
  i9000s: { boxes: "i9000sBoxes", units: "i9000sUnits" },
  i9100: { boxes: "i9100Boxes", units: "i9100Units" },
  rollPaper: { boxes: "rollPaperBoxes", units: "rollPaperUnits" },
  stickers: { boxes: "stickersBoxes", units: "stickersUnits" },
  newBatteries: { boxes: "newBatteriesBoxes", units: "newBatteriesUnits" },
  mobilySim: { boxes: "mobilySimBoxes", units: "mobilySimUnits" },
  stcSim: { boxes: "stcSimBoxes", units: "stcSimUnits" },
  zainSim: { boxes: "zainSimBoxes", units: "zainSimUnits" },
  lebaraSim: { boxes: "lebaraBoxes", units: "lebaraUnits" },
};

function getInventoryValue(inventory: any, itemTypeId: string, metric: 'boxes' | 'units'): number {
  if (!inventory) return 0;
  const legacy = legacyFieldMapping[itemTypeId];
  if (legacy) {
    const fieldName = metric === 'boxes' ? legacy.boxes : legacy.units;
    return (inventory as any)[fieldName] || 0;
  }
  return 0;
}

export default function AdminInventoryOverview() {
  const [, setLocation] = useLocation();
  const [searchName, setSearchName] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const { user } = useAuth();

  const { data: itemTypes } = useActiveItemTypes();

  const { data, isLoading } = useQuery<{ technicians: TechnicianInventoryData[] }>({
    queryKey: user?.role === 'admin' ? ['/api/admin/all-technicians-inventory'] : ['/api/supervisor/technicians-inventory'],
    enabled: !!user?.id && (user?.role === 'admin' || user?.role === 'supervisor'),
  });

  const activeItemTypes = (itemTypes || []).filter(t => t.isActive && t.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);

  const allTechnicians = data?.technicians || [];
  
  const technicians = allTechnicians.filter(tech => {
    const nameMatch = searchName === "" || tech.technicianName.toLowerCase().includes(searchName.toLowerCase());
    const cityMatch = searchCity === "" || tech.city.toLowerCase().includes(searchCity.toLowerCase());
    return nameMatch && cityMatch;
  });

  const getAlertBadge = (level: 'good' | 'warning' | 'critical') => {
    if (level === 'critical') {
      return (
        <Badge className="gap-1 bg-red-500 border-0" data-testid={`badge-alert-critical`}>
          <XCircle className="w-3 h-3" />
          حرج
        </Badge>
      );
    }
    if (level === 'warning') {
      return (
        <Badge className="gap-1 bg-amber-500 border-0 text-white" data-testid={`badge-alert-warning`}>
          <AlertTriangle className="w-3 h-3" />
          تحذير
        </Badge>
      );
    }
    return (
      <Badge className="gap-1 bg-green-500 border-0 text-white" data-testid={`badge-alert-good`}>
        <CheckCircle className="w-3 h-3" />
        جيد
      </Badge>
    );
  };

  const getTotalForItem = (boxes: number, units: number) => {
    return (boxes || 0) + (units || 0);
  };

  const calculateFixedTotal = (inv: TechnicianInventoryData['fixedInventory']) => {
    if (!inv) return 0;
    return activeItemTypes.reduce((total, itemType) => {
      const boxes = getInventoryValue(inv, itemType.id, 'boxes');
      const units = getInventoryValue(inv, itemType.id, 'units');
      return total + getTotalForItem(boxes, units);
    }, 0);
  };

  const calculateMovingTotal = (inv: TechnicianInventoryData['movingInventory']) => {
    if (!inv) return 0;
    return activeItemTypes.reduce((total, itemType) => {
      const boxes = getInventoryValue(inv, itemType.id, 'boxes');
      const units = getInventoryValue(inv, itemType.id, 'units');
      return total + getTotalForItem(boxes, units);
    }, 0);
  };

  const criticalTechs = technicians.filter(t => t.alertLevel === 'critical').length;
  const warningTechs = technicians.filter(t => t.alertLevel === 'warning').length;
  const goodTechs = technicians.filter(t => t.alertLevel === 'good').length;

  const createInventoryWorksheet = (
    workbook: ExcelJS.Workbook, 
    sheetName: string, 
    inventoryType: 'fixed' | 'moving',
    metric: 'boxes' | 'units'
  ) => {
    const worksheet = workbook.addWorksheet(sheetName);
    worksheet.views = [{ rightToLeft: true }];

    const currentDate = new Date();
    const arabicDate = currentDate.toLocaleDateString('ar-SA', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    const englishDate = currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    const time = currentDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    const numCols = 3 + activeItemTypes.length;
    worksheet.mergeCells(1, 1, 1, numCols);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = 'Technician Inventory Management System';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).height = 30;

    worksheet.mergeCells(2, 1, 2, numCols);
    const dateCell = worksheet.getCell(2, 1);
    dateCell.value = `تاريخ التقرير: ${arabicDate} | Report Date: ${englishDate} | ${time}`;
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    dateCell.font = { bold: true, size: 10 };
    worksheet.getRow(2).height = 20;

    worksheet.addRow([]);

    const metricLabel = metric === 'boxes' ? 'Box' : 'Unit';
    const dynamicHeaders = activeItemTypes.map(t => `${t.nameEn} ${metricLabel}`);
    const headerRow = worksheet.addRow([
      '#',
      'Technician Name',
      'City',
      ...dynamicHeaders
    ]);
    
    headerRow.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    const totals: Record<string, number> = {};
    activeItemTypes.forEach(t => { totals[t.id] = 0; });

    technicians.forEach((tech, index) => {
      const inv = inventoryType === 'fixed' ? tech.fixedInventory : tech.movingInventory;
      
      const itemValues = activeItemTypes.map(t => getInventoryValue(inv, t.id, metric));
      const data = [
        index + 1,
        tech.technicianName,
        tech.city,
        ...itemValues
      ];

      activeItemTypes.forEach((t, i) => {
        totals[t.id] += Number(itemValues[i]);
      });

      const row = worksheet.addRow(data);
      row.alignment = { horizontal: 'center', vertical: 'middle' };
      row.height = 20;
      
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
        if (colNumber === 1) cell.font = { bold: true };
      });
    });

    const totalValues = activeItemTypes.map(t => totals[t.id]);
    const totalRow = worksheet.addRow([
      '',
      'Total',
      '',
      ...totalValues
    ]);
    totalRow.font = { bold: true, size: 11 };
    totalRow.alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.height = 25;
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF92D050' }
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    const columnWidths = [{ width: 5 }, { width: 25 }, { width: 15 }];
    activeItemTypes.forEach(() => columnWidths.push({ width: 15 }));
    worksheet.columns = columnWidths;
  };

  const createTotalWorksheet = (workbook: ExcelJS.Workbook, sheetName: string) => {
    const worksheet = workbook.addWorksheet(sheetName);
    worksheet.views = [{ rightToLeft: true }];

    const currentDate = new Date();
    const arabicDate = currentDate.toLocaleDateString('ar-SA', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    const englishDate = currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    const time = currentDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    const numCols = 3 + activeItemTypes.length;
    worksheet.mergeCells(1, 1, 1, numCols);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = 'Technician Inventory Management System';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).height = 30;

    worksheet.mergeCells(2, 1, 2, numCols);
    const dateCell = worksheet.getCell(2, 1);
    dateCell.value = `تاريخ التقرير: ${arabicDate} | Report Date: ${englishDate} | ${time}`;
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    dateCell.font = { bold: true, size: 10 };
    worksheet.getRow(2).height = 20;

    worksheet.addRow([]);

    const dynamicHeaders = activeItemTypes.map(t => t.nameEn);
    const headerRow = worksheet.addRow([
      '#',
      'Technician Name',
      'City',
      ...dynamicHeaders
    ]);
    
    headerRow.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    const totals: Record<string, number> = {};
    activeItemTypes.forEach(t => { totals[t.id] = 0; });

    technicians.forEach((tech, index) => {
      const itemValues = activeItemTypes.map(t => {
        const fixedBoxes = getInventoryValue(tech.fixedInventory, t.id, 'boxes');
        const fixedUnits = getInventoryValue(tech.fixedInventory, t.id, 'units');
        const movingBoxes = getInventoryValue(tech.movingInventory, t.id, 'boxes');
        const movingUnits = getInventoryValue(tech.movingInventory, t.id, 'units');
        return getTotalForItem(fixedBoxes + movingBoxes, fixedUnits + movingUnits);
      });

      const data = [
        index + 1,
        tech.technicianName,
        tech.city,
        ...itemValues
      ];

      activeItemTypes.forEach((t, i) => {
        totals[t.id] += Number(itemValues[i]);
      });

      const row = worksheet.addRow(data);
      row.alignment = { horizontal: 'center', vertical: 'middle' };
      row.height = 20;
      
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
        if (colNumber === 1) cell.font = { bold: true };
      });
    });

    const totalValues = activeItemTypes.map(t => totals[t.id]);
    const totalRow = worksheet.addRow([
      '',
      'Total',
      '',
      ...totalValues
    ]);
    totalRow.font = { bold: true, size: 11 };
    totalRow.alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.height = 25;
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF92D050' }
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    worksheet.addRow([]);
    worksheet.addRow([]);

    const statsHeaderRow = worksheet.addRow(['Overall Statistics']);
    const statsCols = Math.min(6, numCols);
    worksheet.mergeCells(statsHeaderRow.number, 1, statsHeaderRow.number, statsCols);
    const statsHeaderCell = worksheet.getCell(statsHeaderRow.number, 1);
    statsHeaderCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    statsHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
    statsHeaderCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF92D050' }
    };
    statsHeaderRow.height = 25;

    const statsData: (string | number)[][] = [
      ['Technicians Count', technicians.length, '', ''],
    ];
    
    for (let i = 0; i < activeItemTypes.length; i += 2) {
      const t1 = activeItemTypes[i];
      const t2 = activeItemTypes[i + 1];
      statsData.push([
        t1?.nameEn || '',
        t1 ? totals[t1.id] : '',
        t2?.nameEn || '',
        t2 ? totals[t2.id] : ''
      ]);
    }

    statsData.forEach(rowData => {
      const row = worksheet.addRow(rowData);
      row.alignment = { horizontal: 'center', vertical: 'middle' };
      row.height = 20;
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
        if (colNumber === 1 || colNumber === 3) {
          cell.font = { bold: true };
        }
      });
    });

    const columnWidths = [{ width: 5 }, { width: 25 }, { width: 15 }];
    activeItemTypes.forEach(() => columnWidths.push({ width: 15 }));
    worksheet.columns = columnWidths;
  };

  const exportToExcel = async () => {
    if (technicians.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    
    createTotalWorksheet(workbook, 'مخزون شامل - Total');
    createInventoryWorksheet(workbook, 'ثابت كراتين - Fixed Boxes', 'fixed', 'boxes');
    createInventoryWorksheet(workbook, 'ثابت مفردات - Fixed Units', 'fixed', 'units');
    createInventoryWorksheet(workbook, 'متحرك كراتين - Moving Boxes', 'moving', 'boxes');
    createInventoryWorksheet(workbook, 'متحرك مفردات - Moving Units', 'moving', 'units');

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `تقرير_المخزون_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        <GridBackground />
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-center">
            <motion.div
              className="relative w-20 h-20 mx-auto mb-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#18B2B0] border-r-[#18B2B0] shadow-lg shadow-[#18B2B0]/50"></div>
            </motion.div>
            <p className="text-white text-lg font-medium">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden" dir="rtl">
      <GridBackground />
      
      <div
        className="absolute inset-0 opacity-5 bg-center bg-cover"
        style={{
          backgroundImage: `url(${dashboardBg})`,
          backgroundBlendMode: 'overlay'
        }}
      />

      <div className="relative z-10">
        <Navbar />

        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-[#18B2B0] to-[#16a09e] rounded-2xl shadow-lg shadow-[#18B2B0]/30">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
                    لوحة مخزون الفنيين
                  </h1>
                  <p className="text-gray-400 text-sm">
                    عرض شامل لمخزون جميع الفنيين
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={exportToExcel}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#18B2B0] to-[#16a09e] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#18B2B0]/50 transition-all duration-300 transform hover:scale-105"
                  type="button"
                  data-testid="button-export-all"
                >
                  <FileDown className="h-4 w-4" />
                  <span>تصدير إلى Excel</span>
                </button>
              </div>
            </div>

            {/* Search Section */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-4 sm:p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-5 w-5 text-[#18B2B0]" />
                <h2 className="text-lg font-bold text-white">البحث والتصفية</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="ابحث باسم الفني..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="pr-10 bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder:text-gray-400 focus:border-[#18B2B0] focus:ring-[#18B2B0] rounded-xl shadow-sm text-right"
                    data-testid="input-search-name"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  {searchName && (
                    <button
                      onClick={() => setSearchName("")}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      data-testid="button-clear-name"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="ابحث بالمنطقة/المدينة..."
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="pr-10 bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder:text-gray-400 focus:border-[#18B2B0] focus:ring-[#18B2B0] rounded-xl shadow-sm text-right"
                    data-testid="input-search-city"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  {searchCity && (
                    <button
                      onClick={() => setSearchCity("")}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      data-testid="button-clear-city"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {(searchName || searchCity) && (
                <div className="mt-3 text-sm text-gray-300">
                  النتائج: {technicians.length} من {allTechnicians.length} فني
                </div>
              )}
            </div>
          </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-5"
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-medium text-white">حالة حرجة</h3>
              </div>
              <p className="text-3xl font-bold text-red-400" data-testid="text-critical-count">
                {criticalTechs}
              </p>
              <p className="text-xs text-gray-300 mt-1">فني</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-5"
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-medium text-white">تحذير</h3>
              </div>
              <p className="text-3xl font-bold text-amber-400" data-testid="text-warning-count">
                {warningTechs}
              </p>
              <p className="text-xs text-gray-300 mt-1">فني</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-5"
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#18B2B0]/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-[#18B2B0] to-[#16a09e] rounded-lg shadow-md">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-medium text-white">جيد</h3>
              </div>
              <p className="text-3xl font-bold text-[#18B2B0]" data-testid="text-good-count">
                {goodTechs}
              </p>
              <p className="text-xs text-gray-300 mt-1">فني</p>
            </div>
          </motion.div>
        </div>

        {/* Technicians List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-4 sm:p-6"
        >
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#18B2B0]/10 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-[#18B2B0] to-[#16a09e] rounded-xl shadow-lg shadow-[#18B2B0]/30">
                <User className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                قائمة الفنيين ({technicians.length})
              </h2>
            </div>

            <Accordion type="multiple" className="w-full space-y-3">
            {technicians.map((tech, index) => (
              <AccordionItem 
                key={tech.technicianId}
                value={tech.technicianId} 
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden"
                data-testid={`accordion-tech-${index}`}
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-1 text-right">
                      <div className="font-bold text-base text-white" data-testid={`text-tech-name-${index}`}>
                        {tech.technicianName}
                      </div>
                      <div className="text-sm text-gray-300" data-testid={`text-tech-city-${index}`}>
                        📍 {tech.city}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {getAlertBadge(tech.alertLevel)}
                      <div className="flex items-center gap-2">
                        <div className="text-center bg-blue-500/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-blue-400/30">
                          <div className="flex items-center gap-1 text-blue-300">
                            <Package className="w-4 h-4" />
                            <span className="font-bold text-sm">{calculateFixedTotal(tech.fixedInventory)}</span>
                          </div>
                          <div className="text-xs text-blue-200">ثابت</div>
                        </div>
                        <div className="text-center bg-green-500/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-green-400/30">
                          <div className="flex items-center gap-1 text-green-300">
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-bold text-sm">{calculateMovingTotal(tech.movingInventory)}</span>
                          </div>
                          <div className="text-xs text-green-200">متحرك</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-4 pb-4 bg-white/5 backdrop-blur-sm">
                  <div className="space-y-4 pt-4">
                    {/* Fixed Inventory */}
                    <div className="bg-blue-500/10 backdrop-blur-sm p-4 rounded-xl border border-blue-400/30">
                      <h4 className="font-bold text-blue-300 mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        المخزون الثابت
                      </h4>
                      {tech.fixedInventory ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {activeItemTypes.map((itemType) => (
                            <InventoryItem 
                              key={itemType.id}
                              label={itemType.nameAr || itemType.nameEn} 
                              boxes={getInventoryValue(tech.fixedInventory, itemType.id, 'boxes')} 
                              units={getInventoryValue(tech.fixedInventory, itemType.id, 'units')}
                              testId={`fixed-${itemType.id}-${index}`}
                              color="blue"
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-300">لا توجد بيانات</p>
                      )}
                    </div>

                    {/* Moving Inventory */}
                    <div className="bg-green-500/10 backdrop-blur-sm p-4 rounded-xl border border-green-400/30">
                      <h4 className="font-bold text-green-300 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        المخزون المتحرك
                      </h4>
                      {tech.movingInventory ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {activeItemTypes.map((itemType) => (
                            <InventoryItem 
                              key={itemType.id}
                              label={itemType.nameAr || itemType.nameEn}
                              boxes={getInventoryValue(tech.movingInventory, itemType.id, 'boxes')}
                              units={getInventoryValue(tech.movingInventory, itemType.id, 'units')}
                              testId={`moving-${itemType.id}-${index}`}
                              color="green"
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-300">لا توجد بيانات</p>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
            </Accordion>
          </div>
        </motion.div>
      </div>
    </div>
    </div>
  );
}

function InventoryItem({ label, boxes, units, testId, color }: { label: string; boxes: number; units: number; testId: string; color: 'blue' | 'green' }) {
  const total = (boxes || 0) + (units || 0);
  const bgColor = color === 'blue' ? 'bg-blue-500/20' : 'bg-green-500/20';
  const borderColor = color === 'blue' ? 'border-blue-400/40' : 'border-green-400/40';
  const textColor = color === 'blue' ? 'text-blue-200' : 'text-green-200';
  
  return (
    <div 
      className={`${bgColor} backdrop-blur-sm p-2.5 rounded-lg border ${borderColor}`}
      data-testid={testId}
    >
      <div className="text-xs font-medium text-gray-300 mb-1">{label}</div>
      <div className="text-sm">
        <span className={`font-bold text-xl ${textColor}`}>{total}</span>
        <span className="text-xs text-gray-400 block mt-0.5">
          {boxes || 0} كرتون + {units || 0} مفرد
        </span>
      </div>
    </div>
  );
}
