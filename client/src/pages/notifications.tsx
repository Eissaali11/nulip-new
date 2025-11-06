import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, Warehouse, Package, Bell, BellOff, ArrowRight, Info, Calendar, Hash } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface WarehouseTransfer {
  id: string;
  warehouseId: string;
  technicianId: string;
  itemType: string;
  packagingType: string;
  quantity: number;
  performedBy: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  respondedAt?: Date;
  createdAt: Date;
  warehouseName?: string;
  technicianName?: string;
  performedByName?: string;
  itemNameAr?: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<WarehouseTransfer | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: pendingTransfers, isLoading } = useQuery<WarehouseTransfer[]>({
    queryKey: user?.id ? [`/api/warehouse-transfers`] : [],
    enabled: !!user?.id,
    select: (data) => data.filter(t => t.status === 'pending' && t.technicianId === user?.id),
  });

  const acceptMutation = useMutation({
    mutationFn: async (transferId: string) => {
      return apiRequest("POST", `/api/warehouse-transfers/${transferId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      queryClient.invalidateQueries({ queryKey: [`/api/technicians/${user?.id}`] });
      setDetailsDialogOpen(false);
      toast({
        title: "✅ تم القبول",
        description: "تم قبول عملية النقل بنجاح وإضافتها إلى مخزونك المتحرك",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل قبول عملية النقل",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ transferId, reason }: { transferId: string; reason: string }) => {
      return apiRequest("POST", `/api/warehouse-transfers/${transferId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      setRejectDialogOpen(false);
      setDetailsDialogOpen(false);
      setRejectionReason("");
      setSelectedTransfer(null);
      toast({
        title: "تم الرفض",
        description: "تم رفض عملية النقل",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل رفض عملية النقل",
        variant: "destructive",
      });
    },
  });

  const handleAccept = async (transferGroup: any) => {
    for (const item of transferGroup.items) {
      await acceptMutation.mutateAsync(item.id);
    }
  };

  const handleRejectClick = () => {
    setDetailsDialogOpen(false);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (selectedTransfer && rejectionReason.trim()) {
      for (const item of (selectedTransfer as any).items) {
        await rejectMutation.mutateAsync({ transferId: item.id, reason: rejectionReason });
      }
    }
  };

  const handleCardClick = (transferGroup: any) => {
    setSelectedTransfer(transferGroup);
    setDetailsDialogOpen(true);
  };

  const getItemNameAr = (itemType: string) => {
    const itemNames: Record<string, string> = {
      n950: "N950",
      i9000s: "I9000s",
      i9100: "I9100",
      rollPaper: "ورق",
      stickers: "ملصقات",
      newBatteries: "بطاريات جديدة",
      mobilySim: "شرائح موبايلي",
      stcSim: "شرائح STC",
      zainSim: "شرائح زين",
    };
    return itemNames[itemType] || itemType;
  };

  const getItemIcon = (itemType: string) => {
    return <Package className="h-5 w-5" />;
  };

  // Group transfers by warehouse and creation time
  const groupedTransfers = pendingTransfers?.reduce((acc, transfer) => {
    const key = `${transfer.warehouseId}-${new Date(transfer.createdAt).getTime()}`;
    if (!acc[key]) {
      acc[key] = {
        id: transfer.id,
        warehouseId: transfer.warehouseId,
        warehouseName: transfer.warehouseName,
        createdAt: transfer.createdAt,
        notes: transfer.notes,
        items: [],
      };
    }
    acc[key].items.push({
      id: transfer.id,
      itemType: transfer.itemType,
      itemNameAr: getItemNameAr(transfer.itemType),
      packagingType: transfer.packagingType,
      quantity: transfer.quantity,
    });
    return acc;
  }, {} as Record<string, any>);

  const groupedTransfersList = groupedTransfers ? Object.values(groupedTransfers) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-50" dir="rtl">
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/5"></div>
        
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <motion.div 
                className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg"
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Bell className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl sm:text-5xl font-black text-white drop-shadow-lg">
                  الإشعارات
                </h1>
                <p className="text-base sm:text-xl text-white/90 mt-1 sm:mt-2">
                  طلبات النقل التي تحتاج موافقتك
                </p>
              </div>
            </div>
            <Link href="/">
              <Button 
                variant="outline" 
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 shadow-lg"
                data-testid="button-back-home"
              >
                <ArrowRight className="h-5 w-5 ml-2" />
                رجوع للرئيسية
              </Button>
            </Link>
          </div>
          
          {groupedTransfersList && groupedTransfersList.length > 0 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Badge className="bg-white text-orange-600 text-base sm:text-lg px-4 py-2 mt-2 sm:mt-4 shadow-lg" data-testid="badge-pending-count">
                <Bell className="h-4 w-4 mr-2" />
                {groupedTransfersList.length} طلب معلق
              </Badge>
            </motion.div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : !groupedTransfersList || groupedTransfersList.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-20"
          >
            <Card className="max-w-md mx-auto border-2 border-gray-200 shadow-xl">
              <CardContent className="pt-12 pb-12">
                <motion.div 
                  className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 mb-6"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <BellOff className="h-12 w-12 text-gray-400" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  لا توجد طلبات معلقة
                </h3>
                <p className="text-lg text-gray-500">
                  ستظهر هنا طلبات النقل التي تحتاج موافقتك
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {groupedTransfersList.map((transferGroup: any, index: number) => (
                <motion.div
                  key={transferGroup.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  onClick={() => handleCardClick(transferGroup)}
                  className="cursor-pointer"
                  data-testid={`card-transfer-${transferGroup.id}`}
                >
                  <Card className="h-full border-2 border-orange-200 hover:border-orange-400 hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-orange-50/30 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500"></div>
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-orange-100 rounded-xl">
                            <Warehouse className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold text-gray-900">
                              {transferGroup.warehouseName || "مستودع"}
                            </CardTitle>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(transferGroup.createdAt), "d MMMM yyyy", { locale: ar })}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                          <Clock className="h-3 w-3 mr-1" />
                          معلق
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        {transferGroup.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-[#18B2B0]/10 to-teal-50 rounded-xl border border-[#18B2B0]/20">
                            <div className="flex items-center gap-2">
                              {getItemIcon(item.itemType)}
                              <span className="font-semibold text-gray-900">
                                {item.itemNameAr}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold">
                                {item.quantity}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                {item.packagingType === 'box' ? 'كرتون' : 'وحدة'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {transferGroup.notes && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            ملاحظات:
                          </p>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {transferGroup.notes}
                          </p>
                        </div>
                      )}

                      <div className="pt-2">
                        <Button
                          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-md"
                          data-testid={`button-view-details-${transferGroup.id}`}
                        >
                          <Info className="h-4 w-4 ml-2" />
                          عرض التفاصيل
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
          {selectedTransfer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-3xl flex items-center gap-3 text-gray-900">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                  تفاصيل طلب النقل
                </DialogTitle>
                <DialogDescription className="text-base text-gray-600">
                  راجع تفاصيل الطلب وقم بالموافقة أو الرفض
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-6">
                {/* Warehouse Info */}
                <div className="p-5 bg-gradient-to-r from-[#18B2B0]/10 to-teal-50 rounded-2xl border-2 border-[#18B2B0]/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Warehouse className="h-6 w-6 text-[#18B2B0]" />
                    <h3 className="text-xl font-bold text-gray-900">المستودع</h3>
                  </div>
                  <p className="text-2xl font-bold text-[#18B2B0]">
                    {(selectedTransfer as any).warehouseName || "غير محدد"}
                  </p>
                </div>

                <Separator />

                {/* Item Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-600" />
                    الأصناف المطلوبة ({(selectedTransfer as any).items?.length || 0})
                  </h3>
                  
                  <div className="space-y-3">
                    {(selectedTransfer as any).items?.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg">
                              <Package className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xl font-bold text-gray-900">{item.itemNameAr}</p>
                              <p className="text-sm text-gray-600">
                                {item.packagingType === 'box' ? 'كرتونة' : 'وحدة'}
                              </p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="text-sm text-gray-600">الكمية</p>
                            <p className="text-3xl font-black text-green-700">{item.quantity}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Date & Time */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-bold text-gray-900">تاريخ الطلب</h3>
                  </div>
                  <p className="text-lg text-gray-700">
                    {format(new Date((selectedTransfer as any).createdAt), "EEEE، d MMMM yyyy - الساعة h:mm a", { locale: ar })}
                  </p>
                </div>

                {/* Notes */}
                {(selectedTransfer as any).notes && (
                  <>
                    <Separator />
                    <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-5 w-5 text-amber-600" />
                        <h3 className="text-lg font-bold text-gray-900">ملاحظات</h3>
                      </div>
                      <p className="text-base text-gray-700 leading-relaxed">
                        {(selectedTransfer as any).notes}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <DialogFooter className="gap-3 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDetailsDialogOpen(false)}
                  className="flex-1"
                  data-testid="button-cancel-details"
                >
                  إلغاء
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRejectClick}
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  data-testid={`button-reject-details-${(selectedTransfer as any).id}`}
                >
                  <XCircle className="h-5 w-5 ml-2" />
                  رفض
                </Button>
                <Button
                  onClick={() => handleAccept(selectedTransfer)}
                  disabled={acceptMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
                  data-testid={`button-accept-details-${(selectedTransfer as any).id}`}
                >
                  <CheckCircle className="h-5 w-5 ml-2" />
                  {acceptMutation.isPending ? "جاري القبول..." : "قبول"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              رفض طلب النقل
            </DialogTitle>
            <DialogDescription className="text-lg">
              يرجى إدخال سبب رفض هذا الطلب
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="مثال: الكمية غير متوفرة، أو التوقيت غير مناسب..."
              className="min-h-[150px] text-base resize-none"
              data-testid="input-rejection-reason"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
                setDetailsDialogOpen(true);
              }}
              data-testid="button-cancel-reject"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmReject}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? "جاري الرفض..." : "تأكيد الرفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
