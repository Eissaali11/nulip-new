import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Database, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/dashboard/Navbar";

export default function BackupManagementPage() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/admin/backup', {
        credentials: 'include',
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('فشل في تصدير النسخة الاحتياطية');
      }

      const backup = await response.json();
      
      // Create download link
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "تم التصدير بنجاح",
        description: "تم تنزيل النسخة الاحتياطية على جهازك",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في التصدير",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء تصدير البيانات",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      await apiRequest('POST', '/api/admin/restore', backup);

      toast({
        title: "تمت الاستعادة بنجاح",
        description: "تم استعادة جميع البيانات من النسخة الاحتياطية",
      });

      // Reload page after successful restore
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في الاستعادة",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء استعادة البيانات",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <Database className="h-8 w-8 text-[#18B2B0]" />
              إدارة النسخ الاحتياطية
            </h1>
            <p className="text-gray-400 mt-1">
              تصدير واستعادة جميع بيانات النظام
            </p>
          </div>
          <Button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="bg-[#18B2B0] hover:bg-[#18B2B0]/90 text-white"
            data-testid="button-export-quick"
          >
            {isExporting ? (
              <>
                <Database className="ml-2 h-4 w-4 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="ml-2 h-4 w-4" />
                نسخ احتياطي سريع
              </>
            )}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Alert className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400" data-testid="alert-backup-warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>تحذير:</strong> عملية الاستعادة ستحذف جميع البيانات الحالية واستبدالها ببيانات النسخة الاحتياطية. تأكد من أخذ نسخة احتياطية حديثة قبل الاستعادة.
            </AlertDescription>
          </Alert>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-6 md:grid-cols-2"
        >
        {/* Export Backup Card */}
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm" data-testid="card-export-backup">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-[#18B2B0]" />
              <CardTitle className="text-white">تصدير النسخة الاحتياطية</CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              تنزيل ملف JSON يحتوي على جميع بيانات النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-gray-300">
                <Database className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#18B2B0]" />
                <div>
                  <p className="font-medium mb-1 text-white">البيانات المضمنة:</p>
                  <ul className="list-disc list-inside space-y-1 mr-2">
                    <li>المناطق والمستخدمين</li>
                    <li>المستودعات والمخزون</li>
                    <li>الفنيين والمخزون الثابت والمتحرك</li>
                    <li>الطلبات والتحويلات</li>
                    <li>سجلات النظام والعمليات</li>
                  </ul>
                </div>
              </div>

              <Button
                onClick={handleExportBackup}
                disabled={isExporting}
                className="w-full bg-[#18B2B0] hover:bg-[#18B2B0]/90 text-white"
                data-testid="button-export-backup"
              >
                {isExporting ? (
                  <>
                    <Database className="ml-2 h-4 w-4 animate-spin" />
                    جاري التصدير...
                  </>
                ) : (
                  <>
                    <Download className="ml-2 h-4 w-4" />
                    تصدير النسخة الاحتياطية
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Backup Card */}
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm" data-testid="card-import-backup">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#18B2B0]" />
              <CardTitle className="text-white">استعادة النسخة الاحتياطية</CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              رفع ملف نسخة احتياطية لاستعادة البيانات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-red-400">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1 text-white">تحذيرات مهمة:</p>
                  <ul className="list-disc list-inside space-y-1 mr-2">
                    <li>سيتم حذف جميع البيانات الحالية</li>
                    <li>لا يمكن التراجع عن هذه العملية</li>
                    <li>تأكد من صحة الملف قبل الاستعادة</li>
                    <li>قد تستغرق العملية عدة دقائق</li>
                  </ul>
                </div>
              </div>

              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  disabled={isImporting}
                  className="hidden"
                  id="backup-file-input"
                  data-testid="input-backup-file"
                />
                <label htmlFor="backup-file-input">
                  <Button
                    asChild
                    variant="destructive"
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={isImporting}
                    data-testid="button-import-backup"
                  >
                    <span className="cursor-pointer">
                      {isImporting ? (
                        <>
                          <Database className="ml-2 h-4 w-4 animate-spin" />
                          جاري الاستعادة...
                        </>
                      ) : (
                        <>
                          <Upload className="ml-2 h-4 w-4" />
                          استعادة النسخة الاحتياطية
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm" data-testid="card-backup-info">
            <CardHeader>
              <CardTitle className="text-white">معلومات إضافية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-300">
                <div>
                  <strong className="text-white">صيغة الملف:</strong> يتم تصدير البيانات بصيغة JSON قياسية يمكن قراءتها وتحريرها
                </div>
                <div>
                  <strong className="text-white">التوافق:</strong> يجب استخدام النسخ الاحتياطية من نفس إصدار النظام
                </div>
                <div>
                  <strong className="text-white">الأمان:</strong> احفظ ملفات النسخ الاحتياطي في مكان آمن حيث تحتوي على معلومات حساسة
                </div>
                <div>
                  <strong className="text-white">التكرار:</strong> ننصح بأخذ نسخة احتياطية بشكل دوري (يومي أو أسبوعي)
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
