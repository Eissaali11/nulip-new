import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  User, 
  MapPin, 
  Package,
  ArrowRight,
  Box,
  FileText,
  Sticker,
  Battery,
  Smartphone,
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface TechnicianFixedInventory {
  id: string;
  technicianId: string;
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

interface ProductInfo {
  nameAr: string;
  nameEn: string;
  boxes: number;
  units: number;
  total: number;
  icon: any;
  color: string;
}

export default function TechnicianDetailsPage() {
  const [match, params] = useRoute("/technician-details/:id");
  const technicianId = params?.id;

  const { data: inventory, isLoading } = useQuery<TechnicianFixedInventory>({
    queryKey: [`/api/technician-fixed-inventory/${technicianId}`],
    enabled: !!technicianId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white/5 border-red-500/30">
            <CardContent className="p-12 text-center">
              <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">لم يتم العثور على البيانات</h2>
              <p className="text-gray-400 mb-6">لا توجد بيانات متاحة لهذا الفني</p>
              <Link href="/dashboard">
                <Button className="bg-[#18B2B0] hover:bg-[#0ea5a3]">
                  <ArrowLeft className="ml-2 h-4 w-4" />
                  العودة للوحة التحكم
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const products: ProductInfo[] = [
    {
      nameAr: "N950",
      nameEn: "N950 Devices",
      boxes: inventory.n950Boxes,
      units: inventory.n950Units,
      total: inventory.n950Boxes + inventory.n950Units,
      icon: Smartphone,
      color: "#3b82f6"
    },
    {
      nameAr: "I9000S",
      nameEn: "I9000S Devices",
      boxes: inventory.i9000sBoxes,
      units: inventory.i9000sUnits,
      total: inventory.i9000sBoxes + inventory.i9000sUnits,
      icon: Smartphone,
      color: "#8b5cf6"
    },
    {
      nameAr: "I9100",
      nameEn: "I9100 Devices",
      boxes: inventory.i9100Boxes,
      units: inventory.i9100Units,
      total: inventory.i9100Boxes + inventory.i9100Units,
      icon: Smartphone,
      color: "#ec4899"
    },
    {
      nameAr: "أوراق رول",
      nameEn: "Roll Paper",
      boxes: inventory.rollPaperBoxes,
      units: inventory.rollPaperUnits,
      total: inventory.rollPaperBoxes + inventory.rollPaperUnits,
      icon: FileText,
      color: "#f59e0b"
    },
    {
      nameAr: "ملصقات",
      nameEn: "Stickers",
      boxes: inventory.stickersBoxes,
      units: inventory.stickersUnits,
      total: inventory.stickersBoxes + inventory.stickersUnits,
      icon: Sticker,
      color: "#14b8a6"
    },
    {
      nameAr: "بطاريات",
      nameEn: "New Batteries",
      boxes: inventory.newBatteriesBoxes,
      units: inventory.newBatteriesUnits,
      total: inventory.newBatteriesBoxes + inventory.newBatteriesUnits,
      icon: Battery,
      color: "#06b6d4"
    },
    {
      nameAr: "شرائح موبايلي",
      nameEn: "Mobily SIM",
      boxes: inventory.mobilySimBoxes,
      units: inventory.mobilySimUnits,
      total: inventory.mobilySimBoxes + inventory.mobilySimUnits,
      icon: Package,
      color: "#10b981"
    },
    {
      nameAr: "شرائح STC",
      nameEn: "STC SIM",
      boxes: inventory.stcSimBoxes,
      units: inventory.stcSimUnits,
      total: inventory.stcSimBoxes + inventory.stcSimUnits,
      icon: Package,
      color: "#8b5cf6"
    },
    {
      nameAr: "شرائح زين",
      nameEn: "Zain SIM",
      boxes: inventory.zainSimBoxes,
      units: inventory.zainSimUnits,
      total: inventory.zainSimBoxes + inventory.zainSimUnits,
      icon: Package,
      color: "#f97316"
    },
  ];

  const totalInventory = products.reduce((sum, p) => sum + p.total, 0);
  const criticalProducts = products.filter(p => p.total === 0);
  const warningProducts = products.filter(p => p.total > 0 && p.total < 10);

  const getAlertLevel = (total: number) => {
    if (total === 0) return { level: 'critical', color: 'text-red-400', icon: XCircle };
    if (total < 10) return { level: 'warning', color: 'text-yellow-400', icon: AlertTriangle };
    return { level: 'good', color: 'text-green-400', icon: CheckCircle };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="border-[#18B2B0]/30 text-[#18B2B0] hover:bg-[#18B2B0]/10"
                data-testid="button-back"
              >
                <ArrowLeft className="ml-2 h-4 w-4" />
                العودة
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">تفاصيل الفني</h1>
              <p className="text-gray-400">المخزون الثابت</p>
            </div>
          </div>
        </motion.div>

        {/* Technician Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-[#18B2B0]/20 via-[#18B2B0]/10 to-transparent border-[#18B2B0]/30 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-[#18B2B0] to-[#0ea5a3] rounded-xl">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">اسم الفني</p>
                    <p className="text-xl font-bold text-white" data-testid="text-technician-name">
                      {inventory.technicianName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">المدينة</p>
                    <p className="text-xl font-bold text-white" data-testid="text-city">
                      {inventory.city}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">إجمالي المخزون</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold text-white" data-testid="text-total-inventory">
                        {totalInventory} وحدة
                      </p>
                      {criticalProducts.length > 0 && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          {criticalProducts.length} نافد
                        </Badge>
                      )}
                      {warningProducts.length > 0 && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          {warningProducts.length} منخفض
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Inventory Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <Package className="h-6 w-6 text-[#18B2B0]" />
                تفاصيل المخزون الثابت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white/5 hover:bg-white/5 border-b border-white/10">
                      <TableHead className="text-right text-gray-300 font-bold">الحالة</TableHead>
                      <TableHead className="text-right text-gray-300 font-bold">المنتج</TableHead>
                      <TableHead className="text-center text-gray-300 font-bold">كراتين</TableHead>
                      <TableHead className="text-center text-gray-300 font-bold">مفرد</TableHead>
                      <TableHead className="text-center text-gray-300 font-bold">الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product, idx) => {
                      const Icon = product.icon;
                      const alert = getAlertLevel(product.total);
                      const AlertIcon = alert.icon;
                      
                      return (
                        <TableRow 
                          key={idx} 
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          data-testid={`row-product-${product.nameEn.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <TableCell className="text-right">
                            <AlertIcon className={`h-5 w-5 ${alert.color}`} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-3">
                              <div 
                                className="p-2 rounded-lg"
                                style={{ backgroundColor: `${product.color}20` }}
                              >
                                <Icon 
                                  className="h-5 w-5" 
                                  style={{ color: product.color }}
                                />
                              </div>
                              <div>
                                <p className="font-medium text-white">{product.nameAr}</p>
                                <p className="text-sm text-gray-400">{product.nameEn}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              className="bg-white/10 text-white border-white/20"
                              data-testid={`badge-boxes-${product.nameEn.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              {product.boxes}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              className="bg-white/10 text-white border-white/20"
                              data-testid={`badge-units-${product.nameEn.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              {product.units}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              className="font-bold"
                              style={{ 
                                backgroundColor: `${product.color}20`,
                                color: product.color,
                                borderColor: `${product.color}40`
                              }}
                              data-testid={`badge-total-${product.nameEn.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              {product.total}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
