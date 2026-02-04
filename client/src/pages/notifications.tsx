import { useState, useMemo } from "react";
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
  MapPin,
  AtSign,
  FileText,
  AlertCircle,
  Warehouse,
  TrendingUp,
  CheckSquare,
  Square,
  Smartphone,
  ArrowRight
} from "lucide-react";
import { GridBackground } from "@/components/dashboard/GridBackground";
import { Navbar } from "@/components/dashboard/Navbar";
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
import { hasRoleOrAbove, ROLES } from "@shared/roles";
import { useActiveItemTypes, getInventoryValueForItemType, legacyFieldMapping, InventoryEntry } from "@/hooks/use-item-types";

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
  entries?: InventoryEntry[];
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

interface WarehouseTransfer {
  id: string;
  requestId?: string;
  warehouseId: string;
  warehouseName: string;
  technicianId: string;
  technicianName: string;
  itemType: string;
  packagingType: string;
  quantity: number;
  itemNameAr?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  notes?: string;
  rejectionReason?: string;
}

interface GroupedTransfer {
  requestId: string;
  warehouseId: string;
  warehouseName: string;
  technicianId: string;
  technicianName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  notes?: string;
  rejectionReason?: string;
  transfers: WarehouseTransfer[];
}

interface WarehouseInfo {
  id: string;
  name: string;
}

interface PendingCountResponse {
  count: number;
}

