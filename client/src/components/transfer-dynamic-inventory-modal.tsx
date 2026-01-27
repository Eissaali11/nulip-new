import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Box, FileText, Battery, Smartphone, Loader2, Send, AlertTriangle } from "lucide-react";
import type { ProductType, TechnicianInventory } from "@shared/schema";

interface DynamicInventoryItem {
  productTypeId: string;
  boxes: number;
  units: number;
}

interface TransferDynamicInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  warehouseName: string;
  currentInventory: DynamicInventoryItem[];
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "devices":
      return Smartphone;
    case "papers":
      return FileText;
    case "accessories":
      return Battery;
    case "sim":
      return Box;
    default:
      return Box;
  }
};

const getCategoryGradient = (category: string) => {
  switch (category) {
    case "devices":
      return "from-blue-500 to-cyan-500";
    case "papers":
      return "from-amber-500 to-orange-500";
    case "accessories":
      return "from-green-500 to-emerald-500";
    case "sim":
      return "from-purple-500 to-pink-500";
    default:
      return "from-gray-500 to-slate-500";
  }
};

export default function TransferDynamicInventoryModal({ 
  open, 
  onOpenChange,
  warehouseId,
  warehouseName,
  currentInventory,
}: TransferDynamicInventoryModalProps) {
  const { toast } = useToast();
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [transferValues, setTransferValues] = useState<Record<string, { boxes: number; units: number; packagingType: string }>>({});

  const { data: productTypes, isLoading: productTypesLoading } = useQuery<ProductType[]>({
    queryKey: ["/api/product-types/active"],
    enabled: open,
  });

  const { data: technicians, isLoading: techniciansLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: open,
    select: (users) => users.filter((u: any) => u.role === "technician"),
  });

  useEffect(() => {
    if (productTypes && open) {
      const initialValues: Record<string, { boxes: number; units: number; packagingType: string }> = {};
      
      productTypes.forEach(pt => {
        initialValues[pt.id] = {
          boxes: 0,
          units: 0,
          packagingType: pt.packagingType === "both" ? "box" : pt.packagingType,
        };
      });
      
      setTransferValues(initialValues);
    }
  }, [productTypes, open]);

  const transferMutation = useMutation({
    mutationFn: async (data: { 
      technicianId: string;
      items: { productTypeId: string; quantity: number; packagingType: string }[];
      notes: string;
    }) => {
      const selectedTech = technicians?.find(t => t.id === data.technicianId);
      if (!selectedTech) throw new Error("الفني غير موجود");

      const promises = data.items
        .filter(item => item.quantity > 0)
        .map(item => {
          const productType = productTypes?.find(pt => pt.id === item.productTypeId);
          if (!productType) throw new Error("الصنف غير موجود");
          
          return apiRequest("POST", "/api/warehouse-transfers", {
            warehouseId,
            technicianId: data.technicianId,
            technicianName: selectedTech.fullName,
            notes: data.notes || undefined,
            itemType: productType.code,
            packagingType: item.packagingType,
            quantity: item.quantity,
          });
        });
      
      if (promises.length === 0) {
        throw new Error("يجب اختيار صنف واحد على الأقل للتحويل");
      }
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses", warehouseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses", warehouseId, "dynamic-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/technicians-inventory"] });
      toast({
        title: "تم إرسال التحويل بنجاح",
        description: "تم إرسال طلب التحويل للفني وسيتم انتظار موافقته",
      });
      onOpenChange(false);
      setSelectedTechnicianId("");
      setNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحويل",
        description: error.message || "حدث خطأ أثناء إجراء التحويل",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTechnicianId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار الفني",
        variant: "destructive",
      });
      return;
    }

    const items = Object.entries(transferValues).map(([productTypeId, values]) => {
      const quantity = values.packagingType === "box" ? values.boxes : values.units;
      return {
        productTypeId,
        quantity,
        packagingType: values.packagingType,
      };
    }).filter(item => item.quantity > 0);
    
    if (items.length === 0) {
      toast({
        title: "خطأ",
        description: "يجب اختيار صنف واحد على الأقل للتحويل",
        variant: "destructive",
      });
      return;
    }

    transferMutation.mutate({
      technicianId: selectedTechnicianId,
      items,
      notes,
    });
  };

  const handleValueChange = (productTypeId: string, field: 'boxes' | 'units' | 'packagingType', value: number | string) => {
    setTransferValues(prev => ({
      ...prev,
      [productTypeId]: {
        ...prev[productTypeId],
        [field]: field === 'packagingType' ? value : Math.max(0, value as number),
      },
    }));
  };

  const getAvailableQuantity = (productTypeId: string, packagingType: string): number => {
    const inv = currentInventory.find(i => i.productTypeId === productTypeId);
    if (!inv) return 0;
    return packagingType === "box" ? inv.boxes : inv.units;
  };

  const isLoading = productTypesLoading || techniciansLoading;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#18B2B0]" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-[#18B2B0]" />
            تحويل من {warehouseName}
          </DialogTitle>
          <DialogDescription>
            اختر الفني والأصناف المراد تحويلها من المستودع
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="technician">الفني المستلم</Label>
            <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الفني" />
              </SelectTrigger>
              <SelectContent>
                {technicians?.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.fullName} {tech.city ? `- ${tech.city}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {productTypes?.map((productType) => {
                const Icon = getCategoryIcon(productType.category);
                const gradient = getCategoryGradient(productType.category);
                const values = transferValues[productType.id] || { boxes: 0, units: 0, packagingType: "box" };
                const inv = currentInventory.find(i => i.productTypeId === productType.id);
                const availableBoxes = inv?.boxes || 0;
                const availableUnits = inv?.units || 0;
                
                return (
                  <div key={productType.id} className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${gradient} text-white`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <h4 className="font-semibold">{productType.name}</h4>
                      </div>
                      <div className="text-sm text-gray-500">
                        متوفر: {availableBoxes} كرتون | {availableUnits} وحدة
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {productType.packagingType === "both" && (
                        <div className="space-y-2">
                          <Label>نوع التعبئة</Label>
                          <Select 
                            value={values.packagingType} 
                            onValueChange={(v) => handleValueChange(productType.id, 'packagingType', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="box">كراتين</SelectItem>
                              <SelectItem value="unit">وحدات</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <div className="space-y-2 col-span-2">
                        <Label>الكمية</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max={getAvailableQuantity(productType.id, values.packagingType)}
                            value={values.packagingType === "box" ? values.boxes : values.units}
                            onChange={(e) => handleValueChange(
                              productType.id, 
                              values.packagingType === "box" ? 'boxes' : 'units', 
                              parseInt(e.target.value) || 0
                            )}
                          />
                          {(values.boxes > 0 || values.units > 0) && 
                            (values.boxes > availableBoxes || values.units > availableUnits) && (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف ملاحظات للتحويل..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-[#18B2B0] to-teal-500"
              disabled={transferMutation.isPending}
            >
              {transferMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 ml-2" />
                  إرسال التحويل
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
