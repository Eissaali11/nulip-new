import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { 
  Bell, 
  Check, 
  X, 
  Package, 
  User, 
  Calendar,
  ChevronLeft
} from "lucide-react";
import { GridBackground } from "@/components/dashboard/GridBackground";
import { Navbar } from "@/components/dashboard/Navbar";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface InventoryRequest {
  id: string;
  technicianId: string;
  technicianName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  notes?: string;
  adminNotes?: string;
  n950Boxes: number;
  n950Units: number;
  i9000sBoxes: number;
  i9000sUnits: number;
  i9100Boxes: number;
  i9100Units: number;
  rollPaperBoxes: number;
  rollPaperUnits: number;
  stickersBoxes: number;
  stickersUnits: number;
  newBatteriesBoxes: number;
  newBatteriesUnits: number;
  mobilySimBoxes: number;
  mobilySimUnits: number;
  stcSimBoxes: number;
  stcSimUnits: number;
  zainSimBoxes: number;
  zainSimUnits: number;
}

export default function Notifications() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InventoryRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: requests = [], isLoading } = useQuery<InventoryRequest[]>({
    queryKey: ["/api/inventory-requests"],
    enabled: user?.role === 'admin',
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/inventory-requests/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-requests"] });
      toast({
        title: "تم قبول الطلب بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في قبول الطلب",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes: string }) => {
      return await apiRequest("PATCH", `/api/inventory-requests/${id}/reject`, { adminNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-requests"] });
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes("");
      toast({
        title: "تم رفض الطلب بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في رفض الطلب",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (user?.role !== 'admin') {
    setLocation('/');
    return null;
  }

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const getRequestedItems = (request: InventoryRequest) => {
    const items: string[] = [];
    const fields = [
      { name: "N950", boxes: request.n950Boxes, units: request.n950Units },
      { name: "I9000S", boxes: request.i9000sBoxes, units: request.i9000sUnits },
      { name: "I9100", boxes: request.i9100Boxes, units: request.i9100Units },
      { name: "ورق الطباعة", boxes: request.rollPaperBoxes, units: request.rollPaperUnits },
      { name: "الملصقات", boxes: request.stickersBoxes, units: request.stickersUnits },
      { name: "البطاريات", boxes: request.newBatteriesBoxes, units: request.newBatteriesUnits },
      { name: "موبايلي", boxes: request.mobilySimBoxes, units: request.mobilySimUnits },
      { name: "STC", boxes: request.stcSimBoxes, units: request.stcSimUnits },
      { name: "زين", boxes: request.zainSimBoxes, units: request.zainSimUnits },
    ];

    fields.forEach(field => {
      if (field.boxes > 0 || field.units > 0) {
        const parts: string[] = [];
        if (field.boxes > 0) parts.push(`${field.boxes} كرتون`);
        if (field.units > 0) parts.push(`${field.units} قطعة`);
        items.push(`${field.name}: ${parts.join(' + ')}`);
      }
    });

    return items;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">قيد الانتظار</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">مقبول</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">مرفوض</Badge>;
      default:
        return null;
    }
  };

  const handleRejectClick = (request: InventoryRequest) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (!adminNotes.trim()) {
      toast({
        title: "خطأ",
        description: "يجب إدخال سبب الرفض",
        variant: "destructive",
      });
      return;
    }

    if (selectedRequest) {
      rejectMutation.mutate({ id: selectedRequest.id, adminNotes });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f15] to-[#0a0a0f] text-white relative overflow-hidden">
      <GridBackground />

      {/* Top Header */}
      <div className="relative z-20 border-b border-[#18B2B0]/20 bg-black/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/')}
                className="hover:bg-[#18B2B0]/10"
                data-testid="button-back"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#18B2B0] to-[#0ea5a3] rounded-xl">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">الإشعارات</h1>
                  <p className="text-sm text-gray-400">طلبات المخزون من الفنيين</p>
                </div>
              </div>
            </div>
            {pendingCount > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 px-4 py-2">
                {pendingCount} طلب معلق
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Navbar */}
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'الكل', count: requests.length },
              { value: 'pending', label: 'قيد الانتظار', count: requests.filter(r => r.status === 'pending').length },
              { value: 'approved', label: 'مقبول', count: requests.filter(r => r.status === 'approved').length },
              { value: 'rejected', label: 'مرفوض', count: requests.filter(r => r.status === 'rejected').length },
            ].map((tab) => (
              <Button
                key={tab.value}
                onClick={() => setFilter(tab.value as any)}
                variant={filter === tab.value ? 'default' : 'outline'}
                className={filter === tab.value 
                  ? 'bg-gradient-to-r from-[#18B2B0] to-teal-500 text-white'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }
                data-testid={`button-filter-${tab.value}`}
              >
                {tab.label} ({tab.count})
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Requests List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#18B2B0]"></div>
            <p className="mt-4 text-gray-400">جاري تحميل الطلبات...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <Bell className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">لا توجد طلبات</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="relative bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl border-[#18B2B0]/30 p-6 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/10 to-transparent" />
                  
                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-[#18B2B0] to-teal-500 rounded-xl">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{request.technicianName}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {formatDistanceToNow(new Date(request.createdAt), { 
                                addSuffix: true, 
                                locale: ar 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    {/* Items Requested */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-[#18B2B0]" />
                        <span className="text-sm font-medium text-gray-300">الأصناف المطلوبة:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {getRequestedItems(request).map((item, idx) => (
                          <Badge 
                            key={idx}
                            className="bg-[#18B2B0]/10 text-[#18B2B0] border-[#18B2B0]/20"
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    {request.notes && (
                      <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-sm text-gray-300">
                          <span className="font-medium text-white">ملاحظات الفني: </span>
                          {request.notes}
                        </p>
                      </div>
                    )}

                    {/* Admin Notes (if rejected) */}
                    {request.status === 'rejected' && request.adminNotes && (
                      <div className="mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <p className="text-sm text-red-300">
                          <span className="font-medium text-red-400">سبب الرفض: </span>
                          {request.adminNotes}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {request.status === 'pending' && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => approveMutation.mutate(request.id)}
                          disabled={approveMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                          data-testid={`button-approve-${request.id}`}
                        >
                          <Check className="h-4 w-4 ml-2" />
                          قبول
                        </Button>
                        <Button
                          onClick={() => handleRejectClick(request)}
                          disabled={rejectMutation.isPending}
                          variant="outline"
                          className="flex-1 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                          data-testid={`button-reject-${request.id}`}
                        >
                          <X className="h-4 w-4 ml-2" />
                          رفض
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#0f0f15] border-[#18B2B0]/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">رفض الطلب</DialogTitle>
            <DialogDescription className="text-gray-400">
              يرجى إدخال سبب رفض الطلب
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="اكتب سبب الرفض هنا..."
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[100px]"
              data-testid="textarea-admin-notes"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setAdminNotes("");
              }}
              className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmReject}
              disabled={!adminNotes.trim() || rejectMutation.isPending}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
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
