import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

export default function AdminInventoryOverview() {
  const [, setLocation] = useLocation();
  const [searchName, setSearchName] = useState("");
  const [searchCity, setSearchCity] = useState("");

  const { data, isLoading } = useQuery<{ technicians: TechnicianInventoryData[] }>({
    queryKey: ['/api/admin/all-technicians-inventory'],
  });

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
    return (
      getTotalForItem(inv.n950Boxes, inv.n950Units) +
      getTotalForItem(inv.i9000sBoxes, inv.i9000sUnits) +
      getTotalForItem(inv.i9100Boxes, inv.i9100Units) +
      getTotalForItem(inv.rollPaperBoxes, inv.rollPaperUnits) +
      getTotalForItem(inv.stickersBoxes, inv.stickersUnits) +
      getTotalForItem(inv.newBatteriesBoxes, inv.newBatteriesUnits) +
      getTotalForItem(inv.mobilySimBoxes, inv.mobilySimUnits) +
      getTotalForItem(inv.stcSimBoxes, inv.stcSimUnits) +
      getTotalForItem(inv.zainSimBoxes, inv.zainSimUnits)
    );
  };

  const calculateMovingTotal = (inv: TechnicianInventoryData['movingInventory']) => {
    if (!inv) return 0;
    return (
      getTotalForItem(inv.n950Boxes, inv.n950Units) +
      getTotalForItem(inv.i9000sBoxes, inv.i9000sUnits) +
      getTotalForItem(inv.i9100Boxes, inv.i9100Units) +
      getTotalForItem(inv.rollPaperBoxes, inv.rollPaperUnits) +
      getTotalForItem(inv.stickersBoxes, inv.stickersUnits) +
      getTotalForItem(inv.newBatteriesBoxes, inv.newBatteriesUnits) +
      getTotalForItem(inv.mobilySimBoxes, inv.mobilySimUnits) +
      getTotalForItem(inv.stcSimBoxes, inv.stcSimUnits) +
      getTotalForItem(inv.zainSimBoxes, inv.zainSimUnits)
    );
  };

  const criticalTechs = technicians.filter(t => t.alertLevel === 'critical').length;
  const warningTechs = technicians.filter(t => t.alertLevel === 'warning').length;
  const goodTechs = technicians.filter(t => t.alertLevel === 'good').length;

  const exportToExcel = async () => {
    if (technicians.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('مخزون الفنيين');

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

    worksheet.mergeCells('A1:L1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'نظام إدارة مخزون الفنيين - Technician Inventory Management System';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
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

    worksheet.mergeCells('A2:L2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `تاريخ التقرير: ${arabicDate} | Report Date: ${englishDate} | ${time}`;
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    dateCell.font = { bold: true, size: 11 };
    dateCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0F7F7' }
    };
    worksheet.getRow(2).height = 25;

    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
      '#',
      'اسم الفني',
      'المدينة',
      'أجهزة N950',
      'أجهزة I9000s',
      'أجهزة I9100',
      'أوراق الرول',
      'ملصقات',
      'بطاريات جديدة',
      'شريحة موبايلي',
      'شريحة STC',
      'شريحة زين'
    ]);
    
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF18B2B0' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    technicians.forEach((tech, index) => {
      const row = worksheet.addRow([
        index + 1,
        tech.technicianName,
        tech.city,
        getTotalForItem(
          (tech.fixedInventory?.n950Boxes || 0) + (tech.movingInventory?.n950Boxes || 0),
          (tech.fixedInventory?.n950Units || 0) + (tech.movingInventory?.n950Units || 0)
        ),
        getTotalForItem(
          (tech.fixedInventory?.i9000sBoxes || 0) + (tech.movingInventory?.i9000sBoxes || 0),
          (tech.fixedInventory?.i9000sUnits || 0) + (tech.movingInventory?.i9000sUnits || 0)
        ),
        getTotalForItem(
          (tech.fixedInventory?.i9100Boxes || 0) + (tech.movingInventory?.i9100Boxes || 0),
          (tech.fixedInventory?.i9100Units || 0) + (tech.movingInventory?.i9100Units || 0)
        ),
        getTotalForItem(
          (tech.fixedInventory?.rollPaperBoxes || 0) + (tech.movingInventory?.rollPaperBoxes || 0),
          (tech.fixedInventory?.rollPaperUnits || 0) + (tech.movingInventory?.rollPaperUnits || 0)
        ),
        getTotalForItem(
          (tech.fixedInventory?.stickersBoxes || 0) + (tech.movingInventory?.stickersBoxes || 0),
          (tech.fixedInventory?.stickersUnits || 0) + (tech.movingInventory?.stickersUnits || 0)
        ),
        getTotalForItem(
          (tech.fixedInventory?.newBatteriesBoxes || 0) + (tech.movingInventory?.newBatteriesBoxes || 0),
          (tech.fixedInventory?.newBatteriesUnits || 0) + (tech.movingInventory?.newBatteriesUnits || 0)
        ),
        getTotalForItem(
          (tech.fixedInventory?.mobilySimBoxes || 0) + (tech.movingInventory?.mobilySimBoxes || 0),
          (tech.fixedInventory?.mobilySimUnits || 0) + (tech.movingInventory?.mobilySimUnits || 0)
        ),
        getTotalForItem(
          (tech.fixedInventory?.stcSimBoxes || 0) + (tech.movingInventory?.stcSimBoxes || 0),
          (tech.fixedInventory?.stcSimUnits || 0) + (tech.movingInventory?.stcSimUnits || 0)
        ),
        getTotalForItem(
          (tech.fixedInventory?.zainSimBoxes || 0) + (tech.movingInventory?.zainSimBoxes || 0),
          (tech.fixedInventory?.zainSimUnits || 0) + (tech.movingInventory?.zainSimUnits || 0)
        )
      ]);

      row.alignment = { horizontal: 'center', vertical: 'middle' };
      row.height = 25;
      
      const bgColor = tech.alertLevel === 'critical' ? 'FFFECACA' : 
                      tech.alertLevel === 'warning' ? 'FFFEF3C7' : 'FFD1FAE5';

      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
      });
    });

    worksheet.columns = [
      { width: 8 },
      { width: 20 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `مخزون_جميع_الفنيين_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#E0F7F7] to-white">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4 animate-spin">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#18B2B0] border-r-[#18B2B0]"></div>
          </div>
          <p className="text-slate-700 text-base font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E0F7F7] to-white" dir="rtl">
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#E0F7F7] via-white to-[#E0F7F7]/50 rounded-2xl shadow-lg border border-[#18B2B0]/20 p-4 sm:p-6 mb-6 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#18B2B0]/10 rounded-full blur-3xl"></div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#18B2B0] rounded-xl">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  لوحة مخزون الفنيين
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  عرض شامل لمخزون جميع الفنيين
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setLocation('/')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-[#18B2B0] text-[#18B2B0] font-medium rounded-lg hover:bg-[#18B2B0] hover:text-white transition-all duration-200 text-sm touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
                type="button"
                data-testid="button-back-home"
              >
                <Home className="h-4 w-4" />
                <span>الرئيسية</span>
              </button>
              
              <button
                onClick={exportToExcel}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#18B2B0] text-white font-medium rounded-lg hover:bg-[#16a09e] transition-all duration-200 text-sm touch-manipulation shadow-sm"
                style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
                type="button"
                data-testid="button-export-all"
              >
                <FileDown className="h-4 w-4" />
                <span>تصدير إلى Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#E0F7F7] via-white to-[#E0F7F7]/50 rounded-2xl shadow-lg border border-[#18B2B0]/20 p-4 sm:p-6 mb-6 backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-40 h-40 bg-[#18B2B0]/10 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-5 w-5 text-[#18B2B0]" />
              <h2 className="text-lg font-bold text-gray-900">البحث والتصفية</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="ابحث باسم الفني..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="pr-10 h-12 border-gray-300 focus:border-[#18B2B0] focus:ring-[#18B2B0]"
                data-testid="input-search-name"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              {searchName && (
                <button
                  onClick={() => setSearchName("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                className="pr-10 h-12 border-gray-300 focus:border-[#18B2B0] focus:ring-[#18B2B0]"
                data-testid="input-search-city"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              {searchCity && (
                <button
                  onClick={() => setSearchCity("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  data-testid="button-clear-city"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            </div>
            {(searchName || searchCity) && (
              <div className="mt-3 text-sm text-gray-600">
                النتائج: {technicians.length} من {allTechnicians.length} فني
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="relative overflow-hidden bg-gradient-to-br from-red-50 via-white to-red-50/30 rounded-xl shadow-lg border border-red-100 p-5 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-medium text-gray-700">حالة حرجة</h3>
              </div>
              <p className="text-3xl font-bold text-red-600" data-testid="text-critical-count">
                {criticalTechs}
              </p>
              <p className="text-xs text-gray-500 mt-1">فني</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-amber-50/30 rounded-xl shadow-lg border border-amber-100 p-5 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-medium text-gray-700">تحذير</h3>
              </div>
              <p className="text-3xl font-bold text-amber-600" data-testid="text-warning-count">
                {warningTechs}
              </p>
              <p className="text-xs text-gray-500 mt-1">فني</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-[#E0F7F7] via-white to-[#E0F7F7]/30 rounded-xl shadow-lg border border-[#18B2B0]/20 p-5 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#18B2B0]/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-[#18B2B0] to-[#16a09e] rounded-lg shadow-md">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-medium text-gray-700">جيد</h3>
              </div>
              <p className="text-3xl font-bold text-[#18B2B0]" data-testid="text-good-count">
                {goodTechs}
              </p>
              <p className="text-xs text-gray-500 mt-1">فني</p>
            </div>
          </div>
        </div>

        {/* Technicians List */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#E0F7F7] via-white to-[#E0F7F7]/50 rounded-2xl shadow-lg border border-[#18B2B0]/20 p-4 sm:p-6 backdrop-blur-sm">
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#18B2B0]/10 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#18B2B0] rounded-xl">
                <User className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                قائمة الفنيين ({technicians.length})
              </h2>
            </div>

            <Accordion type="multiple" className="w-full space-y-3">
            {technicians.map((tech, index) => (
              <AccordionItem 
                key={tech.technicianId}
                value={tech.technicianId} 
                className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden"
                data-testid={`accordion-tech-${index}`}
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-1 text-right">
                      <div className="font-bold text-base text-gray-900" data-testid={`text-tech-name-${index}`}>
                        {tech.technicianName}
                      </div>
                      <div className="text-sm text-gray-600" data-testid={`text-tech-city-${index}`}>
                        📍 {tech.city}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {getAlertBadge(tech.alertLevel)}
                      <div className="flex items-center gap-2">
                        <div className="text-center bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-1 text-blue-700">
                            <Package className="w-4 h-4" />
                            <span className="font-bold text-sm">{calculateFixedTotal(tech.fixedInventory)}</span>
                          </div>
                          <div className="text-xs text-blue-600">ثابت</div>
                        </div>
                        <div className="text-center bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                          <div className="flex items-center gap-1 text-green-700">
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-bold text-sm">{calculateMovingTotal(tech.movingInventory)}</span>
                          </div>
                          <div className="text-xs text-green-600">متحرك</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-4 pb-4 bg-white">
                  <div className="space-y-4 pt-4">
                    {/* Fixed Inventory */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        المخزون الثابت
                      </h4>
                      {tech.fixedInventory ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <InventoryItem 
                            label="N950" 
                            boxes={tech.fixedInventory.n950Boxes} 
                            units={tech.fixedInventory.n950Units}
                            testId={`fixed-n950-${index}`}
                            color="blue"
                          />
                          <InventoryItem 
                            label="I9000s" 
                            boxes={tech.fixedInventory.i9000sBoxes} 
                            units={tech.fixedInventory.i9000sUnits}
                            testId={`fixed-i9000s-${index}`}
                            color="blue"
                          />
                          <InventoryItem 
                            label="I9100" 
                            boxes={tech.fixedInventory.i9100Boxes} 
                            units={tech.fixedInventory.i9100Units}
                            testId={`fixed-i9100-${index}`}
                            color="blue"
                          />
                          <InventoryItem 
                            label="أوراق رول" 
                            boxes={tech.fixedInventory.rollPaperBoxes} 
                            units={tech.fixedInventory.rollPaperUnits}
                            testId={`fixed-rollpaper-${index}`}
                            color="blue"
                          />
                          <InventoryItem 
                            label="ملصقات" 
                            boxes={tech.fixedInventory.stickersBoxes} 
                            units={tech.fixedInventory.stickersUnits}
                            testId={`fixed-stickers-${index}`}
                            color="blue"
                          />
                          <InventoryItem 
                            label="بطاريات جديدة" 
                            boxes={tech.fixedInventory.newBatteriesBoxes} 
                            units={tech.fixedInventory.newBatteriesUnits}
                            testId={`fixed-batteries-${index}`}
                            color="blue"
                          />
                          <InventoryItem 
                            label="موبايلي" 
                            boxes={tech.fixedInventory.mobilySimBoxes} 
                            units={tech.fixedInventory.mobilySimUnits}
                            testId={`fixed-mobily-${index}`}
                            color="blue"
                          />
                          <InventoryItem 
                            label="STC" 
                            boxes={tech.fixedInventory.stcSimBoxes} 
                            units={tech.fixedInventory.stcSimUnits}
                            testId={`fixed-stc-${index}`}
                            color="blue"
                          />
                          <InventoryItem 
                            label="زين" 
                            boxes={tech.fixedInventory.zainSimBoxes} 
                            units={tech.fixedInventory.zainSimUnits}
                            testId={`fixed-zain-${index}`}
                            color="blue"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">لا توجد بيانات</p>
                      )}
                    </div>

                    {/* Moving Inventory */}
                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                      <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        المخزون المتحرك
                      </h4>
                      {tech.movingInventory ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <InventoryItem 
                            label="N950" 
                            boxes={tech.movingInventory.n950Boxes}
                            units={tech.movingInventory.n950Units}
                            testId={`moving-n950-${index}`}
                            color="green"
                          />
                          <InventoryItem 
                            label="I9000s" 
                            boxes={tech.movingInventory.i9000sBoxes}
                            units={tech.movingInventory.i9000sUnits}
                            testId={`moving-i9000s-${index}`}
                            color="green"
                          />
                          <InventoryItem 
                            label="I9100" 
                            boxes={tech.movingInventory.i9100Boxes}
                            units={tech.movingInventory.i9100Units}
                            testId={`moving-i9100-${index}`}
                            color="green"
                          />
                          <InventoryItem 
                            label="أوراق رول" 
                            boxes={tech.movingInventory.rollPaperBoxes}
                            units={tech.movingInventory.rollPaperUnits}
                            testId={`moving-rollpaper-${index}`}
                            color="green"
                          />
                          <InventoryItem 
                            label="ملصقات" 
                            boxes={tech.movingInventory.stickersBoxes}
                            units={tech.movingInventory.stickersUnits}
                            testId={`moving-stickers-${index}`}
                            color="green"
                          />
                          <InventoryItem 
                            label="بطاريات جديدة" 
                            boxes={tech.movingInventory.newBatteriesBoxes}
                            units={tech.movingInventory.newBatteriesUnits}
                            testId={`moving-batteries-${index}`}
                            color="green"
                          />
                          <InventoryItem 
                            label="موبايلي" 
                            boxes={tech.movingInventory.mobilySimBoxes}
                            units={tech.movingInventory.mobilySimUnits}
                            testId={`moving-mobily-${index}`}
                            color="green"
                          />
                          <InventoryItem 
                            label="STC" 
                            boxes={tech.movingInventory.stcSimBoxes}
                            units={tech.movingInventory.stcSimUnits}
                            testId={`moving-stc-${index}`}
                            color="green"
                          />
                          <InventoryItem 
                            label="زين" 
                            boxes={tech.movingInventory.zainSimBoxes}
                            units={tech.movingInventory.zainSimUnits}
                            testId={`moving-zain-${index}`}
                            color="green"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">لا توجد بيانات</p>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}

function InventoryItem({ label, boxes, units, testId, color }: { label: string; boxes: number; units: number; testId: string; color: 'blue' | 'green' }) {
  const total = (boxes || 0) + (units || 0);
  const bgColor = color === 'blue' ? 'bg-white' : 'bg-white';
  const borderColor = color === 'blue' ? 'border-blue-300' : 'border-green-300';
  const textColor = color === 'blue' ? 'text-blue-700' : 'text-green-700';
  
  return (
    <div 
      className={`${bgColor} p-2.5 rounded-lg border ${borderColor}`}
      data-testid={testId}
    >
      <div className="text-xs font-medium text-gray-600 mb-1">{label}</div>
      <div className="text-sm">
        <span className={`font-bold text-xl ${textColor}`}>{total}</span>
        <span className="text-xs text-gray-500 block mt-0.5">
          {boxes || 0} كرتون + {units || 0} مفرد
        </span>
      </div>
    </div>
  );
}
