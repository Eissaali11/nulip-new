import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, ArrowRight, AlertTriangle, CheckCircle, XCircle, Package, TrendingUp, User, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import rasscoLogo from "@assets/image_1762442473114.png";
import neoleapLogo from "@assets/image_1762442479737.png";
import madaDevice from "@assets/image_1762442486277.png";
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
    n950Devices: number;
    i9000sDevices: number;
    i9100Devices: number;
    rollPaper: number;
    stickers: number;
    newBatteries: number;
    mobilySim: number;
    stcSim: number;
    zainSim: number;
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
      (inv.n950Devices || 0) +
      (inv.i9000sDevices || 0) +
      (inv.i9100Devices || 0) +
      (inv.rollPaper || 0) +
      (inv.stickers || 0) +
      (inv.newBatteries || 0) +
      (inv.mobilySim || 0) +
      (inv.stcSim || 0) +
      (inv.zainSim || 0)
    );
  };

  const criticalTechs = technicians.filter(t => t.alertLevel === 'critical').length;
  const warningTechs = technicians.filter(t => t.alertLevel === 'warning').length;
  const goodTechs = technicians.filter(t => t.alertLevel === 'good').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" dir="rtl">
      {/* Animated Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/5"></div>
        
        {/* Animated Background Shapes */}
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
          {/* Back Button */}
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
            {/* Left Side - Logos Animation */}
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

            {/* Center - Title */}
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
                  لوحة مخزون الفنيين
                  <Sparkles className="h-10 w-10 text-yellow-300 animate-pulse" />
                </h1>
                <p className="text-white/90 text-lg font-semibold">عرض شامل لمخزون جميع الفنيين</p>
              </motion.div>
            </motion.div>

            {/* Right Side - Device Image */}
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

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12 fill-slate-900">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </div>

      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <Card className="bg-gradient-to-br from-red-500/20 to-rose-500/20 border-2 border-red-500/50 shadow-2xl shadow-red-500/20 backdrop-blur-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent"></div>
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-sm text-red-100 flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, -10, 0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <XCircle className="w-5 h-5 text-red-300" />
                  </motion.div>
                  فنيين بحالة حرجة
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <motion.p 
                  className="text-5xl font-black text-white drop-shadow-lg" 
                  data-testid="text-critical-count"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {criticalTechs}
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
            <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/20 backdrop-blur-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent"></div>
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-sm text-amber-100 flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, -10, 0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-300" />
                  </motion.div>
                  فنيين بتحذير
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <motion.p 
                  className="text-5xl font-black text-white drop-shadow-lg" 
                  data-testid="text-warning-count"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                >
                  {warningTechs}
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
            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 shadow-2xl shadow-green-500/20 backdrop-blur-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent"></div>
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-sm text-green-100 flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircle className="w-5 h-5 text-green-300" />
                  </motion.div>
                  فنيين بحالة جيدة
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <motion.p 
                  className="text-5xl font-black text-white drop-shadow-lg" 
                  data-testid="text-good-count"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                >
                  {goodTechs}
                </motion.p>
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
          <Card className="bg-slate-800/50 backdrop-blur-xl border-2 border-slate-700/50 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3 text-white">
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
            <CardContent className="p-2 sm:p-6">
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
                      className="bg-slate-700/30 backdrop-blur-sm border-2 border-slate-600/30 rounded-xl overflow-hidden"
                      data-testid={`accordion-tech-${index}`}
                    >
                      <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-slate-600/20 transition-colors">
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex-1 text-right">
                            <div className="font-bold text-lg text-white" data-testid={`text-tech-name-${index}`}>
                              {tech.technicianName}
                            </div>
                            <div className="text-sm text-slate-300" data-testid={`text-tech-city-${index}`}>
                              {tech.city}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getAlertBadge(tech.alertLevel)}
                            <div className="text-sm bg-blue-500/20 px-3 py-1 rounded-lg border border-blue-400/30">
                              <div className="flex items-center gap-1 text-blue-200">
                                <Package className="w-4 h-4" />
                                <span className="font-bold text-white">{calculateFixedTotal(tech.fixedInventory)}</span>
                              </div>
                            </div>
                            <div className="text-sm bg-green-500/20 px-3 py-1 rounded-lg border border-green-400/30">
                              <div className="flex items-center gap-1 text-green-200">
                                <TrendingUp className="w-4 h-4" />
                                <span className="font-bold text-white">{calculateMovingTotal(tech.movingInventory)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 bg-slate-800/50">
                        <div className="space-y-4 pt-4">
                          {/* Fixed Inventory */}
                          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-4 rounded-xl border-2 border-blue-400/30 shadow-lg">
                            <h4 className="font-black text-white mb-3 flex items-center gap-2 text-lg">
                              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
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
                              <p className="text-sm text-slate-300">لا توجد بيانات</p>
                            )}
                          </div>

                          {/* Moving Inventory */}
                          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 rounded-xl border-2 border-green-400/30 shadow-lg">
                            <h4 className="font-black text-white mb-3 flex items-center gap-2 text-lg">
                              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-white" />
                              </div>
                              المخزون المتحرك
                            </h4>
                            {tech.movingInventory ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <MovingInventoryItem 
                                  label="N950" 
                                  value={tech.movingInventory.n950Devices || 0}
                                  testId={`moving-n950-${index}`}
                                />
                                <MovingInventoryItem 
                                  label="I9000s" 
                                  value={tech.movingInventory.i9000sDevices || 0}
                                  testId={`moving-i9000s-${index}`}
                                />
                                <MovingInventoryItem 
                                  label="I9100" 
                                  value={tech.movingInventory.i9100Devices || 0}
                                  testId={`moving-i9100-${index}`}
                                />
                                <MovingInventoryItem 
                                  label="أوراق رول" 
                                  value={tech.movingInventory.rollPaper || 0}
                                  testId={`moving-rollpaper-${index}`}
                                />
                                <MovingInventoryItem 
                                  label="ملصقات" 
                                  value={tech.movingInventory.stickers || 0}
                                  testId={`moving-stickers-${index}`}
                                />
                                <MovingInventoryItem 
                                  label="بطاريات جديدة" 
                                  value={tech.movingInventory.newBatteries || 0}
                                  testId={`moving-batteries-${index}`}
                                />
                                <MovingInventoryItem 
                                  label="موبايلي" 
                                  value={tech.movingInventory.mobilySim || 0}
                                  testId={`moving-mobily-${index}`}
                                />
                                <MovingInventoryItem 
                                  label="STC" 
                                  value={tech.movingInventory.stcSim || 0}
                                  testId={`moving-stc-${index}`}
                                />
                                <MovingInventoryItem 
                                  label="زين" 
                                  value={tech.movingInventory.zainSim || 0}
                                  testId={`moving-zain-${index}`}
                                />
                              </div>
                            ) : (
                              <p className="text-sm text-slate-300">لا توجد بيانات</p>
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
      className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20 shadow-lg" 
      data-testid={testId}
      whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-xs font-semibold text-slate-300 mb-1">{label}</div>
      <div className="text-sm">
        <span className="font-black text-2xl text-white">{total}</span>
        <span className="text-xs text-slate-400 mr-1">
          ({boxes || 0}ك + {units || 0}م)
        </span>
      </div>
    </motion.div>
  );
}

function MovingInventoryItem({ label, value, testId }: { label: string; value: number; testId: string }) {
  return (
    <motion.div 
      className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20 shadow-lg" 
      data-testid={testId}
      whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-xs font-semibold text-slate-300 mb-1">{label}</div>
      <div className="text-sm">
        <span className="font-black text-2xl text-white">{value || 0}</span>
        <span className="text-xs text-slate-400 mr-1">وحدة</span>
      </div>
    </motion.div>
  );
}
