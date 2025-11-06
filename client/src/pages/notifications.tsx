import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, Warehouse, Package, Bell, BellOff, ArrowRight, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
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
      toast({
        title: "تم القبول",
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
      setRejectionReason("");
      setSelectedTransferId(null);
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

  const handleReject = () => {
    if (selectedTransferId && rejectionReason.trim()) {
      rejectMutation.mutate({ transferId: selectedTransferId, reason: rejectionReason });
    }
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
          
          {pendingTransfers && pendingTransfers.length > 0 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Badge className="bg-white text-orange-600 text-base sm:text-lg px-4 py-2 mt-2 sm:mt-4 shadow-lg" data-testid="badge-pending-count">
                <Bell className="h-4 w-4 mr-2" />
                {pendingTransfers.length} طلب معلق
              </Badge>
            </motion.div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-2xl border-2 border-orange-100 overflow-hidden bg-white">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl sm:text-3xl text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-xl">
                      <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                    </div>
                    طلبات النقل المعلقة
                  </CardTitle>
                  <CardDescription className="text-base sm:text-lg mt-2">
                    راجع وقم بالموافقة أو الرفض على طلبات النقل من المستودعات
                  </CardDescription>
                </div>
                {pendingTransfers && pendingTransfers.length > 0 && (
                  <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-lg px-4 py-2">
                    {pendingTransfers.length} طلب
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-4 sm:p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : !pendingTransfers || pendingTransfers.length === 0 ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-16"
                >
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
                </motion.div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-orange-50/50">
                        <TableHead className="text-right font-bold text-gray-700">المستودع</TableHead>
                        <TableHead className="text-right font-bold text-gray-700">الصنف</TableHead>
                        <TableHead className="text-right font-bold text-gray-700">النوع</TableHead>
                        <TableHead className="text-right font-bold text-gray-700">الكمية</TableHead>
                        <TableHead className="text-right font-bold text-gray-700">التاريخ</TableHead>
                        <TableHead className="text-right font-bold text-gray-700">ملاحظات</TableHead>
                        <TableHead className="text-right font-bold text-gray-700">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingTransfers.map((transfer, index) => (
                        <motion.tr
                          key={transfer.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-orange-50/30 transition-colors"
                          data-testid={`row-transfer-${transfer.id}`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-orange-100 rounded-lg">
                                <Warehouse className="h-4 w-4 text-orange-600" />
                              </div>
                              <span className="font-semibold text-gray-900" data-testid={`text-warehouse-${transfer.id}`}>
                                {transfer.warehouseName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-[#18B2B0]/10 text-[#18B2B0] border-[#18B2B0]/20" data-testid={`text-item-${transfer.id}`}>
                              {getItemNameAr(transfer.itemType)}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-packaging-${transfer.id}`}>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {transfer.packagingType === 'box' ? 'كرتونة' : 'قطعة'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className="font-bold text-lg text-gray-900" data-testid={`text-quantity-${transfer.id}`}>
                                {transfer.quantity}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600" data-testid={`text-date-${transfer.id}`}>
                            {format(new Date(transfer.createdAt), "dd MMM yyyy", { locale: ar })}
                            <br />
                            <span className="text-xs text-gray-500">
                              {format(new Date(transfer.createdAt), "HH:mm", { locale: ar })}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            {transfer.notes ? (
                              <p className="text-sm text-gray-600 truncate" title={transfer.notes} data-testid={`text-notes-${transfer.id}`}>
                                {transfer.notes}
                              </p>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => acceptMutation.mutate(transfer.id)}
                                disabled={acceptMutation.isPending}
                                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
                                data-testid={`button-accept-${transfer.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {acceptMutation.isPending ? "جاري..." : "قبول"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedTransferId(transfer.id);
                                  setRejectDialogOpen(true);
                                }}
                                disabled={rejectMutation.isPending}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                                data-testid={`button-reject-${transfer.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                رفض
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-600" />
              رفض طلب النقل
            </DialogTitle>
            <DialogDescription className="text-lg">
              يرجى إدخال سبب رفض هذا الطلب
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="مثال: الكمية غير متوفرة، أو التوقيت غير مناسب..."
            className="min-h-[120px] text-base"
            data-testid="input-rejection-reason"
          />
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
                setSelectedTransferId(null);
              }}
              data-testid="button-cancel-reject"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleReject}
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
