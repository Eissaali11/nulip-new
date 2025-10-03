import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Package, TrendingUp, User } from "lucide-react";
import { useLocation } from "wouter";
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
    i900Boxes: number;
    i900Units: number;
    rollPaperBoxes: number;
    rollPaperUnits: number;
    stickersBoxes: number;
    stickersUnits: number;
    mobilySimBoxes: number;
    mobilySimUnits: number;
    stcSimBoxes: number;
    stcSimUnits: number;
    lowStockThreshold: number;
    criticalStockThreshold: number;
  } | null;
  movingInventory: {
    id: string;
    n950Boxes: number;
    n950Units: number;
    i900Boxes: number;
    i900Units: number;
    rollPaperBoxes: number;
    rollPaperUnits: number;
    stickersBoxes: number;
    stickersUnits: number;
    mobilySimBoxes: number;
    mobilySimUnits: number;
    stcSimBoxes: number;
    stcSimUnits: number;
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
        <Badge variant="destructive" className="gap-1" data-testid={`badge-alert-critical`}>
          <XCircle className="w-3 h-3" />
          حرج
        </Badge>
      );
    }
    if (level === 'warning') {
      return (
        <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600 dark:text-amber-400" data-testid={`badge-alert-warning`}>
          <AlertTriangle className="w-3 h-3" />
          تحذير
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 border-green-500 text-green-600 dark:text-green-400" data-testid={`badge-alert-good`}>
        <CheckCircle className="w-3 h-3" />
        جيد
      </Badge>
    );
  };

  const getTotalForItem = (boxes: number, units: number) => {
    return boxes + units;
  };

  const calculateFixedTotal = (inv: TechnicianInventoryData['fixedInventory']) => {
    if (!inv) return 0;
    return (
      getTotalForItem(inv.n950Boxes, inv.n950Units) +
      getTotalForItem(inv.i900Boxes, inv.i900Units) +
      getTotalForItem(inv.rollPaperBoxes, inv.rollPaperUnits) +
      getTotalForItem(inv.stickersBoxes, inv.stickersUnits) +
      getTotalForItem(inv.mobilySimBoxes, inv.mobilySimUnits) +
      getTotalForItem(inv.stcSimBoxes, inv.stcSimUnits)
    );
  };

  const calculateMovingTotal = (inv: TechnicianInventoryData['movingInventory']) => {
    if (!inv) return 0;
    return (
      getTotalForItem(inv.n950Boxes, inv.n950Units) +
      getTotalForItem(inv.i900Boxes, inv.i900Units) +
      getTotalForItem(inv.rollPaperBoxes, inv.rollPaperUnits) +
      getTotalForItem(inv.stickersBoxes, inv.stickersUnits) +
      getTotalForItem(inv.mobilySimBoxes, inv.mobilySimUnits) +
      getTotalForItem(inv.stcSimBoxes, inv.stcSimUnits)
    );
  };

  const criticalTechs = technicians.filter(t => t.alertLevel === 'critical').length;
  const warningTechs = technicians.filter(t => t.alertLevel === 'warning').length;
  const goodTechs = technicians.filter(t => t.alertLevel === 'good').length;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/')}
          className="shrink-0"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            لوحة مخزون الفنيين
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            عرض شامل لمخزون جميع الفنيين (الثابت والمتحرك)
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              فنيين بحالة حرجة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-900 dark:text-red-100" data-testid="text-critical-count">
              {criticalTechs}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              فنيين بتحذير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-900 dark:text-amber-100" data-testid="text-warning-count">
              {warningTechs}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              فنيين بحالة جيدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900 dark:text-green-100" data-testid="text-good-count">
              {goodTechs}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Technicians List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            قائمة الفنيين ({technicians.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <Accordion type="multiple" className="w-full">
            {technicians.map((tech, index) => (
              <AccordionItem key={tech.technicianId} value={tech.technicianId} data-testid={`accordion-tech-${index}`}>
                <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-1 text-right">
                      <div className="font-semibold text-base" data-testid={`text-tech-name-${index}`}>
                        {tech.technicianName}
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid={`text-tech-city-${index}`}>
                        {tech.city}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getAlertBadge(tech.alertLevel)}
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-blue-600" />
                          <span className="font-medium">{calculateFixedTotal(tech.fixedInventory)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 pt-2">
                    {/* Fixed Inventory */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" />
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
                            label="I900" 
                            boxes={tech.fixedInventory.i900Boxes} 
                            units={tech.fixedInventory.i900Units}
                            testId={`fixed-i900-${index}`}
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
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">لا توجد بيانات</p>
                      )}
                    </div>

                    {/* Moving Inventory */}
                    <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        المخزون المتحرك
                      </h4>
                      {tech.movingInventory ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <InventoryItem 
                            label="N950" 
                            boxes={tech.movingInventory.n950Boxes} 
                            units={tech.movingInventory.n950Units}
                            testId={`moving-n950-${index}`}
                          />
                          <InventoryItem 
                            label="I900" 
                            boxes={tech.movingInventory.i900Boxes} 
                            units={tech.movingInventory.i900Units}
                            testId={`moving-i900-${index}`}
                          />
                          <InventoryItem 
                            label="أوراق رول" 
                            boxes={tech.movingInventory.rollPaperBoxes} 
                            units={tech.movingInventory.rollPaperUnits}
                            testId={`moving-rollpaper-${index}`}
                          />
                          <InventoryItem 
                            label="ملصقات" 
                            boxes={tech.movingInventory.stickersBoxes} 
                            units={tech.movingInventory.stickersUnits}
                            testId={`moving-stickers-${index}`}
                          />
                          <InventoryItem 
                            label="موبايلي" 
                            boxes={tech.movingInventory.mobilySimBoxes} 
                            units={tech.movingInventory.mobilySimUnits}
                            testId={`moving-mobily-${index}`}
                          />
                          <InventoryItem 
                            label="STC" 
                            boxes={tech.movingInventory.stcSimBoxes} 
                            units={tech.movingInventory.stcSimUnits}
                            testId={`moving-stc-${index}`}
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">لا توجد بيانات</p>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

function InventoryItem({ label, boxes, units, testId }: { label: string; boxes: number; units: number; testId: string }) {
  const total = boxes + units;
  return (
    <div className="bg-white dark:bg-gray-900 p-2 rounded border" data-testid={testId}>
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      <div className="text-sm">
        <span className="font-bold text-lg">{total}</span>
        <span className="text-xs text-muted-foreground mr-1">
          ({boxes}ك + {units}م)
        </span>
      </div>
    </div>
  );
}
