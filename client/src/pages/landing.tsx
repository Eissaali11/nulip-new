import { motion } from "framer-motion";
import { useLanguage } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import stockProLogo from "@assets/Gemini_Generated_Image_fe3annfe3annfe3a-removebg-preview_1763137399589.png";
import { 
  Package, 
  Users, 
  Warehouse, 
  BarChart3, 
  FileSpreadsheet, 
  Globe, 
  Bell, 
  Smartphone
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function LandingPage() {
  const { t, language, setLanguage } = useLanguage();
  const statsRef = useRef<HTMLDivElement>(null);
  const [isStatsInView, setIsStatsInView] = useState(false);
  
  const features = [
    {
      icon: Package,
      titleKey: 'landing.feature.dual_inventory.title',
      descKey: 'landing.feature.dual_inventory.description',
      color: 'from-cyan-400 to-blue-500'
    },
    {
      icon: Users,
      titleKey: 'landing.feature.roles.title',
      descKey: 'landing.feature.roles.description',
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: Warehouse,
      titleKey: 'landing.feature.warehouses.title',
      descKey: 'landing.feature.warehouses.description',
      color: 'from-orange-400 to-red-500'
    },
    {
      icon: BarChart3,
      titleKey: 'landing.feature.analytics.title',
      descKey: 'landing.feature.analytics.description',
      color: 'from-green-400 to-emerald-500'
    },
    {
      icon: FileSpreadsheet,
      titleKey: 'landing.feature.excel.title',
      descKey: 'landing.feature.excel.description',
      color: 'from-blue-400 to-indigo-500'
    },
    {
      icon: Globe,
      titleKey: 'landing.feature.bilingual.title',
      descKey: 'landing.feature.bilingual.description',
      color: 'from-teal-400 to-cyan-500'
    },
    {
      icon: Bell,
      titleKey: 'landing.feature.realtime.title',
      descKey: 'landing.feature.realtime.description',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: Smartphone,
      titleKey: 'landing.feature.mobile.title',
      descKey: 'landing.feature.mobile.description',
      color: 'from-pink-400 to-rose-500'
    }
  ];

  const stats = [
    { valueKey: '50+', labelKey: 'landing.stats.warehouses' },
    { valueKey: '1000+', labelKey: 'landing.stats.products' },
    { valueKey: '200+', labelKey: 'landing.stats.technicians' },
    { valueKey: '30+', labelKey: 'landing.stats.cities' }
  ];

  const [animatedStats, setAnimatedStats] = useState(stats.map(() => 0));
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsStatsInView(true);
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasAnimated]);

  useEffect(() => {
    if (!isStatsInView) return;
    
    const targets = [50, 1000, 200, 30];
    const durations = [1500, 2000, 1500, 1200];
    const timers: ReturnType<typeof setInterval>[] = [];
    
    targets.forEach((target, index) => {
      let current = 0;
      const increment = target / (durations[index] / 16);
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setAnimatedStats(prev => {
          const newStats = [...prev];
          newStats[index] = Math.floor(current);
          return newStats;
        });
      }, 16);
      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => clearInterval(timer));
    };
  }, [isStatsInView]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#18B2B0]/20 via-transparent to-transparent pointer-events-none" />
      
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(24, 178, 176, 0.15) 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative">
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4 py-6"
        >
          <nav className="flex items-center justify-between backdrop-blur-xl bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="flex items-center gap-2">
              <img src={stockProLogo} alt="Stock Pro" className="h-12 w-auto" />
              <span className="text-lg font-bold bg-gradient-to-r from-[#18B2B0] to-cyan-300 bg-clip-text text-transparent">
                StockPro
              </span>
            </div>
            <Button 
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              variant="ghost"
              size="sm"
              className="backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium"
              data-testid="landing-language-toggle"
            >
              <Globe className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'EN' : 'AR'}
            </Button>
          </nav>
        </motion.div>

        <section className="container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-8 relative inline-block"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#18B2B0]/20 to-cyan-500/20 rounded-full blur-3xl" />
              <motion.img 
                src={stockProLogo} 
                alt="Stock Pro" 
                className="relative h-32 lg:h-40 w-auto mx-auto"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>

            <motion.h1 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl lg:text-6xl font-bold mb-4 leading-tight"
            >
              <span className="bg-gradient-to-r from-white via-[#18B2B0] to-white bg-clip-text text-transparent">
                {t('landing.hero.title')}
              </span>
            </motion.h1>

            <motion.p 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl lg:text-2xl text-[#18B2B0] font-semibold mb-3"
            >
              {t('landing.hero.subtitle')}
            </motion.p>

            <motion.p 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-base lg:text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto"
            >
              {t('landing.hero.description')}
            </motion.p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-[#18B2B0] via-cyan-400 to-[#18B2B0] bg-clip-text text-transparent">
              {t('landing.features.title')}
            </h2>
            <p className="text-xl text-gray-400">
              {t('landing.features.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="backdrop-blur-xl bg-white/5 border-white/10 p-6 h-full hover:bg-white/10 transition-all duration-300 group hover:scale-105 hover:border-[#18B2B0]/50">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} p-0.5 mb-4 group-hover:scale-110 transition-transform`}>
                    <div className="w-full h-full rounded-2xl bg-gray-950 flex items-center justify-center">
                      <feature.icon className="text-white" size={28} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-[#18B2B0]">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {t(feature.descKey)}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section ref={statsRef} className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="backdrop-blur-xl bg-gradient-to-r from-[#18B2B0]/10 via-cyan-500/10 to-[#18B2B0]/10 rounded-3xl p-8 lg:p-12 border border-[#18B2B0]/20"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-[#18B2B0] to-cyan-300 bg-clip-text text-transparent mb-2">
                    {animatedStats[index]}{index === 1 || index === 2 || index === 3 ? '+' : ''}
                  </div>
                  <div className="text-gray-400 text-lg">
                    {t(stat.labelKey)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-12 lg:p-20 border border-white/20 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#18B2B0] to-cyan-500 rounded-full blur-3xl opacity-20" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20" />
            
            <div className="relative text-center">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {t('landing.cta.title')}
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                {t('landing.cta.description')}
              </p>
            </div>
          </motion.div>
        </section>

        <footer className="container mx-auto px-4 py-12 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <img src={stockProLogo} alt="Stock Pro" className="h-20 w-auto" />
            <div className="text-sm text-gray-500">
              StockPro v1.0
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
