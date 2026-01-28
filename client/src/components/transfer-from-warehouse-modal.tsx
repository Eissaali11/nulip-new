import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserSafe } from "@shared/schema";
import { Box, FileText, Sticker, Battery, Smartphone, Package } from "lucide-react";

const formSchema = z.object({
  technicianId: z.string().min(1, "يجب اختيار فني"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ItemTransfer {
  selected: boolean;
  quantity: number;
  packagingType: "box" | "unit";
}

interface TransferFromWarehouseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  warehouseName: string;
  currentInventory: {
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
    lebaraBoxes: number;
    lebaraUnits: number;
  } | null;
}

export default function TransferFromWarehouseModal({ 
  open, 
  onOpenChange,
  warehouseId,
  warehouseName,
  currentInventory,
}: TransferFromWarehouseModalProps) {
  const { toast } = useToast();

  const { data: authData } = useQuery<{ user: UserSafe }>({
    queryKey: ["/api/auth/me"],
  });
  
  const currentUser = authData?.user;

  const { data: users = [] } = useQuery<UserSafe[]>({
    queryKey: currentUser?.role === 'admin' ? ["/api/users"] : ["/api/supervisor/technicians"],
    enabled: !!currentUser,
  });

  const employees = currentUser?.role === 'admin' 
    ? users.filter(user => user.role === "technician")
    : users;

  const [itemTransfers, setItemTransfers] = useState<{[key: string]: ItemTransfer}>({
    n950: { selected: false, quantity: 0, packagingType: "unit" },
    i9000s: { selected: false, quantity: 0, packagingType: "unit" },
    i9100: { selected: false, quantity: 0, packagingType: "unit" },
    rollPaper: { selected: false, quantity: 0, packagingType: "unit" },
    stickers: { selected: false, quantity: 0, packagingType: "unit" },
    newBatteries: { selected: false, quantity: 0, packagingType: "unit" },
    mobilySim: { selected: false, quantity: 0, packagingType: "unit" },
    stcSim: { selected: false, quantity: 0, packagingType: "unit" },
    zainSim: { selected: false, quantity: 0, packagingType: "unit" },
    Lebara: { selected: false, quantity: 0, packagingType: "unit" },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      technicianId: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
      setItemTransfers({
        n950: { selected: false, quantity: 0, packagingType: "unit" },
        i9000s: { selected: false, quantity: 0, packagingType: "unit" },
        i9100: { selected: false, quantity: 0, packagingType: "unit" },
        rollPaper: { selected: false, quantity: 0, packagingType: "unit" },
        stickers: { selected: false, quantity: 0, packagingType: "unit" },
        newBatteries: { selected: false, quantity: 0, packagingType: "unit" },
        mobilySim: { selected: false, quantity: 0, packagingType: "unit" },
        stcSim: { selected: false, quantity: 0, packagingType: "unit" },
        zainSim: { selected: false, quantity: 0, packagingType: "unit" },
        Lebara: { selected: false, quantity: 0, packagingType: "unit" },
      });
    }
  }, [open, form]);

  const transferMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const transferData: any = {
        warehouseId,
        technicianId: data.technicianId,
        notes: data.notes,
      };

      // Add selected items with their quantities and packaging types
      Object.entries(itemTransfers).forEach(([itemKey, transfer]) => {
        if (transfer.selected && transfer.quantity > 0) {
          transferData[itemKey] = transfer.quantity;
          transferData[`${itemKey}PackagingType`] = transfer.packagingType;
        }
      });

      return await apiRequest("POST", "/api/warehouse-transfers", transferData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses", warehouseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-inventory", warehouseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      toast({
        title: "تم النقل بنجاح",
        description: "تم نقل الأصناف إلى الفني المحدد",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في النقل",
        description: error.message || "حدث خطأ أثناء نقل الأصناف",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    // Validate that at least one item is selected
    const hasSelectedItems = Object.values(itemTransfers).some(transfer => transfer.selected && transfer.quantity > 0);
    
    if (!hasSelectedItems) {
      toast({
        title: "لا توجد أصناف محددة",
        description: "يرجى اختيار صنف واحد على الأقل للنقل",
        variant: "destructive",
      });
      return;
    }

    // Validate quantities against available stock
    if (currentInventory) {
      const errors: string[] = [];
      
      Object.entries(itemTransfers).forEach(([itemKey, transfer]) => {
        if (transfer.selected) {
          const boxesKey = `${itemKey}Boxes` as keyof typeof currentInventory;
          const unitsKey = `${itemKey}Units` as keyof typeof currentInventory;
          const available = transfer.packagingType === "box" 
            ? currentInventory[boxesKey] 
            : currentInventory[unitsKey];
          
          if (transfer.quantity > (available || 0)) {
            const itemNames: {[key: string]: string} = {
              n950: "أجهزة N950",
              i9000s: "أجهزة I9000s",
              i9100: "أجهزة I9100",
              rollPaper: "ورق الطباعة",
              stickers: "الملصقات",
              newBatteries: "البطاريات الجديدة",
              mobilySim: "شرائح موبايلي",
              stcSim: "شرائح STC",
              zainSim: "شرائح زين",
              Lebara: "شرائح ليبارا",
            };
            errors.push(`${itemNames[itemKey]}: الكمية المطلوبة (${transfer.quantity}) أكبر من المتاح (${available})`);
          }
        }
      });

      if (errors.length > 0) {
        toast({
          title: "خطأ في الكميات",
          description: errors.join("\n"),
          variant: "destructive",
        });
        return;
      }
    }

    transferMutation.mutate(data);
  };

  const updateItemTransfer = (itemKey: string, field: keyof ItemTransfer, value: any) => {
    setItemTransfers(prev => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        [field]: value,
      }
    }));
  };

  const getAvailableStock = (itemKey: string, packagingType: "box" | "unit") => {
    if (!currentInventory) return 0;
    const boxesKey = `${itemKey}Boxes` as keyof typeof currentInventory;
    const unitsKey = `${itemKey}Units` as keyof typeof currentInventory;
    return packagingType === "box" ? currentInventory[boxesKey] : currentInventory[unitsKey];
  };

  const inventoryItems = [
    { 
      id: "n950",
      name: "أجهزة N950", 
      icon: Box,
      gradient: "from-blue-500 to-cyan-500"
    },
    { 
      id: "i9000s",
      name: "أجهزة I9000s", 
      icon: Box,
      gradient: "from-purple-500 to-pink-500"
    },
    { 
      id: "i9100",
      name: "أجهزة I9100", 
      icon: Box,
      gradient: "from-indigo-500 to-blue-500"
    },
    { 
      id: "rollPaper",
      name: "ورق الطباعة", 
      icon: FileText,
      gradient: "from-amber-500 to-orange-500"
    },
    { 
      id: "stickers",
      name: "الملصقات", 
      icon: Sticker,
      gradient: "from-pink-500 to-rose-500"
    },
    { 
      id: "newBatteries",
      name: "البطاريات الجديدة", 
      icon: Battery,
      gradient: "from-green-500 to-emerald-500"
    },
    { 
      id: "mobilySim",
      name: "شرائح موبايلي", 
      icon: Smartphone,
      gradient: "from-teal-500 to-cyan-500"
    },
    { 
      id: "stcSim",
      name: "شرائح STC", 
      icon: Smartphone,
      gradient: "from-blue-600 to-indigo-600"
    },
    { 
      id: "zainSim",
      name: "شرائح زين", 
      icon: Smartphone,
      gradient: "from-purple-600 to-violet-600"
    },
    { 
      id: "Lebara",
      name: "شرائح ليبارا", 
      icon: Smartphone,
      gradient: "from-pink-600 to-rose-600"
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>نقل من المستودع إلى فني</DialogTitle>
          <DialogDescription>
            نقل أصناف من {warehouseName} إلى فني
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="technicianId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اختر الفني</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-technician">
                        <SelectValue placeholder="اختر الفني" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.fullName} - {employee.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>اختر الأصناف للنقل</Label>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {inventoryItems.map((item) => (
                    <div key={item.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={itemTransfers[item.id].selected}
                          onCheckedChange={(checked) => updateItemTransfer(item.id, "selected", checked)}
                          data-testid={`checkbox-${item.id}`}
                        />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${item.gradient} text-white`}>
                              <item.icon className="h-4 w-4" />
                            </div>
                            <span className="font-semibold">{item.name}</span>
                          </div>
                          
                          {itemTransfers[item.id].selected && (
                            <div className="space-y-3 pr-6">
                              <div>
                                <Label className="text-sm">نوع التغليف</Label>
                                <RadioGroup
                                  value={itemTransfers[item.id].packagingType}
                                  onValueChange={(value) => updateItemTransfer(item.id, "packagingType", value)}
                                  className="flex gap-4 mt-2"
                                >
                                  <div className="flex items-center space-x-2 space-x-reverse">
                                    <RadioGroupItem value="box" id={`${item.id}-box`} data-testid={`radio-${item.id}-box`} />
                                    <Label htmlFor={`${item.id}-box`} className="cursor-pointer">
                                      كرتون (متاح: {getAvailableStock(item.id, "box")})
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2 space-x-reverse">
                                    <RadioGroupItem value="unit" id={`${item.id}-unit`} data-testid={`radio-${item.id}-unit`} />
                                    <Label htmlFor={`${item.id}-unit`} className="cursor-pointer">
                                      وحدة (متاح: {getAvailableStock(item.id, "unit")})
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </div>
                              
                              <div>
                                <Label className="text-sm">الكمية</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max={getAvailableStock(item.id, itemTransfers[item.id].packagingType)}
                                  value={itemTransfers[item.id].quantity}
                                  onChange={(e) => updateItemTransfer(item.id, "quantity", parseInt(e.target.value) || 0)}
                                  className="mt-2"
                                  data-testid={`input-${item.id}-quantity`}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أدخل أي ملاحظات..."
                      className="resize-none"
                      {...field}
                      data-testid="textarea-transfer-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-3 space-x-reverse pt-4">
              <Button
                type="submit"
                disabled={transferMutation.isPending}
                className="flex-1"
                data-testid="button-submit-transfer"
              >
                {transferMutation.isPending ? "جاري النقل..." : "تأكيد النقل"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-cancel-transfer"
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
