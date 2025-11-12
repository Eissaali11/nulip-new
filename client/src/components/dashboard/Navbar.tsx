import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Package, 
  TruckIcon, 
  Users, 
  ClipboardCheck, 
  Warehouse,
  Menu,
  X,
  Bell,
  Smartphone
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  gradient: string;
  adminOnly?: boolean;
  badge?: number;
}

interface WarehouseTransfer {
  id: string;
  technicianId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface PendingCountResponse {
  count: number;
}

export const Navbar = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: pendingTransfers = [] } = useQuery<WarehouseTransfer[]>({
    queryKey: ["/api/warehouse-transfers"],
    enabled: !!user?.id && user?.role !== 'admin',
    select: (data) => data.filter(t => t.status === 'pending'),
  });

  const { data: pendingRequestsCount } = useQuery<PendingCountResponse>({
    queryKey: ["/api/inventory-requests/pending/count"],
    enabled: !!user?.id && user?.role === 'admin',
  });

  const notificationsBadgeCount = user?.role === 'admin' 
    ? (pendingRequestsCount?.count || 0)
    : pendingTransfers.length;

  const navItems: NavItem[] = [
    {
      title: "لوحة مخزون الفنيين",
      href: "/admin-inventory-overview",
      icon: LayoutDashboard,
      gradient: "from-purple-500 to-pink-600",
      adminOnly: true,
    },
    {
      title: "المخزون المتحرك",
      href: "/my-moving-inventory",
      icon: TruckIcon,
      gradient: "from-emerald-500 to-green-600",
    },
    {
      title: "المخزون الثابت",
      href: "/my-fixed-inventory",
      icon: Package,
      gradient: "from-[#18B2B0] to-[#0ea5a3]",
    },
    {
      title: "الأجهزة",
      href: "/devices",
      icon: Smartphone,
      gradient: "from-indigo-500 to-purple-600",
      adminOnly: true,
    },
    {
      title: "الإشعارات",
      href: "/notifications",
      icon: Bell,
      gradient: "from-orange-500 to-amber-600",
      badge: notificationsBadgeCount > 0 ? notificationsBadgeCount : undefined,
    },
    {
      title: "المستخدمين",
      href: "/users",
      icon: Users,
      gradient: "from-blue-500 to-indigo-600",
      adminOnly: true,
    },
    {
      title: "العمليات",
      href: "/operations",
      icon: ClipboardCheck,
      gradient: "from-cyan-500 to-teal-600",
      adminOnly: true,
    },
    {
      title: "المستودعات",
      href: "/warehouses",
      icon: Warehouse,
      gradient: "from-orange-500 to-amber-600",
      adminOnly: true,
    },
  ];

  const filteredNavItems = navItems.filter(
    item => !item.adminOnly || user?.role === 'admin'
  );

  const isActive = (href: string) => location === href;

  return (
    <>
      {/* Desktop Navbar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="hidden lg:block relative z-20 border-b border-[#18B2B0]/20 bg-gradient-to-r from-[#0a0a0f]/95 via-[#0f0f15]/95 to-[#0a0a0f]/95 backdrop-blur-xl"
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-2 py-4">
            {filteredNavItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -2 }}
                    className="relative group"
                  >
                    <div
                      className={`
                        relative overflow-hidden rounded-xl px-6 py-3 transition-all duration-300
                        ${active 
                          ? 'bg-gradient-to-r ' + item.gradient + ' shadow-lg shadow-[#18B2B0]/30' 
                          : 'bg-white/5 hover:bg-white/10 border border-[#18B2B0]/20 hover:border-[#18B2B0]/40'
                        }
                      `}
                      data-testid={`nav-link-${item.href.replace('/', '')}`}
                    >
                      {/* Animated Background */}
                      {!active && (
                        <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                      )}
                      
                      {/* Glow Effect on Active */}
                      {active && (
                        <motion.div
                          className="absolute inset-0"
                          animate={{
                            boxShadow: [
                              '0 0 20px rgba(24, 178, 176, 0.3)',
                              '0 0 40px rgba(24, 178, 176, 0.5)',
                              '0 0 20px rgba(24, 178, 176, 0.3)',
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}

                      <div className="relative flex items-center gap-3">
                        <motion.div
                          whileHover={{ rotate: 12, scale: 1.1 }}
                          transition={{ duration: 0.3 }}
                          className="relative"
                        >
                          <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-[#18B2B0]'}`} />
                          {item.badge && item.badge > 0 && (
                            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5 text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </motion.div>
                        <span className={`font-bold text-sm whitespace-nowrap ${active ? 'text-white' : 'text-gray-300'}`}>
                          {item.title}
                        </span>
                      </div>
                    </div>

                    {/* Active Indicator */}
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className={`absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r ${item.gradient} rounded-full`}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navbar */}
      <div className="lg:hidden relative z-20">
        {/* Mobile Header */}
        <div className="border-b border-[#18B2B0]/20 bg-gradient-to-r from-[#0a0a0f]/95 via-[#0f0f15]/95 to-[#0a0a0f]/95 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">القائمة الرئيسية</h2>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-[#18B2B0]/20 transition-colors"
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-[#18B2B0]" />
              ) : (
                <Menu className="h-6 w-6 text-[#18B2B0]" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{
            height: mobileMenuOpen ? "auto" : 0,
            opacity: mobileMenuOpen ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden bg-gradient-to-b from-[#0a0a0f]/98 to-[#0f0f15]/98 backdrop-blur-xl border-b border-[#18B2B0]/20"
        >
          <div className="container mx-auto px-4 py-4 space-y-2">
            {filteredNavItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      relative overflow-hidden rounded-xl p-4 transition-all duration-300
                      ${active 
                        ? 'bg-gradient-to-r ' + item.gradient + ' shadow-lg' 
                        : 'bg-white/5 hover:bg-white/10 border border-[#18B2B0]/20'
                      }
                    `}
                    data-testid={`mobile-nav-link-${item.href.replace('/', '')}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${active ? 'bg-white/20' : 'bg-[#18B2B0]/20'} relative`}>
                        <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-[#18B2B0]'}`} />
                        {item.badge && item.badge > 0 && (
                          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white min-w-[18px] h-4 flex items-center justify-center rounded-full px-1 text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-bold ${active ? 'text-white' : 'text-gray-300'}`}>
                          {item.title}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>
    </>
  );
};
