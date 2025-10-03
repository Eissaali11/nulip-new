import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, CheckCircle, Plus } from "lucide-react";
import { useState } from "react";
import EditFixedInventoryModal from "@/components/edit-fixed-inventory-modal";

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
  totalI900: number;
  totalRollPaper: number;
  totalStickers: number;
  totalMobilySim: number;
  totalStcSim: number;
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
        <span className="font-medium">{total}</span>
        <span className="text-xs text-muted-foreground">({boxes}ك + {units}م)</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">لا توجد بيانات</p>
        </div>
      </div>
    );
  }

  const { technicians, summary } = data;

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" data-testid="text-dashboard-title">
            📊 المخزون الثابت للفنيين
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            متابعة وإدارة المخزون الثابت لجميع الفنيين
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">أجهزة N950</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold" data-testid="text-total-n950">{summary.totalN950}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">أجهزة I900</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold" data-testid="text-total-i900">{summary.totalI900}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">أوراق رول</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold" data-testid="text-total-paper">{summary.totalRollPaper}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">ملصقات مداى</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold" data-testid="text-total-stickers">{summary.totalStickers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">شرائح موبايلي</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold" data-testid="text-total-mobily">{summary.totalMobilySim}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">شرائح STC</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold" data-testid="text-total-stc">{summary.totalStcSim}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Summary */}
      {summary.techniciansWithCriticalStock > 0 && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base text-red-700 dark:text-red-400">
                  ⚠️ تنبيه: {summary.techniciansWithCriticalStock} فنيين لديهم مخزون حرج!
                </p>
                <div className="mt-2 space-y-1">
                  {technicians
                    .filter(t => t.alertLevel === 'critical')
                    .slice(0, 3)
                    .map((tech) => (
                      <p key={tech.technicianId} className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                        • {tech.technicianName} - {tech.city}
                      </p>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technicians Table/Cards */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-base sm:text-lg">الفنيين والمخزون الثابت</CardTitle>
            <div className="flex gap-2 text-xs sm:text-sm">
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
                <tr className="border-b">
                  <th className="text-right py-3 px-2 text-sm font-semibold">اسم الفني</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold">المدينة</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold">N950</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold">I900</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold">أوراق</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold">ملصقات</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold">موبايلي</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold">STC</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold">الحالة</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map((tech) => (
                  <tr key={tech.technicianId} className="border-b hover:bg-muted/50" data-testid={`row-technician-${tech.technicianId}`}>
                    <td className="py-3 px-2 font-medium">{tech.technicianName}</td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">{tech.city}</td>
                    <td className="py-3 px-2">{renderItemCell(tech.fixedInventory, 'n950')}</td>
                    <td className="py-3 px-2">{renderItemCell(tech.fixedInventory, 'i900')}</td>
                    <td className="py-3 px-2">{renderItemCell(tech.fixedInventory, 'rollPaper')}</td>
                    <td className="py-3 px-2">{renderItemCell(tech.fixedInventory, 'stickers')}</td>
                    <td className="py-3 px-2">{renderItemCell(tech.fixedInventory, 'mobilySim')}</td>
                    <td className="py-3 px-2">{renderItemCell(tech.fixedInventory, 'stcSim')}</td>
                    <td className="py-3 px-2">{getAlertBadge(tech.alertLevel)}</td>
                    <td className="py-3 px-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedTechnician({id: tech.technicianId, name: tech.technicianName})}
                        data-testid={`button-edit-${tech.technicianId}`}
                      >
                        <Plus className="w-4 h-4 ml-1" />
                        تعديل
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {technicians.map((tech) => (
              <Card key={tech.technicianId} className="border" data-testid={`card-technician-${tech.technicianId}`}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-base">{tech.technicianName}</h3>
                      <p className="text-sm text-muted-foreground">{tech.city}</p>
                    </div>
                    {getAlertBadge(tech.alertLevel)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">N950:</span>{' '}
                      {renderItemCell(tech.fixedInventory, 'n950')}
                    </div>
                    <div>
                      <span className="text-muted-foreground">I900:</span>{' '}
                      {renderItemCell(tech.fixedInventory, 'i900')}
                    </div>
                    <div>
                      <span className="text-muted-foreground">أوراق:</span>{' '}
                      {renderItemCell(tech.fixedInventory, 'rollPaper')}
                    </div>
                    <div>
                      <span className="text-muted-foreground">ملصقات:</span>{' '}
                      {renderItemCell(tech.fixedInventory, 'stickers')}
                    </div>
                    <div>
                      <span className="text-muted-foreground">موبايلي:</span>{' '}
                      {renderItemCell(tech.fixedInventory, 'mobilySim')}
                    </div>
                    <div>
                      <span className="text-muted-foreground">STC:</span>{' '}
                      {renderItemCell(tech.fixedInventory, 'stcSim')}
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSelectedTechnician({id: tech.technicianId, name: tech.technicianName})}
                    data-testid={`button-edit-mobile-${tech.technicianId}`}
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    تعديل المخزون
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Fixed Inventory Modal */}
      {selectedTechnician && (
        <EditFixedInventoryModal
          open={!!selectedTechnician}
          onClose={() => setSelectedTechnician(null)}
          technicianId={selectedTechnician.id}
          technicianName={selectedTechnician.name}
        />
      )}
    </div>
  );
}
