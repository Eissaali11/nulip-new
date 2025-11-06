import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, ArrowRight, AlertTriangle, CheckCircle, XCircle, Package, TrendingUp, User, Sparkles, BarChart3, FileDown } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
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

  const { data, isLoading } = useQuery<{ technicians: TechnicianInventoryData[] }>({
    queryKey: ['/api/admin/all-technicians-inventory'],
  });

  const technicians = data?.technicians || [];

  const getAlertBadge = (level: 'good' | 'warning' | 'critical') => {
    if (level === 'critical') {
      return (
        <Badge className="gap-1 bg-gradient-to-r from-red-600 to-rose-600 border-0 shadow-lg" data-testid={`badge-alert-critical`}>
          <XCircle className="w-3 h-3" />
          حرج
        </Badge>
      );
    }
    if (level === 'warning') {
      return (
        <Badge className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500 border-0 shadow-lg text-white" data-testid={`badge-alert-warning`}>
          <AlertTriangle className="w-3 h-3" />
          تحذير
        </Badge>
      );
    }
    return (
      <Badge className="gap-1 bg-gradient-to-r from-green-500 to-emerald-500 border-0 shadow-lg text-white" data-testid={`badge-alert-good`}>
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
    const time = currentDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    worksheet.mergeCells('A1:L1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'نظام إدارة مخزون الفنيين - Technician Inventory Management System';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }
    };
    titleCell.border = {
      top: { style: 'medium', color: { argb: 'FF2563EB' } },
      left: { style: 'medium', color: { argb: 'FF2563EB' } },
      bottom: { style: 'medium', color: { argb: 'FF2563EB' } },
      right: { style: 'medium', color: { argb: 'FF2563EB' } }
    };
    worksheet.getRow(1).height = 35;

    worksheet.mergeCells('A2:L2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Report Date: ${arabicDate} - ${time}`;
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    dateCell.font = { bold: true, size: 11 };
    dateCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDBEAFE' }
    };
    worksheet.getRow(2).height = 25;

    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
      '#',
      'Technicians Name',
      'City',
      'N950 Devices',
      'I9000s Devices',
      'I9100 Devices',
      'Roll Sheets',
      'Madal Stickers',
      'New Batteries',
      'SIM Mobily',
      'SIM STC',
      'SIM Zain'
    ]);
    
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4A5568' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    let totals = {
      n950: 0, i9000s: 0, i9100: 0,
      rollPaper: 0, stickers: 0, batteries: 0,
      mobilySim: 0, stcSim: 0, zainSim: 0
    };

    technicians.forEach((tech, index) => {
      const movingInv = tech.movingInventory;
      const n950 = movingInv ? getTotalForItem(movingInv.n950Boxes, movingInv.n950Units) : 0;
      const i9000s = movingInv ? getTotalForItem(movingInv.i9000sBoxes, movingInv.i9000sUnits) : 0;
      const i9100 = movingInv ? getTotalForItem(movingInv.i9100Boxes, movingInv.i9100Units) : 0;
      const rollPaper = movingInv ? getTotalForItem(movingInv.rollPaperBoxes, movingInv.rollPaperUnits) : 0;
      const stickers = movingInv ? getTotalForItem(movingInv.stickersBoxes, movingInv.stickersUnits) : 0;
      const batteries = movingInv ? getTotalForItem(movingInv.newBatteriesBoxes, movingInv.newBatteriesUnits) : 0;
      const mobilySim = movingInv ? getTotalForItem(movingInv.mobilySimBoxes, movingInv.mobilySimUnits) : 0;
      const stcSim = movingInv ? getTotalForItem(movingInv.stcSimBoxes, movingInv.stcSimUnits) : 0;
      const zainSim = movingInv ? getTotalForItem(movingInv.zainSimBoxes, movingInv.zainSimUnits) : 0;

      totals.n950 += n950;
      totals.i9000s += i9000s;
      totals.i9100 += i9100;
      totals.rollPaper += rollPaper;
      totals.stickers += stickers;
      totals.batteries += batteries;
      totals.mobilySim += mobilySim;
      totals.stcSim += stcSim;
      totals.zainSim += zainSim;
      
      const dataRow = worksheet.addRow([
        index + 1,
        tech.technicianName,
        tech.city,
        n950,
        i9000s,
        i9100,
        rollPaper,
        stickers,
        batteries,
        mobilySim,
        stcSim,
        zainSim
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
      'Total',
      '',
      totals.n950,
      totals.i9000s,
      totals.i9100,
      totals.rollPaper,
      totals.stickers,
      totals.batteries,
      totals.mobilySim,
      totals.stcSim,
      totals.zainSim
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
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    const totalBoxRow = worksheet.addRow([
      '',
      'Total Box',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
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

    worksheet.addRow([]);
    
    const statsHeaderRow = worksheet.addRow(['Overall Statistics']);
    worksheet.mergeCells(statsHeaderRow.number, 1, statsHeaderRow.number, 12);
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

    const statsRow1 = worksheet.addRow([
      'Technicians Name',
      technicians.length,
      'N950 Devices',
      totals.n950,
      'I9000s Devices',
      totals.i9000s,
      'I9100 Devices',
      totals.i9100
    ]);
    statsRow1.alignment = { horizontal: 'center', vertical: 'middle' };
    statsRow1.eachCell((cell, colNumber) => {
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
      'Roll Sheets',
      totals.rollPaper,
      'Madal Stickers',
      totals.stickers,
      'SIM Mobily',
      totals.mobilySim,
      'New Batteries',
      totals.batteries
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
      'SIM STC',
      totals.stcSim,
      'SIM Zain',
      totals.zainSim,
      '',
      '',
      '',
      ''
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

    worksheet.columns = [
      { width: 8 },
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 18 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];

    // Generate file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `مخزون_جميع_الفنيين_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="relative w-24 h-24 mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-pink-500 border-l-cyan-500"></div>
          </motion.div>
          <p className="text-slate-700 dark:text-slate-300 text-lg font-semibold">جاري التحميل...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800" dir="rtl">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between gap-4 flex-wrap"
        >
          <div className="flex items-center gap-4 flex-1">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setLocation('/')}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-lg"
                data-testid="button-back-home"
              >
                <Home className="w-5 h-5 ml-2" />
                الصفحة الرئيسية
                <ArrowRight className="w-5 h-5 mr-2" />
              </Button>
            </motion.div>
            
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <motion.div
                  className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl"
                  animate={{ rotate: [0, 5, 0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <BarChart3 className="h-8 w-8 text-white drop-shadow-lg" />
                </motion.div>
                لوحة مخزون الفنيين
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
                عرض شامل واحترافي لمخزون جميع الفنيين
              </p>
            </div>
          </div>

          {/* Export Button */}
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Button
              onClick={exportToExcel}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg"
              data-testid="button-export-all"
            >
              <FileDown className="w-5 h-5 ml-2" />
              تصدير Excel
            </Button>
          </motion.div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <Card className="bg-gradient-to-br from-red-500 to-rose-600 border-0 shadow-2xl text-white overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/5"></div>
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-sm text-red-50 flex items-center gap-2 font-bold uppercase tracking-wide">
                  <motion.div
                    animate={{ rotate: [0, -10, 0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <XCircle className="w-5 h-5" />
                  </motion.div>
                  حالة حرجة
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <motion.p 
                  className="text-6xl font-black drop-shadow-2xl" 
                  data-testid="text-critical-count"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {criticalTechs}
                </motion.p>
                <p className="text-xs text-red-100 mt-2 font-semibold">فني</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <Card className="bg-gradient-to-br from-amber-500 to-orange-600 border-0 shadow-2xl text-white overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/5"></div>
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-sm text-amber-50 flex items-center gap-2 font-bold uppercase tracking-wide">
                  <motion.div
                    animate={{ rotate: [0, -10, 0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </motion.div>
                  تحذير
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <motion.p 
                  className="text-6xl font-black drop-shadow-2xl" 
                  data-testid="text-warning-count"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                >
                  {warningTechs}
                </motion.p>
                <p className="text-xs text-amber-100 mt-2 font-semibold">فني</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-2xl text-white overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/5"></div>
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-sm text-green-50 flex items-center gap-2 font-bold uppercase tracking-wide">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircle className="w-5 h-5" />
                  </motion.div>
                  حالة جيدة
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <motion.p 
                  className="text-6xl font-black drop-shadow-2xl" 
                  data-testid="text-good-count"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                >
                  {goodTechs}
                </motion.p>
                <p className="text-xs text-green-100 mt-2 font-semibold">فني</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Technicians List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-2xl">
            <CardHeader className="border-b dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <CardTitle className="text-2xl flex items-center gap-3 text-slate-800 dark:text-white">
                <motion.div 
                  className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg"
                  animate={{ rotate: [0, 5, 0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <User className="h-7 w-7 text-white drop-shadow-md" />
                </motion.div>
                <span className="font-black">قائمة الفنيين ({technicians.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <Accordion type="multiple" className="w-full space-y-3">
                {technicians.map((tech, index) => (
                  <motion.div
                    key={tech.technicianId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <AccordionItem 
                      value={tech.technicianId} 
                      className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                      data-testid={`accordion-tech-${index}`}
                    >
                      <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex-1 text-right">
                            <div className="font-bold text-lg text-slate-800 dark:text-white" data-testid={`text-tech-name-${index}`}>
                              {tech.technicianName}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400" data-testid={`text-tech-city-${index}`}>
                              📍 {tech.city}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap justify-end">
                            {getAlertBadge(tech.alertLevel)}
                            <div className="flex items-center gap-2">
                              <div className="text-center bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-lg border-2 border-blue-300 dark:border-blue-700">
                                <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                                  <Package className="w-4 h-4" />
                                  <span className="font-black text-lg">{calculateFixedTotal(tech.fixedInventory)}</span>
                                </div>
                                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">ثابت</div>
                              </div>
                              <div className="text-center bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-lg border-2 border-green-300 dark:border-green-700">
                                <div className="flex items-center gap-1 text-green-700 dark:text-green-300">
                                  <TrendingUp className="w-4 h-4" />
                                  <span className="font-black text-lg">{calculateMovingTotal(tech.movingInventory)}</span>
                                </div>
                                <div className="text-[10px] text-green-600 dark:text-green-400 font-semibold">متحرك</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 bg-slate-50 dark:bg-slate-900/50">
                        <div className="space-y-4 pt-4">
                          {/* Fixed Inventory */}
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 p-5 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                            <h4 className="font-black text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2 text-lg">
                              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-md">
                                <Package className="w-5 h-5 text-white" />
                              </div>
                              المخزون الثابت
                            </h4>
                            {tech.fixedInventory ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <InventoryItem 
                                  label="N950" 
                                  boxes={tech.fixedInventory.n950Boxes} 
                                  units={tech.fixedInventory.n950Units}
                                  testId={`fixed-n950-${index}`}
                                />
                                <InventoryItem 
                                  label="I9000s" 
                                  boxes={tech.fixedInventory.i9000sBoxes} 
                                  units={tech.fixedInventory.i9000sUnits}
                                  testId={`fixed-i9000s-${index}`}
                                />
                                <InventoryItem 
                                  label="I9100" 
                                  boxes={tech.fixedInventory.i9100Boxes} 
                                  units={tech.fixedInventory.i9100Units}
                                  testId={`fixed-i9100-${index}`}
                                />
                                <InventoryItem 
                                  label="أوراق رول" 
                                  boxes={tech.fixedInventory.rollPaperBoxes} 
                                  units={tech.fixedInventory.rollPaperUnits}
                                  testId={`fixed-rollpaper-${index}`}
                                />
                                <InventoryItem 
                                  label="ملصقات" 
                                  boxes={tech.fixedInventory.stickersBoxes} 
                                  units={tech.fixedInventory.stickersUnits}
                                  testId={`fixed-stickers-${index}`}
                                />
                                <InventoryItem 
                                  label="بطاريات جديدة" 
                                  boxes={tech.fixedInventory.newBatteriesBoxes} 
                                  units={tech.fixedInventory.newBatteriesUnits}
                                  testId={`fixed-batteries-${index}`}
                                />
                                <InventoryItem 
                                  label="موبايلي" 
                                  boxes={tech.fixedInventory.mobilySimBoxes} 
                                  units={tech.fixedInventory.mobilySimUnits}
                                  testId={`fixed-mobily-${index}`}
                                />
                                <InventoryItem 
                                  label="STC" 
                                  boxes={tech.fixedInventory.stcSimBoxes} 
                                  units={tech.fixedInventory.stcSimUnits}
                                  testId={`fixed-stc-${index}`}
                                />
                                <InventoryItem 
                                  label="زين" 
                                  boxes={tech.fixedInventory.zainSimBoxes} 
                                  units={tech.fixedInventory.zainSimUnits}
                                  testId={`fixed-zain-${index}`}
                                />
                              </div>
                            ) : (
                              <p className="text-sm text-slate-600 dark:text-slate-400">لا توجد بيانات</p>
                            )}
                          </div>

                          {/* Moving Inventory */}
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-5 rounded-2xl border-2 border-green-200 dark:border-green-800 shadow-lg">
                            <h4 className="font-black text-green-900 dark:text-green-100 mb-4 flex items-center gap-2 text-lg">
                              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                                <TrendingUp className="w-5 h-5 text-white" />
                              </div>
                              المخزون المتحرك
                            </h4>
                            {tech.movingInventory ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <MovingInventoryItem 
                                  label="N950" 
                                  boxes={tech.movingInventory.n950Boxes}
                                  units={tech.movingInventory.n950Units}
                                  testId={`moving-n950-${index}`}
                                />
                                <MovingInventoryItem 
                                  label="I9000s" 
                                  boxes={tech.movingInventory.i9000sBoxes}
                                  units={tech.movingInventory.i9000sUnits}
                                  testId={`moving-i9000s-${index}`}
                                />
                                <MovingInventoryItem 
                                  label="I9100" 
                                  boxes={tech.movingInventory.i9100Boxes}
                                  units={tech.movingInventory.i9100Units}
                                  testId={`moving-i9100-${index}`}
                                />
                                <MovingInventoryItem 
                                  label="أوراق رول" 
                                  boxes={tech.movingInventory.rollPaperBoxes}
                                  units={tech.movingInventory.rollPaperUnits}
                                  testId={`moving-rollpaper-${index}`}
                                />
                                <MovingInventoryItem 
                                  label="ملصقات" 
                                  boxes={tech.movingInventory.stickersBoxes}
                                  units={tech.movingInventory.stickersUnits}
                                  testId={`moving-stickers-${index}`}
                                />
                                <MovingInventoryItem 
                                  label="بطاريات جديدة" 
                                  boxes={tech.movingInventory.newBatteriesBoxes}
                                  units={tech.movingInventory.newBatteriesUnits}
                                  testId={`moving-batteries-${index}`}
                                />
                                <MovingInventoryItem 
                                  label="موبايلي" 
                                  boxes={tech.movingInventory.mobilySimBoxes}
                                  units={tech.movingInventory.mobilySimUnits}
                                  testId={`moving-mobily-${index}`}
                                />
                                <MovingInventoryItem 
                                  label="STC" 
                                  boxes={tech.movingInventory.stcSimBoxes}
                                  units={tech.movingInventory.stcSimUnits}
                                  testId={`moving-stc-${index}`}
                                />
                                <MovingInventoryItem 
                                  label="زين" 
                                  boxes={tech.movingInventory.zainSimBoxes}
                                  units={tech.movingInventory.zainSimUnits}
                                  testId={`moving-zain-${index}`}
                                />
                              </div>
                            ) : (
                              <p className="text-sm text-slate-600 dark:text-slate-400">لا توجد بيانات</p>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function InventoryItem({ label, boxes, units, testId }: { label: string; boxes: number; units: number; testId: string }) {
  const total = (boxes || 0) + (units || 0);
  return (
    <motion.div 
      className="bg-white dark:bg-slate-800 p-3 rounded-xl border-2 border-blue-200 dark:border-blue-700 shadow-md hover:shadow-lg transition-shadow" 
      data-testid={testId}
      whileHover={{ scale: 1.05, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{label}</div>
      <div className="text-sm">
        <span className="font-black text-2xl text-blue-700 dark:text-blue-300">{total}</span>
        <span className="text-xs text-slate-500 dark:text-slate-500 mr-1 block mt-1">
          {boxes || 0} كرتون + {units || 0} مفرد
        </span>
      </div>
    </motion.div>
  );
}

function MovingInventoryItem({ label, boxes, units, testId }: { label: string; boxes: number; units: number; testId: string }) {
  const total = (boxes || 0) + (units || 0);
  return (
    <motion.div 
      className="bg-white dark:bg-slate-800 p-3 rounded-xl border-2 border-green-200 dark:border-green-700 shadow-md hover:shadow-lg transition-shadow" 
      data-testid={testId}
      whileHover={{ scale: 1.05, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{label}</div>
      <div className="text-sm">
        <span className="font-black text-2xl text-green-700 dark:text-green-300">{total}</span>
        <span className="text-xs text-slate-500 dark:text-slate-500 mr-1 block mt-1">
          {boxes || 0} كرتون + {units || 0} مفرد
        </span>
      </div>
    </motion.div>
  );
}
