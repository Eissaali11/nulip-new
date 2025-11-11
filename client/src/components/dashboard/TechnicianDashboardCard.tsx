import { motion } from "framer-motion";
import { TechnicianInventory } from "@shared/schema";
import { BarChart, Bar, ResponsiveContainer, Cell } from "recharts";
import { Package, TruckIcon, User, MapPin, TrendingUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface TechnicianDashboardCardProps {
  technician: TechnicianInventory;
  index: number;
}

export const TechnicianDashboardCard = ({ technician, index }: TechnicianDashboardCardProps) => {
  // حساب إجمالي المخزون
  const getTotalInventory = () => {
    return (
      (technician.n950Boxes || 0) + (technician.n950Units || 0) +
      (technician.i9000sBoxes || 0) + (technician.i9000sUnits || 0) +
      (technician.i9100Boxes || 0) + (technician.i9100Units || 0) +
      (technician.rollPaperBoxes || 0) + (technician.rollPaperUnits || 0) +
      (technician.stickersBoxes || 0) + (technician.stickersUnits || 0) +
      (technician.newBatteriesBoxes || 0) + (technician.newBatteriesUnits || 0) +
      (technician.mobilySimBoxes || 0) + (technician.mobilySimUnits || 0) +
      (technician.stcSimBoxes || 0) + (technician.stcSimUnits || 0) +
      (technician.zainSimBoxes || 0) + (technician.zainSimUnits || 0)
    );
  };

  // بيانات الرسم البياني - أعلى 5 عناصر
  const chartData = [
    { 
      name: "N950", 
      value: (technician.n950Boxes || 0) + (technician.n950Units || 0),
      color: "#3b82f6"
    },
    { 
      name: "I9000S", 
      value: (technician.i9000sBoxes || 0) + (technician.i9000sUnits || 0),
      color: "#8b5cf6"
    },
    { 
      name: "I9100", 
      value: (technician.i9100Boxes || 0) + (technician.i9100Units || 0),
      color: "#ec4899"
    },
    { 
      name: "شرائح", 
      value: (
        (technician.mobilySimBoxes || 0) + (technician.mobilySimUnits || 0) +
        (technician.stcSimBoxes || 0) + (technician.stcSimUnits || 0) +
        (technician.zainSimBoxes || 0) + (technician.zainSimUnits || 0)
      ),
      color: "#10b981"
    },
    { 
      name: "ملحقات", 
      value: (
        (technician.rollPaperBoxes || 0) + (technician.rollPaperUnits || 0) +
        (technician.stickersBoxes || 0) + (technician.stickersUnits || 0) +
        (technician.newBatteriesBoxes || 0) + (technician.newBatteriesUnits || 0)
      ),
      color: "#f59e0b"
    },
  ].sort((a, b) => b.value - a.value);

  const totalInventory = getTotalInventory();
  const isLowStock = totalInventory < 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group"
    >
      <div className="relative bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl rounded-2xl border border-[#18B2B0]/30 overflow-hidden shadow-xl hover:shadow-2xl hover:border-[#18B2B0]/60 transition-all duration-300">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          animate={{
            boxShadow: [
              "0 0 20px rgba(24, 178, 176, 0.0)",
              "0 0 30px rgba(24, 178, 176, 0.3)",
              "0 0 20px rgba(24, 178, 176, 0.0)",
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <motion.div 
                className="p-3 bg-gradient-to-br from-[#18B2B0] to-[#0ea5a3] rounded-xl shadow-lg"
                whileHover={{ rotate: 12, scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <User className="h-5 w-5 text-white" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white truncate">
                  {technician.technicianName}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{technician.city}</span>
                </div>
              </div>
            </div>
            
            {isLowStock && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <AlertTriangle className="h-3 w-3 ml-1" />
                منخفض
              </Badge>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-[#18B2B0]" />
                <p className="text-xs text-gray-400">إجمالي المخزون</p>
              </div>
              <p className="text-xl font-bold text-white">{totalInventory}</p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <p className="text-xs text-gray-400">العناصر النشطة</p>
              </div>
              <p className="text-xl font-bold text-white">
                {chartData.filter(d => d.value > 0).length}
              </p>
            </div>
          </div>

          {/* Mini Chart */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2 font-medium">توزيع المخزون</p>
            <div className="h-24 bg-white/5 rounded-xl p-2 border border-white/10" data-testid={`chart-technician-${technician.id}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Categories Summary */}
          <div className="space-y-2 mb-4">
            {chartData.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-300">{item.name}</span>
                </div>
                <span className="font-semibold text-white">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <Link href={`/technician-details/${technician.id}`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-[#18B2B0] to-[#0ea5a3] hover:from-[#0ea5a3] hover:to-[#18B2B0] text-white font-bold py-2.5 rounded-xl shadow-lg transition-all"
              data-testid={`button-view-technician-${technician.id}`}
            >
              عرض التفاصيل الكاملة
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