export default function Notifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const { data: itemTypes } = useActiveItemTypes();
  
  // Admin state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InventoryRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  
  // Received devices count query
  const { data: pendingReceivedDevicesCount } = useQuery<PendingCountResponse>({
    queryKey: ["/api/received-devices/pending/count"],
    enabled: !!user?.id && hasRoleOrAbove(user.role, ROLES.SUPERVISOR),
  });

  // Technician state
  const [techRejectDialogOpen, setTechRejectDialogOpen] = useState(false);
  const [techApproveDialogOpen, setTechApproveDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<WarehouseTransfer | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<GroupedTransfer | null>(null);
  const [techRejectionReason, setTechRejectionReason] = useState("");
  
  // Bulk selection state (for technician)
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);
  const [bulkApproveDialogOpen, setBulkApproveDialogOpen] = useState(false);
  const [bulkRejectionReason, setBulkRejectionReason] = useState("");

  // Admin/Supervisor queries
  const { data: requests = [], isLoading: requestsLoading } = useQuery<InventoryRequest[]>({
    queryKey: user?.role === 'admin' ? ["/api/inventory-requests"] : ["/api/supervisor/inventory-requests"],
    enabled: user?.role === 'admin' || user?.role === 'supervisor',
  });

  const { data: warehouses = [] } = useQuery<WarehouseInfo[]>({
    queryKey: user?.role === 'admin' ? ["/api/warehouses"] : ["/api/supervisor/warehouses"],
    enabled: user?.role === 'admin' || user?.role === 'supervisor',
  });

  // Technician queries
  const { data: transfers = [], isLoading: transfersLoading } = useQuery<WarehouseTransfer[]>({
    queryKey: ["/api/warehouse-transfers"],
    enabled: user?.role === 'technician' && !!user?.id,
  });

  // Technician's own inventory requests
  const { data: myInventoryRequests = [], isLoading: myRequestsLoading } = useQuery<InventoryRequest[]>({
    queryKey: ["/api/inventory-requests/my"],
    enabled: user?.role === 'technician' && !!user?.id,
  });

  // Admin mutations
  const approveMutation = useMutation({
    mutationFn: async ({ id, warehouseId }: { id: string; warehouseId: string }) => {
      return await apiRequest("PATCH", `/api/inventory-requests/${id}/approve`, { warehouseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supervisor/inventory-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supervisor/warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      setApproveDialogOpen(false);
      setSelectedRequest(null);
      setSelectedWarehouseId("");
      toast({
        title: "✓ تم قبول الطلب بنجاح",
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
      queryClient.invalidateQueries({ queryKey: ["/api/supervisor/inventory-requests"] });
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes("");
      toast({
        title: "تم رفض الطلب",
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

  // Technician mutations - Batch operations
  const techApproveBatchMutation = useMutation({
    mutationFn: async (transferIds: string[]) => {
      return await apiRequest("POST", `/api/warehouse-transfer-batches/by-ids/accept`, { transferIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-fixed-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-moving-inventory"] });
      setTechApproveDialogOpen(false);
      setSelectedBatch(null);
      toast({
        title: "✓ تم قبول طلب النقل",
        description: "تم إضافة الأصناف إلى مخزونك",
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

  const techRejectBatchMutation = useMutation({
    mutationFn: async ({ transferIds, reason }: { transferIds: string[]; reason: string }) => {
      return await apiRequest("POST", `/api/warehouse-transfer-batches/by-ids/reject`, { transferIds, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      setTechRejectDialogOpen(false);
      setSelectedBatch(null);
      setTechRejectionReason("");
      toast({
        title: "تم رفض طلب النقل",
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

  // Bulk mutations for technician
  const bulkApproveMutation = useMutation({
    mutationFn: async (requestIds: string[]) => {
      return await apiRequest("POST", "/api/warehouse-transfer-batches/bulk/accept", { requestIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-fixed-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-moving-inventory"] });
      setBulkApproveDialogOpen(false);
      setSelectedBatchIds([]);
      toast({
        title: "✓ تم قبول الطلبات المحددة",
        description: "تم إضافة الأصناف إلى مخزونك",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في قبول الطلبات",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkRejectMutation = useMutation({
    mutationFn: async ({ requestIds, reason }: { requestIds: string[]; reason: string }) => {
      return await apiRequest("POST", "/api/warehouse-transfer-batches/bulk/reject", { requestIds, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      setBulkRejectDialogOpen(false);
      setSelectedBatchIds([]);
      setBulkRejectionReason("");
      toast({
        title: "تم رفض الطلبات المحددة",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في رفض الطلبات",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isAdminOrSupervisor = hasRoleOrAbove(user?.role || '', ROLES.SUPERVISOR);
  const isLoading = isAdminOrSupervisor ? requestsLoading : transfersLoading;

  const groupedTransfers = useMemo(() => {
    if (isAdminOrSupervisor) return [];
    
    const groupMap = new Map<string, GroupedTransfer>();
    
    transfers.forEach(transfer => {
      let key: string;
      if (transfer.requestId) {
        key = transfer.requestId;
      } else {
        const timestamp = new Date(transfer.createdAt).getTime();
        const timeWindow = Math.floor(timestamp / 10000);
        key = `${transfer.technicianId}-${transfer.warehouseId}-${timeWindow}-${transfer.status}-${transfer.notes || ''}`;
      }
      
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          requestId: key,
          warehouseId: transfer.warehouseId,
          warehouseName: transfer.warehouseName,
          technicianId: transfer.technicianId,
          technicianName: transfer.technicianName,
          status: transfer.status,
          createdAt: transfer.createdAt,
          notes: transfer.notes,
          rejectionReason: transfer.rejectionReason,
          transfers: [],
        });
      }
      
      groupMap.get(key)!.transfers.push(transfer);
    });
    
    return Array.from(groupMap.values());
  }, [transfers, isAdminOrSupervisor]);

  const filteredItems = isAdminOrSupervisor
    ? requests.filter(req => filter === 'all' || req.status === filter)
    : groupedTransfers.filter(group => filter === 'all' || group.status === filter);

  const getRequestedItems = (item: InventoryRequest | GroupedTransfer) => {
    if ('transfers' in item) {
      const items: string[] = [];
      item.transfers.forEach(transfer => {
        const itemType = itemTypes?.find(t => t.id === transfer.itemType);
        const displayName = transfer.itemNameAr || itemType?.nameAr || transfer.itemType;
        items.push(`${displayName}: ${transfer.quantity} ${transfer.packagingType === 'box' ? 'كرتون' : 'قطعة'}`);
      });
      return items;
    }
    
    const items: string[] = [];
    const request = item as InventoryRequest;
    
    if (itemTypes && itemTypes.length > 0) {
      itemTypes.forEach(itemType => {
        const boxes = getInventoryValueForItemType(itemType.id, request.entries, request, 'boxes');
        const units = getInventoryValueForItemType(itemType.id, request.entries, request, 'units');
        if (boxes > 0 || units > 0) {
          const parts: string[] = [];
          if (boxes > 0) parts.push(`${boxes} كرتون`);
          if (units > 0) parts.push(`${units} قطعة`);
          items.push(`${itemType.nameAr}: ${parts.join(' + ')}`);
        }
      });
    } else {
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
    }

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
      case 'accepted':
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

  // Admin handlers
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

  // Technician handlers
  const handleTechApproveBatchClick = (batch: GroupedTransfer) => {
    setSelectedBatch(batch);
    setTechApproveDialogOpen(true);
  };

  const handleTechConfirmApprove = () => {
    if (selectedBatch) {
      const transferIds = selectedBatch.transfers.map(t => t.id);
      techApproveBatchMutation.mutate(transferIds);
    }
  };

  const handleTechRejectBatchClick = (batch: GroupedTransfer) => {
    setSelectedBatch(batch);
    setTechRejectDialogOpen(true);
  };

  const handleTechConfirmReject = () => {
    if (!techRejectionReason.trim()) {
      toast({
        title: "خطأ",
        description: "يجب إدخال سبب الرفض",
        variant: "destructive",
      });
      return;
    }

    if (selectedBatch) {
      const transferIds = selectedBatch.transfers.map(t => t.id);
      techRejectBatchMutation.mutate({ transferIds, reason: techRejectionReason });
    }
  };

  // Bulk selection handlers
  const pendingBatches = !isAdminOrSupervisor ? groupedTransfers.filter(g => g.status === 'pending') : [];
  
  const toggleSelectBatch = (requestId: string) => {
    setSelectedBatchIds(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBatchIds.length === pendingBatches.length) {
      setSelectedBatchIds([]);
    } else {
      setSelectedBatchIds(pendingBatches.map(b => b.requestId));
    }
  };

  const isAllSelected = selectedBatchIds.length > 0 && selectedBatchIds.length === pendingBatches.length;

  const handleBulkApprove = () => {
    if (selectedBatchIds.length === 0) return;
    setBulkApproveDialogOpen(true);
  };

  const handleConfirmBulkApprove = () => {
    bulkApproveMutation.mutate(selectedBatchIds);
  };

  const handleBulkReject = () => {
    if (selectedBatchIds.length === 0) return;
    setBulkRejectDialogOpen(true);
  };

  const handleConfirmBulkReject = () => {
    if (!bulkRejectionReason.trim()) {
      toast({
        title: "خطأ",
        description: "يجب إدخال سبب الرفض",
        variant: "destructive",
      });
      return;
    }
    bulkRejectMutation.mutate({ requestIds: selectedBatchIds, reason: bulkRejectionReason });
  };

  // Calculate total quantities from selected batches
  const getSelectedBatchesTotals = () => {
    const totals: Record<string, number> = {};
    
    const selectedBatches = groupedTransfers.filter(g => selectedBatchIds.includes(g.requestId));
    
    selectedBatches.forEach(batch => {
      batch.transfers.forEach(transfer => {
        const key = `${transfer.itemType}_${transfer.packagingType}`;
        totals[key] = (totals[key] || 0) + transfer.quantity;
      });
    });
    
    return totals;
  };

  const getItemDisplayName = (itemTypeId: string, packagingType: string, quantity: number) => {
    const itemType = itemTypes?.find(t => t.id === itemTypeId);
    const fallbackNames: Record<string, string> = {
      'n950': 'نوفا 950',
      'i9000s': 'i9000s',
      'i9100': 'i9100',
      'rollPaper': 'رول حراري',
      'stickers': 'ملصقات',
      'newBatteries': 'بطاريات',
      'mobilySim': 'موبايلي SIM',
      'stcSim': 'STC SIM',
      'zainSim': 'زين SIM',
      'lebara': 'ليبارا SIM',
      'lebaraSim': 'ليبارا SIM',
    };
    
    const displayName = itemType?.nameAr || fallbackNames[itemTypeId] || itemTypeId;
    const packaging = packagingType === 'box' ? 'كرتون' : 'قطعة';
    return `${displayName} (${packaging}): ${quantity}`;
  };

  const allCount = isAdminOrSupervisor ? requests.length : transfers.length;
  const pendingCount = isAdminOrSupervisor
    ? requests.filter(r => r.status === 'pending').length
    : transfers.filter(t => t.status === 'pending').length;
  const approvedCount = isAdminOrSupervisor
    ? requests.filter(r => r.status === 'approved').length
    : transfers.filter(t => t.status === 'accepted').length;
  const rejectedCount = isAdminOrSupervisor
    ? requests.filter(r => r.status === 'rejected').length
    : transfers.filter(t => t.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f15] to-[#0a0a0f] text-white relative overflow-hidden">
      <GridBackground />

      {/* Top Header */}
      <div className="relative z-20 border-b border-[#18B2B0]/20 bg-black/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="p-3 bg-gradient-to-br from-[#18B2B0] to-teal-500 rounded-xl shadow-lg shadow-[#18B2B0]/30"
            >
              <Bell className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                الإشعارات
              </h1>
              <p className="text-sm text-gray-400">
                {isAdminOrSupervisor ? 'طلبات المخزون من الفنيين' : 'طلبات النقل من المستودعات'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Received Devices Card for Supervisors and Admins */}
        {isAdminOrSupervisor && pendingReceivedDevicesCount && pendingReceivedDevicesCount.count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card 
              className="relative bg-gradient-to-br from-cyan-500/10 via-blue-500/[0.07] to-indigo-500/[0.03] backdrop-blur-xl border-cyan-500/40 overflow-hidden group hover:border-cyan-500/60 transition-all duration-300 cursor-pointer"
              onClick={() => window.location.href = '/received-devices/review'}
              data-testid="card-received-devices"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-indigo-500/5" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all duration-500" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500" />
              
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="p-4 bg-gradient-to-br from-[#0f0f15] via-[#1a1a24] to-[#0f0f15] rounded-2xl border-2 border-cyan-500/40 shadow-lg shadow-cyan-500/30">
                        <Smartphone className="h-6 w-6 text-cyan-400" />
                      </div>
                      <div className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full text-xs font-bold text-white shadow-lg">
                        {pendingReceivedDevicesCount.count}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        مراجعة الأجهزة المستقبلة
                      </h3>
                      <p className="text-sm text-gray-400">
                        لديك {pendingReceivedDevicesCount.count} جهاز بانتظار المراجعة
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 hover:border-cyan-500/60"
                  >
                    <ArrowRight className="h-5 w-5 ml-2" />
                    مراجعة الآن
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Technician's Own Inventory Requests Section */}
        {!isAdminOrSupervisor && myInventoryRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="relative bg-gradient-to-br from-purple-500/10 via-violet-500/[0.07] to-fuchsia-500/[0.03] backdrop-blur-xl border-purple-500/40 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-fuchsia-500/5" />
              
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-xl border border-purple-500/30">
                    <Package className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">طلبات المخزون الخاصة بي</h3>
                    <p className="text-sm text-gray-400">الطلبات التي أرسلتها للمشرف</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {myInventoryRequests.slice(0, 5).map((request) => (
                    <div
                      key={request.id}
                      className="p-4 bg-gradient-to-br from-white/5 via-white/[0.03] to-white/[0.01] rounded-xl border border-white/10"
                      data-testid={`my-request-${request.id}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-300">
                            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true, locale: ar })}
                          </span>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-2">
                        {getRequestedItems(request).slice(0, 4).map((item, idx) => (
                          <Badge
                            key={idx}
                            className="bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs"
                          >
                            {item}
                          </Badge>
                        ))}
                        {getRequestedItems(request).length > 4 && (
                          <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/30 text-xs">
                            +{getRequestedItems(request).length - 4} المزيد
                          </Badge>
                        )}
                      </div>

                      {request.notes && (
                        <div className="flex items-start gap-2 mt-2 text-sm text-gray-400">
                          <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                          <span>{request.notes}</span>
                        </div>
                      )}

                      {request.adminNotes && request.status !== 'pending' && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-white/5 rounded-lg">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-400" />
                          <span className="text-sm text-yellow-300">رد المشرف: {request.adminNotes}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {myInventoryRequests.length > 5 && (
                  <div className="mt-4 text-center">
                    <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      +{myInventoryRequests.length - 5} طلبات أخرى
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
        
        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'الكل', count: allCount },
              { value: 'pending', label: 'قيد الانتظار', count: pendingCount },
              { value: 'approved', label: 'مقبول', count: approvedCount },
              { value: 'rejected', label: 'مرفوض', count: rejectedCount },
            ].map((tab) => (
              <Button
                key={tab.value}
                onClick={() => setFilter(tab.value as any)}
                variant={filter === tab.value ? 'default' : 'outline'}
                className={filter === tab.value 
                  ? 'bg-gradient-to-r from-[#18B2B0] to-teal-500 text-white shadow-lg shadow-[#18B2B0]/30'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-[#18B2B0]/30'
                }
                data-testid={`button-filter-${tab.value}`}
              >
                {tab.label} ({tab.count})
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Bulk Actions Bar (Technician only) */}
        {!isAdminOrSupervisor && filter === 'pending' && pendingBatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-br from-white/10 via-white/[0.07] to-white/[0.03] backdrop-blur-xl border border-[#18B2B0]/30 rounded-xl"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Button
                  onClick={toggleSelectAll}
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-[#18B2B0]/50"
                  data-testid="button-select-all"
                >
                  {isAllSelected ? (
                    <><CheckSquare className="h-4 w-4 ml-2" /> إلغاء تحديد الكل</>
                  ) : (
                    <><Square className="h-4 w-4 ml-2" /> تحديد الكل</>
                  )}
                </Button>
                {selectedBatchIds.length > 0 && (
                  <Badge className="bg-[#18B2B0]/20 text-[#18B2B0] border border-[#18B2B0]/40">
                    {selectedBatchIds.length} محدد
                  </Badge>
                )}
              </div>
              {selectedBatchIds.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleBulkApprove}
                    disabled={bulkApproveMutation.isPending}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/20"
                    data-testid="button-bulk-approve"
                  >
                    <Check className="h-4 w-4 ml-2" />
                    قبول المحدد ({selectedBatchIds.length})
                  </Button>
                  <Button
                    onClick={handleBulkReject}
                    disabled={bulkRejectMutation.isPending}
                    variant="outline"
                    className="bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50"
                    data-testid="button-bulk-reject"
                  >
                    <X className="h-4 w-4 ml-2" />
                    رفض المحدد ({selectedBatchIds.length})
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Notifications List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#18B2B0]"></div>
            <p className="mt-4 text-gray-400">جاري تحميل الإشعارات...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="p-6 bg-white/5 rounded-full inline-block mb-4">
              <Bell className="h-16 w-16 text-gray-500" />
            </div>
            <p className="text-gray-400 text-lg">لا توجد إشعارات</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item, index) => {
              const isRequest = 'technicianName' in item && 'technicianUsername' in item;
              const request = isRequest ? item as InventoryRequest : null;
              const groupedTransfer = !isRequest ? item as GroupedTransfer : null;

              return (
                <motion.div
                  key={request ? request.id : groupedTransfer?.requestId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <Card className="relative bg-gradient-to-br from-white/10 via-white/[0.07] to-white/[0.03] backdrop-blur-xl border-[#18B2B0]/30 overflow-hidden group hover:border-[#18B2B0]/50 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/10 via-transparent to-violet-500/5" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#18B2B0]/10 rounded-full blur-3xl group-hover:bg-[#18B2B0]/20 transition-all duration-500" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/20 transition-all duration-500" />
                    
                    {/* Checkbox for technician pending items */}
                    {!isAdminOrSupervisor && groupedTransfer && groupedTransfer.status === 'pending' && (
                      <div className="absolute top-4 left-4 z-10">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSelectBatch(groupedTransfer.requestId)}
                          className={`p-2 ${
                            selectedBatchIds.includes(groupedTransfer.requestId)
                              ? 'bg-[#18B2B0]/30 border-[#18B2B0] text-[#18B2B0]'
                              : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                          }`}
                          data-testid={`checkbox-${groupedTransfer.requestId}`}
                        >
                          {selectedBatchIds.includes(groupedTransfer.requestId) ? (
                            <CheckSquare className="h-5 w-5" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    )}
                    
                    <div className="relative p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <div className="p-4 bg-gradient-to-br from-[#0f0f15] via-[#1a1a24] to-[#0f0f15] rounded-2xl border-2 border-[#18B2B0]/40 shadow-lg shadow-[#18B2B0]/30 group-hover:shadow-[#18B2B0]/50 group-hover:border-[#18B2B0]/60 transition-all duration-300">
                              {request ? (
                                <User className="h-6 w-6 text-[#18B2B0] group-hover:text-teal-400 transition-colors duration-300" />
                              ) : (
                                <Warehouse className="h-6 w-6 text-[#18B2B0] group-hover:text-teal-400 transition-colors duration-300" />
                              )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-[#18B2B0] to-teal-400 rounded-full border-2 border-[#0f0f15] shadow-md shadow-[#18B2B0]/50 animate-pulse" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#18B2B0] transition-colors duration-300">
                              {request ? request.technicianName : groupedTransfer?.warehouseName}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {request?.technicianUsername && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <AtSign className="h-3.5 w-3.5 text-[#18B2B0]" />
                                  <span>@{request.technicianUsername}</span>
                                </div>
                              )}
                              {request?.technicianCity && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <MapPin className="h-3.5 w-3.5 text-violet-400" />
                                  <span>{request.technicianCity}</span>
                                </div>
                              )}
                              {groupedTransfer && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <TrendingUp className="h-3.5 w-3.5 text-violet-400" />
                                  <span>طلب نقل من المستودع</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>
                                {formatDistanceToNow(new Date(item.createdAt), { 
                                  addSuffix: true, 
                                  locale: ar 
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-5" />

                      {/* Items */}
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 bg-[#18B2B0]/10 rounded-lg">
                            <Package className="h-4 w-4 text-[#18B2B0]" />
                          </div>
                          <span className="text-sm font-semibold text-white">الأصناف {request ? 'المطلوبة' : 'المنقولة'}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getRequestedItems(item).map((itemText, idx) => (
                            <Badge 
                              key={idx}
                              className="bg-gradient-to-r from-[#18B2B0]/20 to-teal-500/20 text-[#18B2B0] border border-[#18B2B0]/30 hover:from-[#18B2B0]/30 hover:to-teal-500/30 transition-all duration-300 px-3 py-1.5 text-xs font-medium shadow-sm"
                            >
                              {itemText}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      {item.notes && (
                        <div className="mb-5 p-4 bg-gradient-to-br from-white/10 to-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-[#18B2B0] mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-gray-400 mb-1">ملاحظات</p>
                              <p className="text-sm text-gray-300 leading-relaxed">
                                {item.notes}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Rejection reason */}
                      {item.status === 'rejected' && (request?.adminNotes || groupedTransfer?.rejectionReason) && (
                        <div className="mb-5 p-4 bg-gradient-to-br from-red-500/20 to-red-500/10 rounded-xl border border-red-500/30 hover:border-red-500/40 transition-all duration-300">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-red-400 mb-1">سبب الرفض</p>
                              <p className="text-sm text-red-300 leading-relaxed">
                                {request?.adminNotes || groupedTransfer?.rejectionReason}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {item.status === 'pending' && (
                        <div className="flex gap-3 mt-5">
                          <Button
                            onClick={() => request ? handleApproveClick(request) : handleTechApproveBatchClick(groupedTransfer!)}
                            disabled={request ? approveMutation.isPending : techApproveBatchMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-green-500 via-green-600 to-green-500 hover:from-green-600 hover:via-green-700 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all duration-300 h-11"
                            data-testid={`button-approve-${request ? request.id : groupedTransfer?.requestId}`}
                          >
                            <Check className="h-4 w-4 ml-2" />
                            قبول {request ? 'الطلب' : 'النقل'}
                          </Button>
                          <Button
                            onClick={() => request ? handleRejectClick(request) : handleTechRejectBatchClick(groupedTransfer!)}
                            disabled={request ? rejectMutation.isPending : techRejectBatchMutation.isPending}
                            variant="outline"
                            className="flex-1 bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 font-semibold shadow-lg shadow-red-500/10 hover:shadow-red-500/20 transition-all duration-300 h-11"
                            data-testid={`button-reject-${request ? request.id : groupedTransfer?.requestId}`}
                          >
                            <X className="h-4 w-4 ml-2" />
                            رفض {request ? 'الطلب' : 'النقل'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Approve Dialog */}
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
                <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-warehouse">
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

      {/* Admin Reject Dialog */}
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

      {/* Technician Approve Dialog */}
      <Dialog open={techApproveDialogOpen} onOpenChange={setTechApproveDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#0f0f15] border-[#18B2B0]/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">قبول طلب النقل</DialogTitle>
            <DialogDescription className="text-gray-400">
              هل تريد قبول هذا الطلب؟ سيتم إضافة الأصناف إلى مخزونك
            </DialogDescription>
          </DialogHeader>
          {selectedBatch && (
            <div className="py-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-gray-400 mb-1">من المستودع:</p>
              <p className="text-white font-bold">{selectedBatch.warehouseName}</p>
              <p className="text-xs text-gray-500 mt-2">عدد الأصناف: {selectedBatch.transfers.length}</p>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setTechApproveDialogOpen(false)}
              className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleTechConfirmApprove}
              disabled={techApproveBatchMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              data-testid="button-tech-confirm-approve"
            >
              تأكيد القبول
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Technician Reject Dialog */}
      <Dialog open={techRejectDialogOpen} onOpenChange={setTechRejectDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#0f0f15] border-[#18B2B0]/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">رفض طلب النقل</DialogTitle>
            <DialogDescription className="text-gray-400">
              يرجى إدخال سبب رفض الطلب
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={techRejectionReason}
              onChange={(e) => setTechRejectionReason(e.target.value)}
              placeholder="اكتب سبب الرفض هنا..."
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[100px]"
              data-testid="textarea-tech-rejection-reason"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setTechRejectDialogOpen(false);
                setTechRejectionReason("");
              }}
              className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleTechConfirmReject}
              disabled={!techRejectionReason.trim() || techRejectBatchMutation.isPending}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              data-testid="button-tech-confirm-reject"
            >
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Approve Dialog */}
      <Dialog open={bulkApproveDialogOpen} onOpenChange={setBulkApproveDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-[#0f0f15] border-[#18B2B0]/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">قبول الطلبات المحددة</DialogTitle>
            <DialogDescription className="text-gray-400">
              هل تريد قبول {selectedBatchIds.length} طلب؟ سيتم إضافة جميع الأصناف التالية إلى مخزونك
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Number of requests */}
            <div className="p-3 bg-gradient-to-r from-[#18B2B0]/20 to-teal-500/10 rounded-lg border border-[#18B2B0]/40">
              <p className="text-sm text-gray-400 mb-1">عدد الطلبات:</p>
              <p className="text-white font-bold text-2xl">{selectedBatchIds.length}</p>
            </div>
            
            {/* Items breakdown */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10 max-h-60 overflow-y-auto">
              <p className="text-sm font-semibold text-[#18B2B0] mb-3">تفاصيل الكميات:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(getSelectedBatchesTotals()).map(([key, quantity]) => {
                  const [itemType, packagingType] = key.split('_');
                  return (
                    <div 
                      key={key}
                      className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5 hover:border-[#18B2B0]/30 transition-colors"
                    >
                      <span className="text-sm text-gray-300">
                        {getItemDisplayName(itemType, packagingType, quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setBulkApproveDialogOpen(false)}
              className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmBulkApprove}
              disabled={bulkApproveMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              data-testid="button-confirm-bulk-approve"
            >
              {bulkApproveMutation.isPending ? "جاري القبول..." : "تأكيد القبول"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <Dialog open={bulkRejectDialogOpen} onOpenChange={setBulkRejectDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#0f0f15] border-[#18B2B0]/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">رفض الطلبات المحددة</DialogTitle>
            <DialogDescription className="text-gray-400">
              يرجى إدخال سبب رفض {selectedBatchIds.length} طلب
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={bulkRejectionReason}
              onChange={(e) => setBulkRejectionReason(e.target.value)}
              placeholder="اكتب سبب الرفض هنا..."
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[100px]"
              data-testid="textarea-bulk-rejection-reason"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setBulkRejectDialogOpen(false);
                setBulkRejectionReason("");
              }}
              className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmBulkReject}
              disabled={!bulkRejectionReason.trim() || bulkRejectMutation.isPending}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              data-testid="button-confirm-bulk-reject"
            >
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
