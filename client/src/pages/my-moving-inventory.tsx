import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TruckIcon, MinusCircle, ArrowRight, ArrowLeftRight, FileDown, Home, Package, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { UpdateMovingInventoryModal } from "@/components/update-moving-inventory-modal";
import { TransferToMovingModal } from "@/components/transfer-to-moving-modal";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import rasscoLogo from "@assets/image_1762442473114.png";
import neoleapLogo from "@assets/image_1762442479737.png";
import madaDevice from "@assets/image_1762442486277.png";

interface MovingInventory {
  id: string;
  technicianName: string;
  city: string;
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

interface FixedInventory {
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

export default function MyMovingInventory() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const { data: inventory, isLoading } = useQuery<MovingInventory>({
    queryKey: [`/api/technicians/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: fixedInventory } = useQuery<FixedInventory>({
    queryKey: [`/api/technician-fixed-inventory/${user?.id}`],
    enabled: !!user?.id,
  });

  const getTotalItems = () => {
    if (!inventory) return 0;
    return (
      (inventory.n950Boxes || 0) + (inventory.n950Units || 0) +
      (inventory.i9000sBoxes || 0) + (inventory.i9000sUnits || 0) +
      (inventory.i9100Boxes || 0) + (inventory.i9100Units || 0) +
      (inventory.rollPaperBoxes || 0) + (inventory.rollPaperUnits || 0) +
      (inventory.stickersBoxes || 0) + (inventory.stickersUnits || 0) +
      (inventory.newBatteriesBoxes || 0) + (inventory.newBatteriesUnits || 0) +
      (inventory.mobilySimBoxes || 0) + (inventory.mobilySimUnits || 0) +
      (inventory.stcSimBoxes || 0) + (inventory.stcSimUnits || 0) +
      (inventory.zainSimBoxes || 0) + (inventory.zainSimUnits || 0)
    );
  };

  const exportToExcel = async () => {
    if (!inventory) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('المخزون المتحرك');

    worksheet.views = [{ rightToLeft: true }];

    worksheet.mergeCells('A1:C1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'تقرير المخزون المتحرك';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    worksheet.mergeCells('A2:C2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `التاريخ: ${new Date().toLocaleDateString('ar-SA')}`;
    dateCell.alignment = { horizontal: 'center' };

    worksheet.addRow([]);
    const headerRow = worksheet.addRow(['الصنف', 'الكمية', 'الوحدة']);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    const data = [
      ['أجهزة N950 - كرتون', inventory.n950Boxes || 0, 'كرتون'],
      ['أجهزة N950 - وحدات', inventory.n950Units || 0, 'جهاز'],
      ['أجهزة I9000s - كرتون', inventory.i9000sBoxes || 0, 'كرتون'],
      ['أجهزة I9000s - وحدات', inventory.i9000sUnits || 0, 'جهاز'],
      ['أجهزة I9100 - كرتون', inventory.i9100Boxes || 0, 'كرتون'],
      ['أجهزة I9100 - وحدات', inventory.i9100Units || 0, 'جهاز'],
      ['أوراق رول - كرتون', inventory.rollPaperBoxes || 0, 'كرتون'],
      ['أوراق رول - وحدات', inventory.rollPaperUnits || 0, 'رول'],
      ['ملصقات مدى - كرتون', inventory.stickersBoxes || 0, 'كرتون'],
      ['ملصقات مدى - وحدات', inventory.stickersUnits || 0, 'ملصق'],
      ['بطاريات جديدة - كرتون', inventory.newBatteriesBoxes || 0, 'كرتون'],
      ['بطاريات جديدة - وحدات', inventory.newBatteriesUnits || 0, 'بطارية'],
      ['شرائح موبايلي - كرتون', inventory.mobilySimBoxes || 0, 'كرتون'],
      ['شرائح موبايلي - وحدات', inventory.mobilySimUnits || 0, 'شريحة'],
      ['شرائح STC - كرتون', inventory.stcSimBoxes || 0, 'كرتون'],
      ['شرائح STC - وحدات', inventory.stcSimUnits || 0, 'شريحة'],
      ['شرائح زين - كرتون', inventory.zainSimBoxes || 0, 'كرتون'],
      ['شرائح زين - وحدات', inventory.zainSimUnits || 0, 'شريحة'],
    ];

    data.forEach(row => {
      const dataRow = worksheet.addRow(row);
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center' };
      });
    });

    worksheet.addRow([]);
    const totalRow = worksheet.addRow(['الإجمالي', getTotalItems(), 'قطعة']);
    totalRow.font = { bold: true };
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center' };
    });

    worksheet.columns = [
      { width: 25 },
      { width: 15 },
      { width: 15 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `المخزون_المتحرك_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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
          <p className="text-white text-lg font-semibold">جاري التحميل...</p>
        </motion.div>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-2 border-white/20 shadow-2xl">
          <CardContent className="py-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <TruckIcon className="h-24 w-24 mx-auto mb-6 text-blue-500" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-3 text-slate-800 dark:text-white">لا يوجد مخزون متحرك</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              قم بنقل بعض العناصر من المخزون الثابت أولاً
            </p>
            <Button onClick={() => setLocation("/")} className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Home className="w-4 h-4 ml-2" />
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" dir="rtl">
      {/* Animated Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/5"></div>
        
        <motion.div
          className="absolute top-0 left-0 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <div className="relative container mx-auto px-4 py-8">
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setLocation('/')}
                className="bg-white/95 hover:bg-white text-blue-600 font-bold shadow-xl border-2 border-white/50"
                data-testid="button-back-home"
              >
                <Home className="w-5 h-5 ml-2" />
                الصفحة الرئيسية
                <ArrowRight className="w-5 h-5 mr-2" />
              </Button>
            </motion.div>
          </motion.div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <motion.div 
              className="flex items-center gap-8"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl"
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <img src={rasscoLogo} alt="RASSCO" className="h-16 w-auto" />
              </motion.div>
              
              <motion.div
                className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl"
                whileHover={{ scale: 1.05, rotate: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <img src={neoleapLogo} alt="Neoleap" className="h-16 w-auto" />
              </motion.div>
            </motion.div>

            <motion.div 
              className="text-center flex-1"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.02, 1],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <h1 className="text-4xl lg:text-5xl font-black text-white mb-2 drop-shadow-2xl flex items-center justify-center gap-3">
                  <Sparkles className="h-10 w-10 text-yellow-300 animate-pulse" />
                  المخزون المتحرك
                  <Sparkles className="h-10 w-10 text-yellow-300 animate-pulse" />
                </h1>
                <p className="text-white/90 text-lg font-semibold">المخزون الذي تستخدمه في العمل اليومي</p>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-3xl blur-xl opacity-50"></div>
                <img src={madaDevice} alt="MADA Device" className="h-48 w-auto relative z-10 drop-shadow-2xl" />
              </motion.div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12 fill-slate-900">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </div>

      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Action Buttons */}
        <motion.div 
          className="flex gap-3 flex-wrap justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={() => setShowTransferModal(true)}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg"
              data-testid="button-transfer-inventory"
            >
              <ArrowLeftRight className="w-4 h-4 ml-2" />
              نقل من الثابت
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={() => setShowUpdateModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
              data-testid="button-update-inventory"
            >
              <MinusCircle className="w-4 h-4 ml-2" />
              تحديث المخزون
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={exportToExcel}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
              data-testid="button-export-excel"
            >
              <FileDown className="w-4 h-4 ml-2" />
              تصدير Excel
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 border-0 shadow-2xl text-white overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/5"></div>
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-sm text-blue-50 font-bold flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  إجمالي العناصر
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <motion.p 
                  className="text-5xl font-black drop-shadow-lg" 
                  data-testid="text-total-items"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {getTotalItems()}
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <Card className="bg-gradient-to-br from-purple-500 to-pink-600 border-0 shadow-2xl text-white overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/5"></div>
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-sm text-purple-50 font-bold flex items-center gap-2">
                  <TruckIcon className="w-5 h-5" />
                  الأجهزة
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <motion.p 
                  className="text-5xl font-black drop-shadow-lg" 
                  data-testid="text-total-devices"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                >
                  {(inventory.n950Boxes || 0) + (inventory.n950Units || 0) + (inventory.i9000sBoxes || 0) + (inventory.i9000sUnits || 0) + (inventory.i9100Boxes || 0) + (inventory.i9100Units || 0)}
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <Card className="bg-gradient-to-br from-amber-500 to-orange-600 border-0 shadow-2xl text-white overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/5"></div>
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-sm text-amber-50 font-bold flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  الملحقات
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <motion.p 
                  className="text-5xl font-black drop-shadow-lg" 
                  data-testid="text-total-accessories"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                >
                  {(inventory.rollPaperBoxes || 0) + (inventory.rollPaperUnits || 0) + (inventory.stickersBoxes || 0) + (inventory.stickersUnits || 0) + (inventory.newBatteriesBoxes || 0) + (inventory.newBatteriesUnits || 0)}
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-2xl text-white overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/5"></div>
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-sm text-green-50 font-bold flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  الشرائح
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <motion.p 
                  className="text-5xl font-black drop-shadow-lg" 
                  data-testid="text-total-sims"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                >
                  {(inventory.mobilySimBoxes || 0) + (inventory.mobilySimUnits || 0) + (inventory.stcSimBoxes || 0) + (inventory.stcSimUnits || 0) + (inventory.zainSimBoxes || 0) + (inventory.zainSimUnits || 0)}
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Detailed Inventory */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'أجهزة N950', boxes: inventory.n950Boxes || 0, units: inventory.n950Units || 0, color: 'blue', icon: '📱' },
              { label: 'أجهزة I9000s', boxes: inventory.i9000sBoxes || 0, units: inventory.i9000sUnits || 0, color: 'purple', icon: '📱' },
              { label: 'أجهزة I9100', boxes: inventory.i9100Boxes || 0, units: inventory.i9100Units || 0, color: 'indigo', icon: '📱' },
              { label: 'أوراق رول', boxes: inventory.rollPaperBoxes || 0, units: inventory.rollPaperUnits || 0, color: 'amber', icon: '📄' },
              { label: 'ملصقات مداى', boxes: inventory.stickersBoxes || 0, units: inventory.stickersUnits || 0, color: 'orange', icon: '🏷️' },
              { label: 'بطاريات جديدة', boxes: inventory.newBatteriesBoxes || 0, units: inventory.newBatteriesUnits || 0, color: 'yellow', icon: '🔋' },
              { label: 'شرائح موبايلي', boxes: inventory.mobilySimBoxes || 0, units: inventory.mobilySimUnits || 0, color: 'green', icon: '📶' },
              { label: 'شرائح STC', boxes: inventory.stcSimBoxes || 0, units: inventory.stcSimUnits || 0, color: 'teal', icon: '📶' },
              { label: 'شرائح زين', boxes: inventory.zainSimBoxes || 0, units: inventory.zainSimUnits || 0, color: 'cyan', icon: '📶' },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <motion.div 
                          className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 text-white text-sm font-bold shadow-md`}
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="text-xs ml-1">كرتون:</span>
                          <span className="text-lg font-black">{item.boxes}</span>
                        </motion.div>
                        <motion.div 
                          className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-gradient-to-r from-${item.color}-400 to-${item.color}-500 text-white text-sm font-bold shadow-md`}
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="text-xs ml-1">وحدات:</span>
                          <span className="text-lg font-black">{item.units}</span>
                        </motion.div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      {fixedInventory && (
        <TransferToMovingModal
          open={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          technicianId={user?.id || ''}
          fixedInventory={fixedInventory}
        />
      )}

      {inventory && (
        <UpdateMovingInventoryModal
          open={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          technicianId={user?.id || ''}
          currentInventory={inventory}
        />
      )}
    </div>
  );
}
