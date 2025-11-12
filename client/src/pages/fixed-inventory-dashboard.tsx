import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, CheckCircle, Plus } from "lucide-react";
import { useState } from "react";
import { EditTechnicianFixedInventoryModal } from "@/components/edit-technician-fixed-inventory-modal";
import { motion } from "framer-motion";
import { Navbar } from "@/components/dashboard/Navbar";
import { GridBackground } from "@/components/dashboard/GridBackground";
import dashboardBg from "@assets/image_1762515061799.png";

type AlertLevel = 'good' | 'warning' | 'critical';

interface TechnicianWithFixedInventory {
  technicianId: string;
  technicianName: string;
  city: string;
  fixedInventory: any;
  alertLevel: AlertLevel;
}

interface FixedInventorySummary {
  totalN950: number;
  totalI9000s: number;
  totalI9100: number;
  totalRollPaper: number;
  totalStickers: number;
  totalNewBatteries: number;
  totalMobilySim: number;
  totalStcSim: number;
  totalZainSim: number;
  techniciansWithCriticalStock: number;
  techniciansWithWarningStock: number;
  techniciansWithGoodStock: number;
}

interface DashboardData {
  technicians: TechnicianWithFixedInventory[];
  summary: FixedInventorySummary;
}

export default function FixedInventoryDashboard() {
  const [selectedTechnician, setSelectedTechnician] = useState<{id: string; name: string} | null>(null);

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['/api/admin/fixed-inventory-dashboard'],
  });

  const getAlertBadge = (level: AlertLevel) => {
    const variants = {
      good: { color: 'bg-green-500', text: 'ممتاز', icon: CheckCircle },
      warning: { color: 'bg-yellow-500', text: 'تحذير', icon: AlertTriangle },
      critical: { color: 'bg-red-500', text: 'حرج', icon: AlertTriangle },
    };
    const variant = variants[level];
    const Icon = variant.icon;
    return (
      <Badge className={`${variant.color} text-white`}>
        <Icon className="w-3 h-3 ml-1" />
        {variant.text}
      </Badge>
    );
  };

  const getItemTotal = (fixedInventory: any, itemType: string) => {
    if (!fixedInventory) return { boxes: 0, units: 0, total: 0 };
    const boxes = fixedInventory[`${itemType}Boxes`] || 0;
    const units = fixedInventory[`${itemType}Units`] || 0;
    return { boxes, units, total: boxes + units };
  };

  const getItemAlertLevel = (total: number, threshold: number = 70, lowThreshold: number = 30): AlertLevel => {
    if (total === 0 || total < lowThreshold) return 'critical';
    if (total < threshold) return 'warning';
    return 'good';
  };

  const renderItemCell = (fixedInventory: any, itemType: string, threshold: number = 70, lowThreshold: number = 30) => {
    const { boxes, units, total } = getItemTotal(fixedInventory, itemType);
    const alertLevel = getItemAlertLevel(total, threshold, lowThreshold);
    
    return (
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${
          alertLevel === 'good' ? 'bg-green-500' : 
          alertLevel === 'warning' ? 'bg-yellow-500' : 
          'bg-red-500'
        }`} />
        <span className="font-medium text-white">{total}</span>
        <span className="text-xs text-gray-400">({boxes}ك + {units}م)</span>
      </div>
    );
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
            <p className="text-white text-lg font-medium">جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden" dir="rtl">
        <GridBackground />
        <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full"
          >
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
              <CardContent className="py-12 text-center">
                <Package className="h-20 w-20 mx-auto mb-6 text-[#18B2B0]" />
                <h3 className="text-2xl font-bold mb-3 text-white">لا توجد بيانات</h3>
                <p className="text-gray-300">لا توجد بيانات متاحة حالياً</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const { technicians, summary } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden" dir="rtl">
      <GridBackground />
      
      <div 
        className="fixed inset-0 opacity-5 bg-center bg-cover pointer-events-none z-0"
        style={{ backgroundImage: `url(${dashboardBg})` }}
      />

      <Navbar />

      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
        >
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white" data-testid="text-dashboard-title">
              📊 المخزون الثابت للفنيين
            </h1>
            <p className="text-sm text-gray-300 mt-1">
              متابعة وإدارة المخزون الثابت لجميع الفنيين
            </p>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { title: "أجهزة N950", value: summary.totalN950, testId: "text-total-n950", delay: 0.1 },
            { title: "أجهزة I9000s", value: summary.totalI9000s, testId: "text-total-i9000s", delay: 0.15 },
            { title: "أجهزة I9100", value: summary.totalI9100, testId: "text-total-i9100", delay: 0.2 },
            { title: "بطاريات جديدة", value: summary.totalNewBatteries, testId: "text-total-batteries", delay: 0.25 },
            { title: "أوراق رول", value: summary.totalRollPaper, testId: "text-total-paper", delay: 0.3 },
            { title: "ملصقات مداى", value: summary.totalStickers, testId: "text-total-stickers", delay: 0.35 },
            { title: "شرائح موبايلي", value: summary.totalMobilySim, testId: "text-total-mobily", delay: 0.4 },
            { title: "شرائح STC", value: summary.totalStcSim, testId: "text-total-stc", delay: 0.45 },
            { title: "شرائح زين", value: summary.totalZainSim, testId: "text-total-zain", delay: 0.5 },
          ].map((item, index) => (
            <motion.div
              key={item.testId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: item.delay }}
            >
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm text-gray-400">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl sm:text-2xl font-bold text-white" data-testid={item.testId}>{item.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Alerts Summary */}
        {summary.techniciansWithCriticalStock > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="border-red-500/50 bg-red-500/10 backdrop-blur-xl border-white/20">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base text-red-300">
                      ⚠️ تنبيه: {summary.techniciansWithCriticalStock} فنيين لديهم مخزون حرج!
                    </p>
                    <div className="mt-2 space-y-1">
                      {technicians
                        .filter(t => t.alertLevel === 'critical')
                        .slice(0, 3)
                        .map((tech) => (
                          <p key={tech.technicianId} className="text-xs sm:text-sm text-red-400">
                            • {tech.technicianName} - {tech.city}
                          </p>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Technicians Table/Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <CardTitle className="text-base sm:text-lg text-white">الفنيين والمخزون الثابت</CardTitle>
                <div className="flex gap-2 text-xs sm:text-sm text-gray-300">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>ممتاز ({summary.techniciansWithGoodStock})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>تحذير ({summary.techniciansWithWarningStock})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>حرج ({summary.techniciansWithCriticalStock})</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-right py-3 px-2 text-sm font-semibold text-white">اسم الفني</th>
                      <th className="text-right py-3 px-2 text-sm font-semibold text-white">المدينة</th>
                      <th className="text-right py-3 px-2 text-sm font-semibold text-white">N950</th>
                      <th className="text-right py-3 px-2 text-sm font-semibold text-white">I900</th>
                      <th className="text-right py-3 px-2 text-sm font-semibold text-white">أوراق</th>
                      <th className="text-right py-3 px-2 text-sm font-semibold text-white">ملصقات</th>
                      <th className="text-right py-3 px-2 text-sm font-semibold text-white">موبايلي</th>
                      <th className="text-right py-3 px-2 text-sm font-semibold text-white">STC</th>
                      <th className="text-right py-3 px-2 text-sm font-semibold text-white">زين</th>
                      <th className="text-right py-3 px-2 text-sm font-semibold text-white">الحالة</th>
                      <th className="text-right py-3 px-2 text-sm font-semibold text-white">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {technicians.map((tech, index) => (
                      <motion.tr 
                        key={tech.technicianId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                        className="border-b border-white/10 hover:bg-white/5 transition-colors" 
                        data-testid={`row-technician-${tech.technicianId}`}
                      >
                        <td className="py-3 px-2 font-medium text-white">{tech.technicianName}</td>
                        <td className="py-3 px-2 text-sm text-gray-300">{tech.city}</td>
                        <td className="py-3 px-2">{renderItemCell(tech.fixedInventory, 'n950')}</td>
                        <td className="py-3 px-2">{renderItemCell(tech.fixedInventory, 'i900')}</td>
                        <td className="py-3 px-2">{renderItemCell(tech.fixedInventory, 'rollPaper')}</td>
                        <td className="py-3 px-2">{renderItemCell(tech.fixedInventory, 'stickers')}</td>
                        <td className="py-3 px-2">{renderItemCell(tech.fixedInventory, 'mobilySim')}</td>
                        <td className="py-3 px-2">{renderItemCell(tech.fixedInventory, 'stcSim')}</td>
                        <td className="py-3 px-2">{renderItemCell(tech.fixedInventory, 'zainSim')}</td>
                        <td className="py-3 px-2">{getAlertBadge(tech.alertLevel)}</td>
                        <td className="py-3 px-2">
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-[#18B2B0] to-[#16a09e] text-white hover:shadow-lg hover:shadow-[#18B2B0]/50 transition-all duration-300"
                            onClick={() => setSelectedTechnician({id: tech.technicianId, name: tech.technicianName})}
                            data-testid={`button-edit-${tech.technicianId}`}
                          >
                            <Plus className="w-4 h-4 ml-1" />
                            تعديل
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {technicians.map((tech, index) => (
                  <motion.div
                    key={tech.technicianId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                  >
                    <Card className="bg-white/5 backdrop-blur-xl border-white/20" data-testid={`card-technician-${tech.technicianId}`}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-base text-white">{tech.technicianName}</h3>
                            <p className="text-sm text-gray-300">{tech.city}</p>
                          </div>
                          {getAlertBadge(tech.alertLevel)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-400">N950:</span>{' '}
                            {renderItemCell(tech.fixedInventory, 'n950')}
                          </div>
                          <div>
                            <span className="text-gray-400">I900:</span>{' '}
                            {renderItemCell(tech.fixedInventory, 'i900')}
                          </div>
                          <div>
                            <span className="text-gray-400">أوراق:</span>{' '}
                            {renderItemCell(tech.fixedInventory, 'rollPaper')}
                          </div>
                          <div>
                            <span className="text-gray-400">ملصقات:</span>{' '}
                            {renderItemCell(tech.fixedInventory, 'stickers')}
                          </div>
                          <div>
                            <span className="text-gray-400">موبايلي:</span>{' '}
                            {renderItemCell(tech.fixedInventory, 'mobilySim')}
                          </div>
                          <div>
                            <span className="text-gray-400">STC:</span>{' '}
                            {renderItemCell(tech.fixedInventory, 'stcSim')}
                          </div>
                          <div>
                            <span className="text-gray-400">زين:</span>{' '}
                            {renderItemCell(tech.fixedInventory, 'zainSim')}
                          </div>
                        </div>

                        <Button 
                          size="sm" 
                          className="w-full bg-gradient-to-r from-[#18B2B0] to-[#16a09e] text-white hover:shadow-lg hover:shadow-[#18B2B0]/50 transition-all duration-300"
                          onClick={() => setSelectedTechnician({id: tech.technicianId, name: tech.technicianName})}
                          data-testid={`button-edit-mobile-${tech.technicianId}`}
                        >
                          <Plus className="w-4 h-4 ml-1" />
                          تعديل المخزون
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Edit Fixed Inventory Modal */}
      {selectedTechnician && (
        <EditTechnicianFixedInventoryModal
          open={!!selectedTechnician}
          onClose={() => setSelectedTechnician(null)}
          technicianId={selectedTechnician.id}
          technicianName={selectedTechnician.name}
        />
      )}
    </div>
  );
}
