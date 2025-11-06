import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, Warehouse, Package, Bell, BellOff, ArrowRight } from "lucide-react";
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
    queryKey: ["/api/warehouse-transfers", user?.id],
    enabled: !!user?.id,
    select: (data) => data.filter(t => t.status === 'pending' && t.technicianId === user?.id),
  });

  const acceptMutation = useMutation({
    mutationFn: async (transferId: string) => {
      return apiRequest("POST", `/api/warehouse-transfers/${transferId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers", user?.id] });
      queryClient.invalidateQueries({ queryKey: [`/api/technicians/${user?.id}`] });
      toast({
        title: "تم القبول",
        description: "تم قبول عملية النقل بنجاح",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ transferId, reason }: { transferId: string; reason: string }) => {
      return apiRequest("POST", `/api/warehouse-transfers/${transferId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers", user?.id] });
      setRejectDialogOpen(false);
      setRejectionReason("");
      toast({
        title: "تم الرفض",
        description: "تم رفض عملية النقل",
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

  const groupedTransfers = pendingTransfers?.reduce((acc, transfer) => {
    const key = `${transfer.warehouseId}-${transfer.createdAt}`;
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

  const transfers = groupedTransfers ? Object.values(groupedTransfers) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50" dir="rtl">
      <div className="relative overflow-hidden bg-gradient-to-r from-[#18B2B0] via-teal-500 to-cyan-500 shadow-2xl">
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
        
        <div className="container mx-auto px-6 py-12 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                <Bell className="h-12 w-12 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-black text-white drop-shadow-lg">
                  الإشعارات
                </h1>
                <p className="text-xl text-white/90 mt-2">
                  عمليات النقل المعلقة التي تحتاج موافقتك
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
                رجوع
              </Button>
            </Link>
          </div>
          
          {pendingTransfers && pendingTransfers.length > 0 && (
            <Badge className="bg-red-500 text-white text-lg px-4 py-2 mt-4" data-testid="badge-pending-count">
              {pendingTransfers.length} إشعار معلق
            </Badge>
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Card className="shadow-2xl border-0 overflow-hidden bg-white/80 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-[#18B2B0]/10 to-teal-50/50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl text-gray-900 flex items-center gap-3">
                  <Package className="h-8 w-8 text-[#18B2B0]" />
                  التحويلات المعلقة
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                  راجع وقم بالموافقة أو الرفض على عمليات النقل من المستودعات
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : transfers.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 mb-6">
                  <BellOff className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  لا توجد إشعارات
                </h3>
                <p className="text-lg text-gray-500">
                  لا توجد عمليات نقل معلقة في الوقت الحالي
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {transfers.map((transfer: any) => (
                  <motion.div
                    key={transfer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-[#18B2B0]/20 rounded-xl p-6 bg-gradient-to-br from-white to-teal-50/20 hover:shadow-lg transition-all"
                    data-testid={`notification-${transfer.id}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-[#18B2B0]/10 rounded-lg">
                          <Warehouse className="h-6 w-6 text-[#18B2B0]" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">
                            {transfer.warehouseName || "مستودع"}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {format(new Date(transfer.createdAt), "d MMMM yyyy - h:mm a", { locale: ar })}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <Clock className="h-3 w-3 mr-1" />
                        قيد الانتظار
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">الأصناف المنقولة:</p>
                      <div className="flex flex-wrap gap-2">
                        {transfer.items.map((item: any, idx: number) => (
                          <Badge 
                            key={idx} 
                            className="bg-[#18B2B0]/10 text-[#18B2B0] border-[#18B2B0]/20 text-base px-3 py-1"
                            data-testid={`item-${transfer.id}-${idx}`}
                          >
                            {item.itemNameAr}: {item.quantity} {item.packagingType === 'box' ? 'كرتون' : 'وحدة'}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {transfer.notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-semibold text-gray-700 mb-1">ملاحظات:</p>
                        <p className="text-sm text-gray-600">{transfer.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={() => acceptMutation.mutate(transfer.id)}
                        disabled={acceptMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
                        data-testid={`button-accept-${transfer.id}`}
                      >
                        <CheckCircle className="h-5 w-5 ml-2" />
                        {acceptMutation.isPending ? "جاري القبول..." : "قبول"}
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedTransferId(transfer.id);
                          setRejectDialogOpen(true);
                        }}
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        data-testid={`button-reject-${transfer.id}`}
                      >
                        <XCircle className="h-5 w-5 ml-2" />
                        رفض
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl">رفض عملية النقل</DialogTitle>
            <DialogDescription className="text-lg">
              يرجى إدخال سبب الرفض
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="أدخل سبب الرفض..."
            className="min-h-[100px] text-lg"
            data-testid="input-rejection-reason"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
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
              {rejectMutation.isPending ? "جاري الرفض..." : "رفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
