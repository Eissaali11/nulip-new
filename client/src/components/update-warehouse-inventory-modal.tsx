import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Box, FileText, Sticker, Battery, Smartphone } from "lucide-react";

const formSchema = z.object({
  n950Boxes: z.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
  n950Units: z.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
  i9000sBoxes: z.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
  i9000sUnits: z.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
  i9100Boxes: z.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
  i9100Units: z.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
  rollPaperBoxes: z.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
  rollPaperUnits: z.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
  stickersBoxes: z.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
  stickersUnits: z.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
  newBatteriesBoxes: z.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
  newBatteriesUnits: z.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
  mobilySimBoxes: z.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
  mobilySimUnits: z.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
  stcSimBoxes: z.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
  stcSimUnits: z.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
  zainSimBoxes: z.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
  zainSimUnits: z.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
});

type FormData = z.infer<typeof formSchema>;

interface UpdateWarehouseInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  currentInventory: FormData | null;
}

export default function UpdateWarehouseInventoryModal({ 
  open, 
  onOpenChange,
  warehouseId,
  currentInventory,
}: UpdateWarehouseInventoryModalProps) {
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      n950Boxes: 0,
      n950Units: 0,
      i9000sBoxes: 0,
      i9000sUnits: 0,
      i9100Boxes: 0,
      i9100Units: 0,
      rollPaperBoxes: 0,
      rollPaperUnits: 0,
      stickersBoxes: 0,
      stickersUnits: 0,
      newBatteriesBoxes: 0,
      newBatteriesUnits: 0,
      mobilySimBoxes: 0,
      mobilySimUnits: 0,
      stcSimBoxes: 0,
      stcSimUnits: 0,
      zainSimBoxes: 0,
      zainSimUnits: 0,
    },
  });

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (open && currentInventory && !hasInitialized.current) {
      form.reset(currentInventory);
      hasInitialized.current = true;
    }
    if (!open) {
      hasInitialized.current = false;
    }
  }, [open, currentInventory]);

  const updateInventoryMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("PUT", `/api/warehouse-inventory/${warehouseId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses", warehouseId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-inventory", warehouseId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"], refetchType: 'active' });
      queryClient.refetchQueries({ queryKey: ["/api/warehouses", warehouseId] });
      queryClient.refetchQueries({ queryKey: ["/api/warehouses", warehouseId, "dynamic-inventory"] });
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

  const onSubmit = (data: FormData) => {
    updateInventoryMutation.mutate(data);
  };

  const inventoryItems = [
    { 
      name: "أجهزة N950", 
      boxesKey: "n950Boxes", 
      unitsKey: "n950Units",
      icon: Box,
      gradient: "from-blue-500 to-cyan-500"
    },
    { 
      name: "أجهزة I9000s", 
      boxesKey: "i9000sBoxes", 
      unitsKey: "i9000sUnits",
      icon: Box,
      gradient: "from-purple-500 to-pink-500"
    },
    { 
      name: "أجهزة I9100", 
      boxesKey: "i9100Boxes", 
      unitsKey: "i9100Units",
      icon: Box,
      gradient: "from-indigo-500 to-blue-500"
    },
    { 
      name: "ورق الطباعة", 
      boxesKey: "rollPaperBoxes", 
      unitsKey: "rollPaperUnits",
      icon: FileText,
      gradient: "from-amber-500 to-orange-500"
    },
    { 
      name: "الملصقات", 
      boxesKey: "stickersBoxes", 
      unitsKey: "stickersUnits",
      icon: Sticker,
      gradient: "from-pink-500 to-rose-500"
    },
    { 
      name: "البطاريات الجديدة", 
      boxesKey: "newBatteriesBoxes", 
      unitsKey: "newBatteriesUnits",
      icon: Battery,
      gradient: "from-green-500 to-emerald-500"
    },
    { 
      name: "شرائح موبايلي", 
      boxesKey: "mobilySimBoxes", 
      unitsKey: "mobilySimUnits",
      icon: Smartphone,
      gradient: "from-teal-500 to-cyan-500"
    },
    { 
      name: "شرائح STC", 
      boxesKey: "stcSimBoxes", 
      unitsKey: "stcSimUnits",
      icon: Smartphone,
      gradient: "from-blue-600 to-indigo-600"
    },
    { 
      name: "شرائح زين", 
      boxesKey: "zainSimBoxes", 
      unitsKey: "zainSimUnits",
      icon: Smartphone,
      gradient: "from-purple-600 to-violet-600"
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>تحديث مخزون المستودع</DialogTitle>
          <DialogDescription>
            قم بتحديث كميات جميع الأصناف في المستودع
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                {inventoryItems.map((item, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${item.gradient} text-white`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <h4 className="font-semibold text-lg">{item.name}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={item.boxesKey as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الكراتين</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                value={field.value ?? 0}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  field.onChange(val === "" ? 0 : parseInt(val) || 0);
                                }}
                                data-testid={`input-${item.boxesKey}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={item.unitsKey as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الوحدات</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                value={field.value ?? 0}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  field.onChange(val === "" ? 0 : parseInt(val) || 0);
                                }}
                                data-testid={`input-${item.unitsKey}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex items-center space-x-3 space-x-reverse pt-4">
              <Button
                type="submit"
                disabled={updateInventoryMutation.isPending}
                className="flex-1"
                data-testid="button-submit-update-inventory"
              >
                {updateInventoryMutation.isPending ? "جاري التحديث..." : "تحديث المخزون"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-cancel-update-inventory"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
