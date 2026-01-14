import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PackageOpen, Smartphone, CreditCard, FileText, Battery, Package, Loader2 } from "lucide-react";
import type { ProductType } from "@shared/schema";

interface RequestInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "devices": return <Smartphone className="h-4 w-4" />;
    case "sim": return <CreditCard className="h-4 w-4" />;
    case "papers": return <FileText className="h-4 w-4" />;
    case "accessories": return <Battery className="h-4 w-4" />;
    default: return <Package className="h-4 w-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "devices": return "from-blue-500 to-cyan-500";
    case "sim": return "from-purple-500 to-pink-500";
    case "papers": return "from-amber-500 to-orange-500";
    case "accessories": return "from-green-500 to-emerald-500";
    default: return "from-gray-500 to-slate-500";
  }
};

export default function RequestInventoryModal({ 
  open, 
  onOpenChange, 
}: RequestInventoryModalProps) {
  const { toast } = useToast();
  const [quantities, setQuantities] = useState<Record<string, { boxes: number; units: number }>>({});
  const [notes, setNotes] = useState("");

  const { data: productTypes = [], isLoading: productTypesLoading } = useQuery<ProductType[]>({
    queryKey: ["/api/product-types/active"],
    enabled: open,
  });

  useEffect(() => {
    if (productTypes.length > 0 && open) {
      const initial: Record<string, { boxes: number; units: number }> = {};
      productTypes.forEach(pt => {
        initial[pt.id] = { boxes: 0, units: 0 };
      });
      setQuantities(initial);
    }
  }, [productTypes, open]);

  useEffect(() => {
    if (!open) {
      setQuantities({});
      setNotes("");
    }
  }, [open]);

  const requestMutation = useMutation({
    mutationFn: async (data: { items: { productTypeId: string; productCode: string; productName: string; boxes: number; units: number }[]; notes: string }) => {
      return await apiRequest("POST", "/api/dynamic-inventory-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-requests/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dynamic-inventory-requests/my"] });
      toast({
        title: "تم إرسال الطلب بنجاح",
        description: "سيتم مراجعة طلبك من قبل المدير",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إرسال الطلب",
        description: error.message || "حدث خطأ أثناء إرسال الطلب",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const items = productTypes
      .filter(pt => {
        const qty = quantities[pt.id];
        return qty && (qty.boxes > 0 || qty.units > 0);
      })
      .map(pt => ({
        productTypeId: pt.id,
        productCode: pt.code,
        productName: pt.name,
        boxes: quantities[pt.id]?.boxes || 0,
        units: quantities[pt.id]?.units || 0,
      }));

    if (items.length === 0) {
      toast({
        title: "خطأ",
        description: "يجب طلب صنف واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    requestMutation.mutate({ items, notes });
  };

  const updateQuantity = (productTypeId: string, field: 'boxes' | 'units', value: number) => {
    setQuantities(prev => ({
      ...prev,
      [productTypeId]: {
        ...prev[productTypeId],
        [field]: Math.max(0, value),
      },
    }));
  };

  const sortedProducts = [...productTypes].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0f0f15] border-[#18B2B0]/20 text-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-[#18B2B0] to-teal-500">
              <PackageOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-xl">طلب مخزون</DialogTitle>
              <DialogDescription className="text-gray-400">
                اختر الأصناف والكميات التي تحتاجها
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        {productTypesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#18B2B0]" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedProducts.map((pt) => (
                <div key={pt.id} className="bg-white/5 rounded-lg p-4 space-y-3 border border-white/10">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md bg-gradient-to-r ${getCategoryColor(pt.category)}`}>
                      {getCategoryIcon(pt.category)}
                    </div>
                    <h4 className="font-semibold text-[#18B2B0] text-sm">{pt.name}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(pt.packagingType === "box_only" || pt.packagingType === "both") && (
                      <div>
                        <Label className="text-xs text-gray-400">كراتين</Label>
                        <Input 
                          type="number"
                          min="0"
                          className="bg-white/10 border-white/20 text-white mt-1"
                          value={quantities[pt.id]?.boxes || 0}
                          onChange={(e) => updateQuantity(pt.id, 'boxes', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    )}
                    {(pt.packagingType === "unit_only" || pt.packagingType === "both") && (
                      <div>
                        <Label className="text-xs text-gray-400">وحدات</Label>
                        <Input 
                          type="number"
                          min="0"
                          className="bg-white/10 border-white/20 text-white mt-1"
                          value={quantities[pt.id]?.units || 0}
                          onChange={(e) => updateQuantity(pt.id, 'units', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <Label className="text-white">ملاحظات</Label>
              <Textarea 
                placeholder="أضف ملاحظات إضافية للطلب..."
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 resize-none mt-2"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={requestMutation.isPending}
                className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600"
              >
                {requestMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جاري الإرسال...
                  </>
                ) : (
                  "إرسال الطلب"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
