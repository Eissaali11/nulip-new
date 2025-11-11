import { motion } from "framer-motion";
import { TechnicianWithFixedInventory } from "@shared/schema";
import { User, MapPin, AlertTriangle, CheckCircle, XCircle, Package, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface TechnicianDashboardCardProps {
  technician: TechnicianWithFixedInventory;
  index: number;
}

interface ProductStatus {
  name: string;
  nameAr: string;
  boxes: number;
  units: number;
  total: number;
  alertLevel: 'good' | 'warning' | 'critical';
  icon: any;
  color: string;
}

export const TechnicianDashboardCard = ({ technician, index }: TechnicianDashboardCardProps) => {
  const inv = technician.fixedInventory;
  
  // تحديد مستوى التنبيه لكل منتج
  const getAlertLevel = (total: number): 'good' | 'warning' | 'critical' => {
    if (total === 0) return 'critical';
    if (total < 10) return 'warning';
    return 'good';
  };

  // إنشاء قائمة المنتجات مع حالاتها - دائماً تعرض جميع المنتجات حتى لو كان المخزون فارغ
  const products: ProductStatus[] = [
    {
      name: "N950",
      nameAr: "N950",
      boxes: inv?.n950Boxes || 0,
      units: inv?.n950Units || 0,
      total: (inv?.n950Boxes || 0) + (inv?.n950Units || 0),
      alertLevel: getAlertLevel((inv?.n950Boxes || 0) + (inv?.n950Units || 0)),
      icon: Smartphone,
      color: "#3b82f6"
    },
    {
      name: "I9000S",
      nameAr: "I9000S",
      boxes: inv?.i9000sBoxes || 0,
      units: inv?.i9000sUnits || 0,
      total: (inv?.i9000sBoxes || 0) + (inv?.i9000sUnits || 0),
      alertLevel: getAlertLevel((inv?.i9000sBoxes || 0) + (inv?.i9000sUnits || 0)),
      icon: Smartphone,
      color: "#8b5cf6"
    },
    {
      name: "I9100",
      nameAr: "I9100",
      boxes: inv?.i9100Boxes || 0,
      units: inv?.i9100Units || 0,
      total: (inv?.i9100Boxes || 0) + (inv?.i9100Units || 0),
      alertLevel: getAlertLevel((inv?.i9100Boxes || 0) + (inv?.i9100Units || 0)),
      icon: Smartphone,
      color: "#ec4899"
    },
    {
      name: "Roll Paper",
      nameAr: "أوراق رول",
      boxes: inv?.rollPaperBoxes || 0,
      units: inv?.rollPaperUnits || 0,
      total: (inv?.rollPaperBoxes || 0) + (inv?.rollPaperUnits || 0),
      alertLevel: getAlertLevel((inv?.rollPaperBoxes || 0) + (inv?.rollPaperUnits || 0)),
      icon: Package,
      color: "#f59e0b"
    },
    {
      name: "Stickers",
      nameAr: "ملصقات",
      boxes: inv?.stickersBoxes || 0,
      units: inv?.stickersUnits || 0,
      total: (inv?.stickersBoxes || 0) + (inv?.stickersUnits || 0),
      alertLevel: getAlertLevel((inv?.stickersBoxes || 0) + (inv?.stickersUnits || 0)),
      icon: Package,
      color: "#14b8a6"
    },
    {
      name: "Batteries",
      nameAr: "بطاريات",
      boxes: inv?.newBatteriesBoxes || 0,
      units: inv?.newBatteriesUnits || 0,
      total: (inv?.newBatteriesBoxes || 0) + (inv?.newBatteriesUnits || 0),
      alertLevel: getAlertLevel((inv?.newBatteriesBoxes || 0) + (inv?.newBatteriesUnits || 0)),
      icon: Package,
      color: "#06b6d4"
    },
    {
      name: "Mobily SIM",
      nameAr: "موبايلي",
      boxes: inv?.mobilySimBoxes || 0,
      units: inv?.mobilySimUnits || 0,
      total: (inv?.mobilySimBoxes || 0) + (inv?.mobilySimUnits || 0),
      alertLevel: getAlertLevel((inv?.mobilySimBoxes || 0) + (inv?.mobilySimUnits || 0)),
      icon: Package,
      color: "#10b981"
    },
    {
      name: "STC SIM",
      nameAr: "STC",
      boxes: inv?.stcSimBoxes || 0,
      units: inv?.stcSimUnits || 0,
      total: (inv?.stcSimBoxes || 0) + (inv?.stcSimUnits || 0),
      alertLevel: getAlertLevel((inv?.stcSimBoxes || 0) + (inv?.stcSimUnits || 0)),
      icon: Package,
      color: "#8b5cf6"
    },
    {
      name: "Zain SIM",
      nameAr: "زين",
      boxes: inv?.zainSimBoxes || 0,
      units: inv?.zainSimUnits || 0,
      total: (inv?.zainSimBoxes || 0) + (inv?.zainSimUnits || 0),
      alertLevel: getAlertLevel((inv?.zainSimBoxes || 0) + (inv?.zainSimUnits || 0)),
      icon: Package,
      color: "#f97316"
    },
  ];

  const totalInventory = products.reduce((sum, p) => sum + p.total, 0);
  const criticalCount = products.filter(p => p.alertLevel === 'critical').length;
  const warningCount = products.filter(p => p.alertLevel === 'warning').length;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.005 }}
      className="group mb-4"
    >
      <Link href={`/technician-details/${technician.technicianId}`}>
        <div className="relative bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xl rounded-2xl border border-[#18B2B0]/30 overflow-hidden shadow-lg hover:shadow-2xl hover:border-[#18B2B0]/60 transition-all duration-300">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#18B2B0]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Glow Effect */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            animate={{
              boxShadow: [
                "0 0 20px rgba(24, 178, 176, 0.0)",
                "0 0 40px rgba(24, 178, 176, 0.2)",
                "0 0 20px rgba(24, 178, 176, 0.0)",
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <div className="relative p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Technician Info - Left Side */}
              <div className="lg:col-span-3">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="p-3 bg-gradient-to-br from-[#18B2B0] to-[#0ea5a3] rounded-xl shadow-lg flex-shrink-0"
                    whileHover={{ rotate: 12, scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <User className="h-6 w-6 text-white" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white truncate">
                      {technician.technicianName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{technician.city}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-[#18B2B0]/20 text-[#18B2B0] border-[#18B2B0]/30 text-xs">
                        {totalInventory} وحدة
                      </Badge>
                      {criticalCount > 0 && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                          <AlertTriangle className="h-3 w-3 ml-1" />
                          {criticalCount}
                        </Badge>
                      )}
                      {warningCount > 0 && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                          {warningCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Dashboard - Middle/Right Side */}
              <div className="lg:col-span-9">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-3">
                  {products.map((product, idx) => {
                    const Icon = product.icon;
                    const AlertIcon = product.alertLevel === 'critical' ? XCircle : 
                                      product.alertLevel === 'warning' ? AlertTriangle : 
                                      CheckCircle;
                    const alertColor = product.alertLevel === 'critical' ? 'text-red-400' : 
                                       product.alertLevel === 'warning' ? 'text-yellow-400' : 
                                       'text-green-400';
                    
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 + idx * 0.02 }}
                        className="relative bg-white/5 rounded-xl p-3 border border-white/10 hover:border-[#18B2B0]/40 transition-all"
                        data-testid={`product-${product.name}-${technician.technicianId}`}
                      >
                        {/* Alert Badge */}
                        <div className="absolute -top-2 -right-2">
                          <AlertIcon className={`h-5 w-5 ${alertColor} drop-shadow-lg`} />
                        </div>

                        {/* Product Info */}
                        <div className="text-center">
                          <div className="flex justify-center mb-2">
                            <div 
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: `${product.color}20` }}
                            >
                              <Icon 
                                className="h-4 w-4" 
                                style={{ color: product.color }}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mb-1 truncate">{product.nameAr}</p>
                          <p className="text-lg font-bold text-white">{product.total}</p>
                          <div className="flex items-center justify-center gap-1 mt-1 text-xs text-gray-500">
                            <span>ك:{product.boxes}</span>
                            <span>•</span>
                            <span>م:{product.units}</span>
                          </div>
                          
                          {/* Mini Progress Bar */}
                          <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (product.total / 20) * 100)}%` }}
                              transition={{ duration: 0.5, delay: index * 0.05 + idx * 0.02 }}
                              className="h-full rounded-full"
                              style={{ 
                                backgroundColor: product.alertLevel === 'critical' ? '#ef4444' : 
                                                 product.alertLevel === 'warning' ? '#f59e0b' : 
                                                 product.color 
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
