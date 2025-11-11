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
  ChevronLeft,
  MapPin,
  AtSign,
  FileText,
  AlertCircle
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface InventoryRequest {
  id: string;
  technicianId: string;
  technicianName: string;
  technicianUsername?: string;
  technicianCity?: string;
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

interface Warehouse {
  id: string;
  name: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InventoryRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");

  const { data: requests = [], isLoading } = useQuery<InventoryRequest[]>({
    queryKey: ["/api/inventory-requests"],
    enabled: user?.role === 'admin',
  });

  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
    enabled: user?.role === 'admin',
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, warehouseId }: { id: string; warehouseId: string }) => {
      return await apiRequest("PATCH", `/api/inventory-requests/${id}/approve`, { warehouseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      setApproveDialogOpen(false);
      setSelectedRequest(null);
      setSelectedWarehouseId("");
      toast({
        title: "تم قبول الطلب بنجاح",
        description: "تم إنشاء طلبات النقل من المستودع",
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
        return (
          <Badge className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-300 border border-yellow-500/40 px-4 py-1.5 text-sm font-semibold shadow-lg shadow-yellow-500/20 animate-pulse">
            ⏳ قيد الانتظار
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border border-green-500/40 px-4 py-1.5 text-sm font-semibold shadow-lg shadow-green-500/20">
            ✓ مقبول
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-gradient-to-r from-red-500/30 to-rose-500/30 text-red-300 border border-red-500/40 px-4 py-1.5 text-sm font-semibold shadow-lg shadow-red-500/20">
            ✕ مرفوض
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleApproveClick = (request: InventoryRequest) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
  };

  const handleConfirmApprove = () => {
    if (!selectedWarehouseId) {
      toast({
        title: "خطأ",
        description: "يجب اختيار المستودع",
        variant: "destructive",
      });
      return;
    }

    if (selectedRequest) {
      approveMutation.mutate({ id: selectedRequest.id, warehouseId: selectedWarehouseId });
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
                whileHover={{ scale: 1.01 }}
              >
                <Card className="relative bg-gradient-to-br from-white/10 via-white/[0.07] to-white/[0.03] backdrop-blur-xl border-[#18B2B0]/30 overflow-hidden group hover:border-[#18B2B0]/50 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/10 via-transparent to-violet-500/5" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#18B2B0]/10 rounded-full blur-3xl group-hover:bg-[#18B2B0]/20 transition-all duration-500" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/20 transition-all duration-500" />
                  
                  <div className="relative p-6">
                    {/* Header with Avatar and Status */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="p-4 bg-gradient-to-br from-[#18B2B0] via-teal-500 to-[#18B2B0] rounded-2xl shadow-lg shadow-[#18B2B0]/20 group-hover:shadow-[#18B2B0]/40 transition-all duration-300">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-[#18B2B0] to-teal-400 rounded-full border-2 border-[#0f0f15]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#18B2B0] transition-colors duration-300">
                            {request.technicianName}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {request.technicianUsername && (
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <AtSign className="h-3.5 w-3.5 text-[#18B2B0]" />
                                <span>@{request.technicianUsername}</span>
                              </div>
                            )}
                            {request.technicianCity && (
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <MapPin className="h-3.5 w-3.5 text-violet-400" />
                                <span>{request.technicianCity}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                            <Calendar className="h-3.5 w-3.5" />
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

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-5" />

                    {/* Items Requested */}
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-[#18B2B0]/10 rounded-lg">
                          <Package className="h-4 w-4 text-[#18B2B0]" />
                        </div>
                        <span className="text-sm font-semibold text-white">الأصناف المطلوبة</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {getRequestedItems(request).map((item, idx) => (
                          <Badge 
                            key={idx}
                            className="bg-gradient-to-r from-[#18B2B0]/20 to-teal-500/20 text-[#18B2B0] border border-[#18B2B0]/30 hover:from-[#18B2B0]/30 hover:to-teal-500/30 transition-all duration-300 px-3 py-1.5 text-xs font-medium shadow-sm"
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    {request.notes && (
                      <div className="mb-5 p-4 bg-gradient-to-br from-white/10 to-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-[#18B2B0] mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-gray-400 mb-1">ملاحظات الفني</p>
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {request.notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Admin Notes (if rejected) */}
                    {request.status === 'rejected' && request.adminNotes && (
                      <div className="mb-5 p-4 bg-gradient-to-br from-red-500/20 to-red-500/10 rounded-xl border border-red-500/30 hover:border-red-500/40 transition-all duration-300">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-red-400 mb-1">سبب الرفض</p>
                            <p className="text-sm text-red-300 leading-relaxed">
                              {request.adminNotes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {request.status === 'pending' && (
                      <div className="flex gap-3 mt-5">
                        <Button
                          onClick={() => handleApproveClick(request)}
                          disabled={approveMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-green-500 via-green-600 to-green-500 hover:from-green-600 hover:via-green-700 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all duration-300 h-11"
                          data-testid={`button-approve-${request.id}`}
                        >
                          <Check className="h-4 w-4 ml-2" />
                          قبول الطلب
                        </Button>
                        <Button
                          onClick={() => handleRejectClick(request)}
                          disabled={rejectMutation.isPending}
                          variant="outline"
                          className="flex-1 bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 font-semibold shadow-lg shadow-red-500/10 hover:shadow-red-500/20 transition-all duration-300 h-11"
                          data-testid={`button-reject-${request.id}`}
                        >
                          <X className="h-4 w-4 ml-2" />
                          رفض الطلب
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

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#0f0f15] border-[#18B2B0]/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">قبول الطلب</DialogTitle>
            <DialogDescription className="text-gray-400">
              اختر المستودع الذي سيتم السحب منه
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedRequest && (
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-sm text-gray-400 mb-1">الفني:</p>
                <p className="text-white font-bold">{selectedRequest.technicianName}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-white">المستودع</Label>
              <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="اختر المستودع" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0f15] border-[#18B2B0]/20">
                  {warehouses.map((warehouse) => (
                    <SelectItem 
                      key={warehouse.id} 
                      value={warehouse.id}
                      className="text-white hover:bg-white/10"
                    >
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setApproveDialogOpen(false);
                setSelectedWarehouseId("");
              }}
              className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmApprove}
              disabled={!selectedWarehouseId || approveMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              data-testid="button-confirm-approve"
            >
              تأكيد القبول
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
