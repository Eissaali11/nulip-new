import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Package, User, Warehouse, ArrowRight, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
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

export default function OperationDetailsPage() {
  const [, params] = useRoute("/operation-details/:groupId");
  const groupId = params?.groupId ? decodeURIComponent(params.groupId) : '';

  const { data: transfers, isLoading } = useQuery<WarehouseTransfer[]>({
    queryKey: ["/api/warehouse-transfers"],
  });

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

  // Group all transfers by the same logic
  const processedTransfers = transfers?.filter(t => t.status !== 'pending') || [];
  const groupedProcessedTransfers = processedTransfers?.reduce((acc, transfer) => {
    const date = new Date(transfer.createdAt);
    const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const key = `${transfer.warehouseId}-${dayKey}-${transfer.performedBy}-${transfer.status}-${transfer.notes || 'no-notes'}`;
    
    if (!acc[key]) {
      acc[key] = {
        groupId: key,
        warehouseId: transfer.warehouseId,
        warehouseName: transfer.warehouseName,
        technicianName: transfer.technicianName,
        technicianId: transfer.technicianId,
        createdAt: transfer.createdAt,
        respondedAt: transfer.respondedAt,
        notes: transfer.notes,
        status: transfer.status,
        rejectionReason: transfer.rejectionReason,
        performedBy: transfer.performedBy,
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

  const operationGroup = groupedProcessedTransfers?.[groupId];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-[#18B2B0]"></div>
          <p className="text-gray-500 mt-4 text-lg">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (!operationGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto shadow-xl">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">العملية غير موجودة</h2>
            <p className="text-gray-600 mb-6">لم يتم العثور على تفاصيل هذه العملية</p>
            <Link href="/operations">
              <Button className="bg-gradient-to-r from-[#18B2B0] to-teal-500">
                <ArrowRight className="h-4 w-4 ml-2" />
                العودة للعمليات
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg px-4 py-2">
            <CheckCircle className="h-5 w-5 mr-2" />
            مقبول
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-lg px-4 py-2">
            <XCircle className="h-5 w-5 mr-2" />
            مرفوض
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50" dir="rtl">
      {/* Animated Logo Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#18B2B0] via-teal-500 to-[#18B2B0] shadow-2xl">
        <div className="absolute inset-0 bg-black/5"></div>
        
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

        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#18B2B0] to-transparent pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#18B2B0] to-transparent pointer-events-none"></div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Back Button & Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#18B2B0]/20">
          <div className="flex items-center justify-between mb-4">
            <Link href="/operations">
              <Button variant="outline" className="hover:bg-[#18B2B0]/10 hover:border-[#18B2B0]">
                <ArrowRight className="h-4 w-4 ml-2" />
                العودة للعمليات
              </Button>
            </Link>
            {getStatusBadge(operationGroup.status)}
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#18B2B0] via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            تفاصيل العملية
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            جميع المنتجات في هذه العملية
          </p>
        </div>

        {/* Operation Info Card */}
        <Card className="shadow-xl border-[#18B2B0]/20 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-[#18B2B0]/10 to-teal-50/50 border-b border-[#18B2B0]/10">
            <CardTitle className="text-2xl text-[#18B2B0]">معلومات العملية</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Warehouse Info */}
              <div className="flex items-center gap-4 bg-[#18B2B0]/5 rounded-xl p-4">
                <div className="bg-gradient-to-br from-[#18B2B0] to-teal-600 p-4 rounded-xl shadow-lg">
                  <Warehouse className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">المستودع</p>
                  <p className="text-lg font-bold text-gray-800">{operationGroup.warehouseName}</p>
                </div>
              </div>

              {/* Technician Info */}
              <div className="flex items-center gap-4 bg-blue-50 rounded-xl p-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl shadow-lg">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">الفني</p>
                  <p className="text-lg font-bold text-gray-800">{operationGroup.technicianName}</p>
                </div>
              </div>

              {/* Created Date */}
              <div className="flex items-center gap-4 bg-purple-50 rounded-xl p-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-xl shadow-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">تاريخ الطلب</p>
                  <p className="text-lg font-bold text-gray-800">
                    {format(new Date(operationGroup.createdAt), "dd MMMM yyyy, HH:mm", { locale: ar })}
                  </p>
                </div>
              </div>

              {/* Responded Date */}
              {operationGroup.respondedAt && (
                <div className="flex items-center gap-4 bg-green-50 rounded-xl p-4">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl shadow-lg">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">تاريخ المعالجة</p>
                    <p className="text-lg font-bold text-gray-800">
                      {format(new Date(operationGroup.respondedAt), "dd MMMM yyyy, HH:mm", { locale: ar })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {operationGroup.notes && (
              <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-700 mb-2">ملاحظات:</p>
                <p className="text-blue-800">{operationGroup.notes}</p>
              </div>
            )}

            {/* Rejection Reason */}
            {operationGroup.status === 'rejected' && operationGroup.rejectionReason && (
              <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-700 mb-2">سبب الرفض:</p>
                <p className="text-red-800">{operationGroup.rejectionReason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card className="shadow-xl border-[#18B2B0]/20 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-[#18B2B0]/10 to-teal-50/50 border-b border-[#18B2B0]/10">
            <CardTitle className="text-2xl text-[#18B2B0] flex items-center gap-2">
              <Package className="h-6 w-6" />
              المنتجات ({operationGroup.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow className="border-[#18B2B0]/20 bg-[#18B2B0]/5">
                  <TableHead className="text-right font-bold text-[#18B2B0]">#</TableHead>
                  <TableHead className="text-right font-bold text-[#18B2B0]">اسم المنتج</TableHead>
                  <TableHead className="text-right font-bold text-[#18B2B0]">نوع التغليف</TableHead>
                  <TableHead className="text-right font-bold text-[#18B2B0]">الكمية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operationGroup.items.map((item: any, index: number) => (
                  <TableRow key={item.id} className="hover:bg-[#18B2B0]/5 transition-colors">
                    <TableCell className="font-semibold text-gray-700">{index + 1}</TableCell>
                    <TableCell className="font-medium text-gray-800">{item.itemNameAr}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-[#18B2B0]">
                        {item.packagingType === 'box' ? 'كرتونة' : 'قطعة'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-[#18B2B0]" />
                        <span className="font-bold text-[#18B2B0] text-lg">{item.quantity}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Summary */}
            <div className="mt-6 bg-gradient-to-r from-[#18B2B0]/10 to-teal-50/50 rounded-xl p-4 border-2 border-[#18B2B0]/20">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-700">إجمالي المنتجات:</span>
                <Badge className="bg-gradient-to-r from-[#18B2B0] to-teal-500 text-white text-xl px-4 py-2">
                  {operationGroup.items.length} منتج
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
