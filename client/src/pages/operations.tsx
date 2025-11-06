import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, Package, User, Warehouse } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#18B2B0]" data-testid="text-page-title">العمليات</h1>
        <p className="text-muted-foreground mt-2" data-testid="text-page-description">
          إدارة عمليات النقل من المستودعات
        </p>
      </div>

      <Card className="border-[#18B2B0]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            عمليات النقل المعلقة ({pendingTransfers.length})
          </CardTitle>
          <CardDescription>عمليات النقل التي تحتاج إلى موافقة</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>
          ) : pendingTransfers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-pending">
              لا توجد عمليات نقل معلقة
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المستودع</TableHead>
                    <TableHead className="text-right">الفني</TableHead>
                    <TableHead className="text-right">الصنف</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTransfers.map((transfer) => (
                    <TableRow key={transfer.id} data-testid={`row-transfer-${transfer.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-[#18B2B0]" />
                          <span data-testid={`text-warehouse-${transfer.id}`}>{transfer.warehouseName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span data-testid={`text-technician-${transfer.id}`}>{transfer.technicianName}</span>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-item-${transfer.id}`}>{transfer.itemNameAr}</TableCell>
                      <TableCell data-testid={`text-packaging-${transfer.id}`}>
                        {transfer.packagingType === 'box' ? 'كرتونة' : 'قطعة'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold" data-testid={`text-quantity-${transfer.id}`}>{transfer.quantity}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500" data-testid={`text-date-${transfer.id}`}>
                        {format(new Date(transfer.createdAt), "dd MMM yyyy, HH:mm", { locale: ar })}
                      </TableCell>
                      <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
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

      <Card className="border-[#18B2B0]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[#18B2B0]" />
            سجل العمليات ({processedTransfers.length})
          </CardTitle>
          <CardDescription>عمليات النقل المقبولة والمرفوضة</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>
          ) : processedTransfers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-processed">
              لا توجد عمليات معالجة
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المستودع</TableHead>
                    <TableHead className="text-right">الفني</TableHead>
                    <TableHead className="text-right">الصنف</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">تاريخ الطلب</TableHead>
                    <TableHead className="text-right">تاريخ المعالجة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">سبب الرفض</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedTransfers.map((transfer) => (
                    <TableRow key={transfer.id} data-testid={`row-processed-${transfer.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-[#18B2B0]" />
                          <span>{transfer.warehouseName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>{transfer.technicianName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{transfer.itemNameAr}</TableCell>
                      <TableCell>
                        {transfer.packagingType === 'box' ? 'كرتونة' : 'قطعة'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold">{transfer.quantity}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {format(new Date(transfer.createdAt), "dd MMM yyyy, HH:mm", { locale: ar })}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {transfer.respondedAt ? format(new Date(transfer.respondedAt), "dd MMM yyyy, HH:mm", { locale: ar }) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                      <TableCell className="text-sm text-gray-500" data-testid={`text-rejection-reason-${transfer.id}`}>
                        {transfer.rejectionReason || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض عملية النقل</DialogTitle>
            <DialogDescription>
              يرجى إدخال سبب الرفض (اختياري)
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="سبب الرفض..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
            data-testid="textarea-rejection-reason"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              data-testid="button-cancel-reject"
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
