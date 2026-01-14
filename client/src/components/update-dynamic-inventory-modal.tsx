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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Box, FileText, Sticker, Battery, Smartphone, Loader2 } from "lucide-react";
import type { ProductType } from "@shared/schema";

interface DynamicInventoryItem {
  productTypeId: string;
  boxes: number;
  units: number;
}

interface UpdateDynamicInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
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

export default function UpdateDynamicInventoryModal({ 
  open, 
  onOpenChange,
  warehouseId,
  currentInventory,
}: UpdateDynamicInventoryModalProps) {
  const { toast } = useToast();
  const [inventoryValues, setInventoryValues] = useState<Record<string, { boxes: number; units: number }>>({});

  const { data: productTypes, isLoading: productTypesLoading } = useQuery<ProductType[]>({
    queryKey: ["/api/product-types/active"],
    enabled: open,
  });

  useEffect(() => {
    if (productTypes && open) {
      const initialValues: Record<string, { boxes: number; units: number }> = {};
      
      productTypes.forEach(pt => {
        const existing = currentInventory.find(inv => inv.productTypeId === pt.id);
        initialValues[pt.id] = {
          boxes: existing?.boxes || 0,
          units: existing?.units || 0,
        };
      });
      
      setInventoryValues(initialValues);
    }
  }, [productTypes, currentInventory, open]);

  const updateInventoryMutation = useMutation({
    mutationFn: async (items: { productTypeId: string; boxes: number; units: number }[]) => {
      const promises = items.map(item => 
        apiRequest("POST", `/api/warehouses/${warehouseId}/dynamic-inventory`, item)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses", warehouseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses", warehouseId, "dynamic-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({
        title: "تم تحديث المخزون بنجاح",
        description: "تم تحديث كميات المخزون في المستودع",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث المخزون",
        description: error.message || "حدث خطأ أثناء تحديث المخزون",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const items = Object.entries(inventoryValues).map(([productTypeId, values]) => ({
      productTypeId,
      boxes: values.boxes,
      units: values.units,
    }));
    
    updateInventoryMutation.mutate(items);
  };

  const handleValueChange = (productTypeId: string, field: 'boxes' | 'units', value: number) => {
    setInventoryValues(prev => ({
      ...prev,
      [productTypeId]: {
        ...prev[productTypeId],
        [field]: Math.max(0, value),
      },
    }));
  };

  if (productTypesLoading) {
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
          <DialogTitle>تحديث مخزون المستودع</DialogTitle>
          <DialogDescription>
            قم بتحديث كميات جميع الأصناف في المستودع
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {productTypes?.map((productType) => {
                const Icon = getCategoryIcon(productType.category);
                const gradient = getCategoryGradient(productType.category);
                const values = inventoryValues[productType.id] || { boxes: 0, units: 0 };
                
                return (
                  <div key={productType.id} className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${gradient} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h4 className="font-semibold text-lg">{productType.name}</h4>
                      {productType.unitsPerBox && (
                        <span className="text-sm text-gray-500">({productType.unitsPerBox} وحدة/كرتون)</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {(productType.packagingType === "both" || productType.packagingType === "box") && (
                        <div className="space-y-2">
                          <Label htmlFor={`${productType.id}-boxes`}>الكراتين</Label>
                          <Input
                            id={`${productType.id}-boxes`}
                            type="number"
                            min="0"
                            value={values.boxes}
                            onChange={(e) => handleValueChange(productType.id, 'boxes', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      )}
                      {(productType.packagingType === "both" || productType.packagingType === "unit") && (
                        <div className="space-y-2">
                          <Label htmlFor={`${productType.id}-units`}>الوحدات</Label>
                          <Input
                            id={`${productType.id}-units`}
                            type="number"
                            min="0"
                            value={values.units}
                            onChange={(e) => handleValueChange(productType.id, 'units', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-[#18B2B0] to-teal-500"
              disabled={updateInventoryMutation.isPending}
            >
              {updateInventoryMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ التغييرات"
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
