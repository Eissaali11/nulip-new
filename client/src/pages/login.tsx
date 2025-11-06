import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { loginSchema, type LoginRequest } from '@shared/schema';
import { LogIn, User, Lock, Loader2, Shield, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import rasscoLogo from "@assets/image_1762442473114.png";
import madaDevice from "@assets/image_1762442486277.png";

export default function Login() {
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginRequest) => {
    setIsSubmitting(true);
    try {
      const result = await login(data);
      
      if (result.success) {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً ${result.user?.fullName}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "خطأ في تسجيل الدخول",
          description: result.message || "اسم المستخدم أو كلمة المرور غير صحيحة",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الدخول",
        description: error.message || "حدث خطأ غير متوقع",
      });
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 overflow-hidden relative" dir="rtl">
      {/* Animated Background Shapes */}
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, 150, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        animate={{
          x: [0, -100, 0],
          y: [0, -150, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
        animate={{
          x: [-200, 200, -200],
          y: [-100, 100, -100],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <motion.div
          className="hidden lg:block space-y-8"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.h1 
              className="text-6xl font-black text-white mb-4 flex items-center gap-3"
              animate={{ 
                textShadow: [
                  "0 0 20px rgba(59, 130, 246, 0.5)",
                  "0 0 40px rgba(147, 51, 234, 0.7)",
                  "0 0 20px rgba(59, 130, 246, 0.5)",
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="h-14 w-14 text-yellow-400 animate-pulse" />
              نظام إدارة المخزون
            </motion.h1>
            <p className="text-2xl text-white/90 font-semibold">
              حلول متقدمة لإدارة مخزون الفنيين
            </p>
          </motion.div>

          {/* Logo */}
          <motion.div 
            className="flex items-center gap-6 flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <motion.div
              className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-2xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img src={rasscoLogo} alt="RASSCO" className="h-16 w-auto" />
            </motion.div>
          </motion.div>

          {/* Device Image */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <motion.div
              animate={{ 
                y: [0, -20, 0],
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-3xl blur-2xl opacity-50"></div>
              <img src={madaDevice} alt="MADA Device" className="h-64 w-auto relative z-10 drop-shadow-2xl mx-auto" />
            </motion.div>
          </motion.div>

          {/* Features */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {[
              "تتبع المخزون الثابت والمتحرك",
              "إدارة متقدمة للفنيين",
              "تقارير شاملة وتصدير Excel",
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-3 text-white/90"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
              >
                <div className="p-2 bg-green-500/20 rounded-lg border border-green-400/30">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <span className="font-semibold text-lg">{feature}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-2 border-white/20 shadow-2xl">
            <CardHeader className="space-y-1 text-center pb-6">
              <motion.div 
                className="flex justify-center mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <motion.div 
                  className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl"
                  animate={{ 
                    boxShadow: [
                      "0 0 20px rgba(59, 130, 246, 0.5)",
                      "0 0 40px rgba(147, 51, 234, 0.7)",
                      "0 0 20px rgba(59, 130, 246, 0.5)",
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <LogIn className="h-12 w-12 text-white drop-shadow-lg" />
                </motion.div>
              </motion.div>
              <CardTitle className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                تسجيل الدخول
              </CardTitle>
              <CardDescription className="text-base">
                أدخل بيانات تسجيل الدخول للوصول إلى النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold">اسم المستخدم</FormLabel>
                        <FormControl>
                          <motion.div 
                            className="relative"
                            whileFocus={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          >
                            <User className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                              data-testid="input-username"
                              placeholder="أدخل اسم المستخدم"
                              className="pr-10 h-12 text-base border-2 focus:border-blue-500 transition-colors"
                              disabled={isSubmitting}
                              {...field}
                            />
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold">كلمة المرور</FormLabel>
                        <FormControl>
                          <motion.div 
                            className="relative"
                            whileFocus={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Lock className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                              data-testid="input-password"
                              type="password"
                              placeholder="أدخل كلمة المرور"
                              className="pr-10 h-12 text-base border-2 focus:border-blue-500 transition-colors"
                              disabled={isSubmitting}
                              {...field}
                            />
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      data-testid="button-login"
                      type="submit"
                      className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          جاري تسجيل الدخول...
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-5 w-5" />
                          تسجيل الدخول
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>

              <motion.div 
                className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <div className="border-t pt-4 border-gray-200 dark:border-gray-700">
                  <p className="font-semibold text-base mb-2">حسابات تجريبية:</p>
                  <div className="mt-3 space-y-2">
                    <motion.div 
                      className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800"
                      whileHover={{ scale: 1.02 }}
                    >
                      <p className="font-bold text-blue-700 dark:text-blue-300">مدير النظام</p>
                      <p className="text-xs mt-1">admin / admin123</p>
                    </motion.div>
                    <motion.div 
                      className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800"
                      whileHover={{ scale: 1.02 }}
                    >
                      <p className="font-bold text-green-700 dark:text-green-300">فني</p>
                      <p className="text-xs mt-1">employee1 / emp123</p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </Card>

          {/* Mobile Logo */}
          <motion.div 
            className="lg:hidden flex items-center justify-center gap-4 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <motion.div
              className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <img src={rasscoLogo} alt="RASSCO" className="h-10 w-auto" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
