import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Battery, 
  Cable, 
  CreditCard,
  AlertCircle,
  User,
  Calendar,
  Package,
  ArrowLeft,
  MapPin,
  Shield,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { motion } from "framer-motion";

interface ReceivedDevice {
  id: string;
  terminalId: string;
  serialNumber: string;
  battery: boolean;
  chargerCable: boolean;
  chargerHead: boolean;
  hasSim: boolean;
  simCardType: string | null;
  damagePart: string;
  status: 'pending' | 'approved' | 'rejected';
  technicianId: string;
  supervisorId: string | null;
  regionId: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export default function ReceivedDeviceDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: device, isLoading } = useQuery<ReceivedDevice>({
    queryKey: [`/api/received-devices/${id}`],
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes: string }) =>
      apiRequest("PATCH", `/api/received-devices/${id}/status`, { status, adminNotes: notes }),
    onSuccess: () => {
      toast({
        title: actionType === 'approve' ? "✅ تمت الموافقة" : "❌ تم الرفض",
        description: actionType === 'approve' 
          ? "تم قبول الجهاز بنجاح" 
          : "تم رفض الجهاز",
      });
      setActionDialogOpen(false);
      setActionType(null);
      setAdminNotes("");
      queryClient.invalidateQueries({ queryKey: [`/api/received-devices/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/received-devices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/received-devices/pending/count"] });
    },
    onError: () => {
      toast({
        title: "❌ خطأ",
        description: "فشل تحديث حالة الجهاز",
        variant: "destructive",
      });
    },
  });

  const handleAction = (action: 'approve' | 'reject') => {
    setActionType(action);
    setActionDialogOpen(true);
  };

  const confirmAction = () => {
    if (!actionType) return;
    
    updateStatusMutation.mutate({
      status: actionType === 'approve' ? 'approved' : 'rejected',
      notes: adminNotes,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#18B2B0] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">الجهاز غير موجود</p>
          <Button
            onClick={() => setLocation("/received-devices/review")}
            className="mt-4 bg-gradient-to-r from-[#18B2B0] to-teal-600"
          >
            العودة للقائمة
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    pending: { 
      color: "from-yellow-500 to-amber-500", 
      bgColor: "from-yellow-500/20 to-amber-500/20",
      icon: Clock, 
      text: "قيد المراجعة",
      badgeClass: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
    },
    approved: { 
      color: "from-green-500 to-emerald-500", 
      bgColor: "from-green-500/20 to-emerald-500/20",
      icon: CheckCircle2, 
      text: "موافق عليه",
      badgeClass: "bg-green-500/20 text-green-300 border-green-500/30"
    },
    rejected: { 
      color: "from-red-500 to-rose-500", 
      bgColor: "from-red-500/20 to-rose-500/20",
      icon: XCircle, 
      text: "مرفوض",
      badgeClass: "bg-red-500/20 text-red-300 border-red-500/30"
    },
  };

  const status = statusConfig[device.status];
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br ${status.bgColor} rounded-full blur-3xl animate-pulse`} />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto space-y-8"
        >
          {/* Header with Back Button */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setLocation("/received-devices/review")}
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة للقائمة
            </Button>

            <Badge className={`${status.badgeClass} flex items-center gap-2 px-4 py-2 text-base border`}>
              <StatusIcon className="w-5 h-5" />
              {status.text}
            </Badge>
          </div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative group"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${status.bgColor} rounded-3xl blur-2xl group-hover:blur-3xl transition-all`} />
            <Card className="relative bg-slate-900/70 backdrop-blur-2xl border-slate-700/50 shadow-2xl overflow-hidden">
              {/* Header Section */}
              <CardHeader className="relative overflow-hidden border-b border-slate-700/50 pb-8">
                <div className={`absolute inset-0 bg-gradient-to-r ${status.bgColor}`} />
                <div className="relative">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`absolute inset-0 bg-gradient-to-r ${status.color} rounded-2xl blur-xl opacity-50`} />
                        <div className={`relative p-4 bg-gradient-to-br ${status.color} rounded-2xl shadow-2xl`}>
                          <Smartphone className="w-12 h-12 text-white" />
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-4xl text-slate-100 mb-2">
                          {device.terminalId}
                        </CardTitle>
                        <p className="text-slate-400 font-mono text-lg">
                          {device.serialNumber}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
                      <User className="w-5 h-5 text-[#18B2B0]" />
                      <div>
                        <p className="text-xs text-slate-500">الفني</p>
                        <p className="text-sm text-slate-300 font-medium">فني #{device.technicianId.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
                      <Calendar className="w-5 h-5 text-[#18B2B0]" />
                      <div>
                        <p className="text-xs text-slate-500">تاريخ الإدخال</p>
                        <p className="text-sm text-slate-300 font-medium">
                          {format(new Date(device.createdAt), "dd MMM yyyy", { locale: ar })}
                        </p>
                      </div>
                    </div>
                    {device.supervisorId && (
                      <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
                        <Shield className="w-5 h-5 text-[#18B2B0]" />
                        <div>
                          <p className="text-xs text-slate-500">المشرف</p>
                          <p className="text-sm text-slate-300 font-medium">مشرف #{device.supervisorId.slice(0, 8)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8 space-y-8">
                {/* Accessories Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-700/50">
                    <Package className="w-5 h-5 text-[#18B2B0]" />
                    <h3 className="text-xl font-semibold text-slate-200">
                      الملحقات المرفقة
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-xl border ${device.battery ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800/30 border-slate-700/50'}`}>
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Battery className={`w-8 h-8 ${device.battery ? 'text-green-400' : 'text-slate-600'}`} />
                        <span className={`text-sm font-medium ${device.battery ? 'text-green-300' : 'text-slate-500'}`}>
                          البطارية
                        </span>
                        {device.battery && (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${device.chargerCable ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800/30 border-slate-700/50'}`}>
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Cable className={`w-8 h-8 ${device.chargerCable ? 'text-green-400' : 'text-slate-600'}`} />
                        <span className={`text-sm font-medium ${device.chargerCable ? 'text-green-300' : 'text-slate-500'}`}>
                          كابل الشاحن
                        </span>
                        {device.chargerCable && (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${device.chargerHead ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800/30 border-slate-700/50'}`}>
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Cable className={`w-8 h-8 ${device.chargerHead ? 'text-green-400' : 'text-slate-600'}`} />
                        <span className={`text-sm font-medium ${device.chargerHead ? 'text-green-300' : 'text-slate-500'}`}>
                          رأس الشاحن
                        </span>
                        {device.chargerHead && (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${device.hasSim ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800/30 border-slate-700/50'}`}>
                      <div className="flex flex-col items-center gap-2 text-center">
                        <CreditCard className={`w-8 h-8 ${device.hasSim ? 'text-green-400' : 'text-slate-600'}`} />
                        <span className={`text-sm font-medium ${device.hasSim ? 'text-green-300' : 'text-slate-500'}`}>
                          {device.hasSim && device.simCardType ? device.simCardType : 'شريحة SIM'}
                        </span>
                        {device.hasSim && (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Damage Information */}
                {device.damagePart && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-700/50">
                      <AlertCircle className="w-5 h-5 text-orange-400" />
                      <h3 className="text-xl font-semibold text-slate-200">
                        معلومات الأضرار
                      </h3>
                    </div>

                    <div className="p-6 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl border border-orange-500/30">
                      <p className="text-orange-200 leading-relaxed whitespace-pre-wrap">
                        {device.damagePart}
                      </p>
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {device.adminNotes && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-700/50">
                      <FileText className="w-5 h-5 text-[#18B2B0]" />
                      <h3 className="text-xl font-semibold text-slate-200">
                        ملاحظات المشرف
                      </h3>
                    </div>

                    <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {device.adminNotes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Approval Information */}
                {device.approvedBy && device.approvedAt && (
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <Shield className="w-4 h-4 text-[#18B2B0]" />
                      <span>تمت المراجعة بواسطة: مشرف #{device.approvedBy.slice(0, 8)}</span>
                      <span>•</span>
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(device.approvedAt), "dd MMM yyyy", { locale: ar })}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {device.status === 'pending' && user && (user.role === 'admin' || user.role === 'supervisor') && (
                  <div className="flex gap-4 pt-6 border-t border-slate-700/50">
                    <Button
                      onClick={() => handleAction('approve')}
                      className="flex-1 h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/30 text-lg"
                      data-testid="button-approve"
                    >
                      <CheckCircle2 className="w-6 h-6 ml-2" />
                      موافقة على الجهاز
                    </Button>
                    <Button
                      onClick={() => handleAction('reject')}
                      variant="destructive"
                      className="flex-1 h-14 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-500/30 text-lg"
                      data-testid="button-reject"
                    >
                      <XCircle className="w-6 h-6 ml-2" />
                      رفض الجهاز
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700" data-testid="dialog-action">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-slate-100">
              {actionType === 'approve' ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  تأكيد الموافقة
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-400" />
                  تأكيد الرفض
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              جهاز: {device.terminalId} - {device.serialNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="notes" className="text-base text-slate-300">
                ملاحظات {actionType === 'reject' ? '(مطلوبة)' : '(اختيارية)'}
              </Label>
              <Textarea
                id="notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="أضف ملاحظات حول قرارك..."
                className="mt-2 min-h-[120px] bg-slate-800/50 border-slate-600 text-slate-100 placeholder:text-slate-500"
                data-testid="textarea-adminNotes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
              data-testid="button-cancel"
            >
              إلغاء
            </Button>
            <Button
              onClick={confirmAction}
              disabled={updateStatusMutation.isPending || (actionType === 'reject' && !adminNotes.trim())}
              className={actionType === 'approve' 
                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500" 
                : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500"}
              data-testid="button-confirm"
            >
              {updateStatusMutation.isPending ? "جاري الحفظ..." : "تأكيد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
