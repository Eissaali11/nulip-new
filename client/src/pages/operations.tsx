import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, Package, User, Warehouse, TrendingUp, AlertCircle, Activity } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@assets/5fd20532dbfff_cropped-RASSAUDI-Logo_1762460814438.png";

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

export default function OperationsPage() {
  const { toast } = useToast();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: transfers, isLoading } = useQuery<WarehouseTransfer[]>({
    queryKey: ["/api/warehouse-transfers"],
  });

  const acceptMutation = useMutation({
    mutationFn: async (transferId: string) => {
      return apiRequest("POST", `/api/warehouse-transfers/${transferId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      toast({
        title: "تم القبول",
        description: "تم قبول عملية النقل بنجاح",
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
    mutationFn: async ({ transferId, reason }: { transferId: string; reason?: string }) => {
      return apiRequest("POST", `/api/warehouse-transfers/${transferId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      setRejectDialogOpen(false);
      setSelectedTransferId(null);
      setRejectionReason("");
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

  const handleReject = (transferId: string) => {
    setSelectedTransferId(transferId);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (selectedTransferId) {
      rejectMutation.mutate({ transferId: selectedTransferId, reason: rejectionReason });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200" data-testid="badge-status-pending">
            <Clock className="h-3 w-3 mr-1" />
            قيد الانتظار
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200" data-testid="badge-status-accepted">
            <CheckCircle className="h-3 w-3 mr-1" />
            مقبول
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200" data-testid="badge-status-rejected">
            <XCircle className="h-3 w-3 mr-1" />
            مرفوض
          </Badge>
        );
      default:
        return null;
    }
  };

  const pendingTransfers = transfers?.filter(t => t.status === 'pending') || [];
  const processedTransfers = transfers?.filter(t => t.status !== 'pending') || [];
  const acceptedCount = transfers?.filter(t => t.status === 'accepted').length || 0;
  const rejectedCount = transfers?.filter(t => t.status === 'rejected').length || 0;
  const totalTransfers = transfers?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50" dir="rtl">
      {/* Animated Logo Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#18B2B0] via-teal-500 to-[#18B2B0] shadow-2xl">
        <div className="absolute inset-0 bg-black/5"></div>
        
        {/* Animated logos - Right to Left */}
        <div className="flex gap-16 py-8 animate-[scroll-rtl_30s_linear_infinite] whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <img
              key={`rtl-${i}`}
              src={logoPath}
              alt="RAS Saudi Logo"
              className="h-16 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
            />
          ))}
        </div>

        {/* Animated logos - Left to Right (reversed) */}
        <div className="flex gap-16 py-8 animate-[scroll-ltr_25s_linear_infinite] whitespace-nowrap border-t border-white/10">
          {[...Array(10)].map((_, i) => (
            <img
              key={`ltr-${i}`}
              src={logoPath}
              alt="RAS Saudi Logo"
              className="h-16 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
            />
          ))}
        </div>

        {/* Overlay gradient for smooth edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#18B2B0] to-transparent pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#18B2B0] to-transparent pointer-events-none"></div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#18B2B0]/20">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#18B2B0] via-teal-600 to-cyan-600 bg-clip-text text-transparent" data-testid="text-page-title">
            إدارة العمليات
          </h1>
          <p className="text-gray-600 mt-2 text-lg" data-testid="text-page-description">
            متابعة وإدارة عمليات النقل من المستودعات إلى الفنيين
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Transfers Card */}
          <Card className="relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0] via-teal-500 to-cyan-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="text-right text-white">
                  <p className="text-sm font-medium opacity-90 mb-1">إجمالي العمليات</p>
                  <p className="text-4xl font-bold" data-testid="stat-total-transfers">{totalTransfers}</p>
                  <p className="text-xs opacity-75 mt-2">عملية نقل</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                  <Activity className="h-10 w-10 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Transfers Card */}
          <Card className="relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="text-right text-white">
                  <p className="text-sm font-medium opacity-90 mb-1">قيد الانتظار</p>
                  <p className="text-4xl font-bold" data-testid="stat-pending-transfers">{pendingTransfers.length}</p>
                  <p className="text-xs opacity-75 mt-2">تحتاج موافقة</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                  <Clock className="h-10 w-10 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accepted Transfers Card */}
          <Card className="relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="text-right text-white">
                  <p className="text-sm font-medium opacity-90 mb-1">العمليات المقبولة</p>
                  <p className="text-4xl font-bold" data-testid="stat-accepted-transfers">{acceptedCount}</p>
                  <p className="text-xs opacity-75 mt-2">تمت الموافقة</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rejected Transfers Card */}
          <Card className="relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="text-right text-white">
                  <p className="text-sm font-medium opacity-90 mb-1">العمليات المرفوضة</p>
                  <p className="text-4xl font-bold" data-testid="stat-rejected-transfers">{rejectedCount}</p>
                  <p className="text-xs opacity-75 mt-2">تم رفضها</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                  <XCircle className="h-10 w-10 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Transfers Table */}
        <Card className="shadow-xl border-[#18B2B0]/20 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-amber-500/10 via-yellow-50/50 to-orange-50/50 border-b border-[#18B2B0]/10">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-[#18B2B0]">عمليات النقل المعلقة</div>
                <div className="text-sm text-gray-500 font-normal mt-1">
                  {pendingTransfers.length} عملية تحتاج إلى موافقة
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#18B2B0]"></div>
                <p className="text-gray-500 mt-4">جارٍ التحميل...</p>
              </div>
            ) : pendingTransfers.length === 0 ? (
              <div className="text-center py-12" data-testid="text-no-pending">
                <AlertCircle className="h-16 w-16 text-[#18B2B0]/30 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">لا توجد عمليات نقل معلقة</p>
                <p className="text-gray-400 text-sm mt-2">جميع العمليات تمت معالجتها</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#18B2B0]/20 bg-[#18B2B0]/5">
                      <TableHead className="text-right font-bold text-[#18B2B0]">المستودع</TableHead>
                      <TableHead className="text-right font-bold text-[#18B2B0]">الفني</TableHead>
                      <TableHead className="text-right font-bold text-[#18B2B0]">الصنف</TableHead>
                      <TableHead className="text-right font-bold text-[#18B2B0]">النوع</TableHead>
                      <TableHead className="text-right font-bold text-[#18B2B0]">الكمية</TableHead>
                      <TableHead className="text-right font-bold text-[#18B2B0]">التاريخ</TableHead>
                      <TableHead className="text-right font-bold text-[#18B2B0]">الحالة</TableHead>
                      <TableHead className="text-right font-bold text-[#18B2B0]">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTransfers.map((transfer) => (
                      <TableRow key={transfer.id} data-testid={`row-transfer-${transfer.id}`} className="hover:bg-[#18B2B0]/5 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="bg-[#18B2B0]/10 p-2 rounded-lg">
                              <Warehouse className="h-4 w-4 text-[#18B2B0]" />
                            </div>
                            <span className="font-medium" data-testid={`text-warehouse-${transfer.id}`}>{transfer.warehouseName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-50 p-2 rounded-lg">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <span data-testid={`text-technician-${transfer.id}`}>{transfer.technicianName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`text-item-${transfer.id}`}>{transfer.itemNameAr}</TableCell>
                        <TableCell data-testid={`text-packaging-${transfer.id}`}>
                          <Badge variant="outline" className="border-[#18B2B0]/30">
                            {transfer.packagingType === 'box' ? 'كرتونة' : 'قطعة'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-[#18B2B0]" />
                            <span className="font-bold text-[#18B2B0]" data-testid={`text-quantity-${transfer.id}`}>{transfer.quantity}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600" data-testid={`text-date-${transfer.id}`}>
                          {format(new Date(transfer.createdAt), "dd MMM yyyy, HH:mm", { locale: ar })}
                        </TableCell>
                        <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
                              onClick={() => acceptMutation.mutate(transfer.id)}
                              disabled={acceptMutation.isPending}
                              data-testid={`button-accept-${transfer.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              قبول
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="shadow-md"
                              onClick={() => handleReject(transfer.id)}
                              disabled={rejectMutation.isPending}
                              data-testid={`button-reject-${transfer.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              رفض
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processed Transfers Table */}
        <Card className="shadow-xl border-[#18B2B0]/20 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-[#18B2B0]/10 to-teal-50/50 border-b border-[#18B2B0]/10">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="bg-gradient-to-br from-[#18B2B0] to-teal-600 p-3 rounded-xl shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-[#18B2B0]">سجل العمليات المعالجة</div>
                <div className="text-sm text-gray-500 font-normal mt-1">
                  {processedTransfers.length} عملية مقبولة أو مرفوضة
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#18B2B0]"></div>
                <p className="text-gray-500 mt-4">جارٍ التحميل...</p>
              </div>
            ) : processedTransfers.length === 0 ? (
              <div className="text-center py-12" data-testid="text-no-processed">
                <Activity className="h-16 w-16 text-[#18B2B0]/30 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">لا توجد عمليات معالجة</p>
                <p className="text-gray-400 text-sm mt-2">سيتم عرض العمليات المعالجة هنا</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#18B2B0]/20 bg-[#18B2B0]/5">
                      <TableHead className="text-right font-bold text-[#18B2B0]">المستودع</TableHead>
                      <TableHead className="text-right font-bold text-[#18B2B0]">الفني</TableHead>
                      <TableHead className="text-right font-bold text-[#18B2B0]">الصنف</TableHead>
                      <TableHead className="text-right font-bold text-[#18B2B0]">النوع</TableHead>
                      <TableHead className="text-right font-bold text-[#18B2B0]">الكمية</TableHead>
                      <TableHead className="text-right font-bold text-[#18B2B0]">تاريخ الطلب</TableHead>
                      <TableHead className="text-right font-bold text-[#18B2B0]">تاريخ المعالجة</TableHead>
                      <TableHead className="text-right font-bold text-[#18B2B0]">الحالة</TableHead>
                      <TableHead className="text-right font-bold text-[#18B2B0]">سبب الرفض</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedTransfers.map((transfer) => (
                      <TableRow key={transfer.id} data-testid={`row-processed-${transfer.id}`} className="hover:bg-[#18B2B0]/5 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="bg-[#18B2B0]/10 p-2 rounded-lg">
                              <Warehouse className="h-4 w-4 text-[#18B2B0]" />
                            </div>
                            <span className="font-medium">{transfer.warehouseName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-50 p-2 rounded-lg">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <span>{transfer.technicianName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{transfer.itemNameAr}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-[#18B2B0]/30">
                            {transfer.packagingType === 'box' ? 'كرتونة' : 'قطعة'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-[#18B2B0]" />
                            <span className="font-bold text-[#18B2B0]">{transfer.quantity}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {format(new Date(transfer.createdAt), "dd MMM yyyy, HH:mm", { locale: ar })}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {transfer.respondedAt ? format(new Date(transfer.respondedAt), "dd MMM yyyy, HH:mm", { locale: ar }) : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                        <TableCell className="text-sm text-gray-600" data-testid={`text-rejection-reason-${transfer.id}`}>
                          {transfer.rejectionReason || (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="border-red-200">
          <DialogHeader>
            <DialogTitle className="text-2xl text-red-600 flex items-center gap-2">
              <XCircle className="h-6 w-6" />
              رفض عملية النقل
            </DialogTitle>
            <DialogDescription className="text-base">
              يرجى إدخال سبب الرفض (اختياري) لتوضيح القرار للفني
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="مثال: الكمية المطلوبة غير متوفرة في المستودع حالياً..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[120px] border-red-200 focus:border-red-400"
            data-testid="textarea-rejection-reason"
          />
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              data-testid="button-cancel-reject"
              className="border-gray-300"
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
            >
              <XCircle className="h-4 w-4 ml-2" />
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
