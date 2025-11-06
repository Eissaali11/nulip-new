import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, Package, Box, Smartphone, FileText, Sticker, Battery } from "lucide-react";

type PackagingType = 'box' | 'unit';

interface ItemTransfer {
  quantity: number;
  packagingType: PackagingType;
}

interface TransferData {
  n950: ItemTransfer;
  i9000s: ItemTransfer;
  i9100: ItemTransfer;
  rollPaper: ItemTransfer;
  stickers: ItemTransfer;
  newBatteries: ItemTransfer;
  mobilySim: ItemTransfer;
  stcSim: ItemTransfer;
  zainSim: ItemTransfer;
}

interface TransferToMovingModalProps {
  open: boolean;
  onClose: () => void;
  technicianId: string;
  fixedInventory: {
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
  };
}

export function TransferToMovingModal({
  open,
  onClose,
  technicianId,
  fixedInventory,
}: TransferToMovingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [transfer, setTransfer] = useState<TransferData>({
    n950: { quantity: 0, packagingType: 'unit' },
    i9000s: { quantity: 0, packagingType: 'unit' },
    i9100: { quantity: 0, packagingType: 'unit' },
    rollPaper: { quantity: 0, packagingType: 'unit' },
    stickers: { quantity: 0, packagingType: 'unit' },
    newBatteries: { quantity: 0, packagingType: 'unit' },
    mobilySim: { quantity: 0, packagingType: 'unit' },
    stcSim: { quantity: 0, packagingType: 'unit' },
    zainSim: { quantity: 0, packagingType: 'unit' },
  });

  const getAvailableForType = (boxes: number, units: number, type: PackagingType) => {
    return type === 'box' ? boxes : units;
  };

  const transferMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(
        "POST",
        `/api/stock-transfer`,
        {
          technicianId,
          n950: transfer.n950.quantity,
          n950PackagingType: transfer.n950.packagingType,
          i9000s: transfer.i9000s.quantity,
          i9000sPackagingType: transfer.i9000s.packagingType,
          i9100: transfer.i9100.quantity,
          i9100PackagingType: transfer.i9100.packagingType,
          rollPaper: transfer.rollPaper.quantity,
          rollPaperPackagingType: transfer.rollPaper.packagingType,
          stickers: transfer.stickers.quantity,
          stickersPackagingType: transfer.stickers.packagingType,
          newBatteries: transfer.newBatteries.quantity,
          newBatteriesPackagingType: transfer.newBatteries.packagingType,
          mobilySim: transfer.mobilySim.quantity,
          mobilySimPackagingType: transfer.mobilySim.packagingType,
          stcSim: transfer.stcSim.quantity,
          stcSimPackagingType: transfer.stcSim.packagingType,
          zainSim: transfer.zainSim.quantity,
          zainSimPackagingType: transfer.zainSim.packagingType,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/technician-fixed-inventory/${technicianId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/technicians/${technicianId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fixed-inventory-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/all-technicians-inventory'] });
      queryClient.invalidateQueries({ queryKey: [`/api/technician-inventory/${technicianId}`] });
      toast({
        title: "✓ تم النقل بنجاح",
        description: "تم نقل الكميات من المخزون الثابت إلى المتحرك",
      });
      setTransfer({
        n950: { quantity: 0, packagingType: 'unit' },
        i9000s: { quantity: 0, packagingType: 'unit' },
        i9100: { quantity: 0, packagingType: 'unit' },
        rollPaper: { quantity: 0, packagingType: 'unit' },
        stickers: { quantity: 0, packagingType: 'unit' },
        newBatteries: { quantity: 0, packagingType: 'unit' },
        mobilySim: { quantity: 0, packagingType: 'unit' },
        stcSim: { quantity: 0, packagingType: 'unit' },
        zainSim: { quantity: 0, packagingType: 'unit' },
      });
      onClose();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "✗ فشل النقل",
        description: "حدث خطأ أثناء نقل الكميات",
      });
    },
  });

  const handleTransfer = () => {
    // Validate quantities against the selected packaging type
    const n950Available = getAvailableForType(fixedInventory.n950Boxes, fixedInventory.n950Units, transfer.n950.packagingType);
    const i9000sAvailable = getAvailableForType(fixedInventory.i9000sBoxes, fixedInventory.i9000sUnits, transfer.i9000s.packagingType);
    const i9100Available = getAvailableForType(fixedInventory.i9100Boxes, fixedInventory.i9100Units, transfer.i9100.packagingType);
    const paperAvailable = getAvailableForType(fixedInventory.rollPaperBoxes, fixedInventory.rollPaperUnits, transfer.rollPaper.packagingType);
    const stickersAvailable = getAvailableForType(fixedInventory.stickersBoxes, fixedInventory.stickersUnits, transfer.stickers.packagingType);
    const batteriesAvailable = getAvailableForType(fixedInventory.newBatteriesBoxes, fixedInventory.newBatteriesUnits, transfer.newBatteries.packagingType);
    const mobilyAvailable = getAvailableForType(fixedInventory.mobilySimBoxes, fixedInventory.mobilySimUnits, transfer.mobilySim.packagingType);
    const stcAvailable = getAvailableForType(fixedInventory.stcSimBoxes, fixedInventory.stcSimUnits, transfer.stcSim.packagingType);
    const zainAvailable = getAvailableForType(fixedInventory.zainSimBoxes, fixedInventory.zainSimUnits, transfer.zainSim.packagingType);

    if (transfer.n950.quantity > n950Available || transfer.i9000s.quantity > i9000sAvailable || 
        transfer.i9100.quantity > i9100Available || transfer.rollPaper.quantity > paperAvailable || 
        transfer.stickers.quantity > stickersAvailable || transfer.newBatteries.quantity > batteriesAvailable ||
        transfer.mobilySim.quantity > mobilyAvailable || transfer.stcSim.quantity > stcAvailable || 
        transfer.zainSim.quantity > zainAvailable) {
      toast({
        variant: "destructive",
        title: "خطأ في الكمية",
        description: "الكمية المطلوبة أكبر من المتاح في النوع المحدد",
      });
      return;
    }

    if (transfer.n950.quantity === 0 && transfer.i9000s.quantity === 0 && transfer.i9100.quantity === 0 && 
        transfer.rollPaper.quantity === 0 && transfer.stickers.quantity === 0 && transfer.newBatteries.quantity === 0 && 
        transfer.mobilySim.quantity === 0 && transfer.stcSim.quantity === 0 && transfer.zainSim.quantity === 0) {
      toast({
        variant: "destructive",
        title: "لا توجد كميات",
        description: "يرجى إدخال كميات للنقل",
      });
      return;
    }

    transferMutation.mutate();
  };

  const updateItemTransfer = (itemKey: keyof TransferData, field: 'quantity' | 'packagingType', value: number | PackagingType) => {
    setTransfer(prev => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        [field]: value,
      }
    }));
  };

  const items = [
    {
      id: 'n950',
      label: 'أجهزة N950',
      icon: Box,
      boxes: fixedInventory.n950Boxes,
      units: fixedInventory.n950Units,
      transfer: transfer.n950,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'i9000s',
      label: 'أجهزة I9000s',
      icon: Box,
      boxes: fixedInventory.i9000sBoxes,
      units: fixedInventory.i9000sUnits,
      transfer: transfer.i9000s,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      id: 'i9100',
      label: 'أجهزة I9100',
      icon: Box,
      boxes: fixedInventory.i9100Boxes,
      units: fixedInventory.i9100Units,
      transfer: transfer.i9100,
      gradient: 'from-indigo-500 to-blue-500',
    },
    {
      id: 'rollPaper',
      label: 'أوراق رول',
      icon: FileText,
      boxes: fixedInventory.rollPaperBoxes,
      units: fixedInventory.rollPaperUnits,
      transfer: transfer.rollPaper,
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      id: 'stickers',
      label: 'ملصقات مدى',
      icon: Sticker,
      boxes: fixedInventory.stickersBoxes,
      units: fixedInventory.stickersUnits,
      transfer: transfer.stickers,
      gradient: 'from-rose-500 to-red-500',
    },
    {
      id: 'newBatteries',
      label: 'بطاريات جديدة',
      icon: Battery,
      boxes: fixedInventory.newBatteriesBoxes,
      units: fixedInventory.newBatteriesUnits,
      transfer: transfer.newBatteries,
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      id: 'mobilySim',
      label: 'شرائح موبايلي',
      icon: Smartphone,
      boxes: fixedInventory.mobilySimBoxes,
      units: fixedInventory.mobilySimUnits,
      transfer: transfer.mobilySim,
      gradient: 'from-green-500 to-lime-500',
    },
    {
      id: 'stcSim',
      label: 'شرائح STC',
      icon: Smartphone,
      boxes: fixedInventory.stcSimBoxes,
      units: fixedInventory.stcSimUnits,
      transfer: transfer.stcSim,
      gradient: 'from-teal-500 to-cyan-500',
    },
    {
      id: 'zainSim',
      label: 'شرائح زين',
      icon: Smartphone,
      boxes: fixedInventory.zainSimBoxes,
      units: fixedInventory.zainSimUnits,
      transfer: transfer.zainSim,
      gradient: 'from-violet-500 to-purple-500',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl sm:text-2xl font-bold">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <ArrowRight className="h-6 w-6 text-white" />
            </div>
            نقل إلى المخزون المتحرك
          </DialogTitle>
          <DialogDescription className="text-base">
            أدخل الكميات المراد نقلها من المخزون الثابت إلى المتحرك (اختر نوع التعبئة لكل صنف)
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-4">
          {items.map((item) => {
            const Icon = item.icon;
            const available = getAvailableForType(item.boxes, item.units, item.transfer.packagingType);
            
            return (
              <div 
                key={item.id}
                className="space-y-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 bg-gradient-to-r ${item.gradient} rounded-lg`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <Label className="font-semibold text-base">
                      {item.label}
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">
                      كراتين: <span className="font-bold text-foreground">{item.boxes}</span>
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-muted-foreground">
                      وحدات: <span className="font-bold text-foreground">{item.units}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Packaging Type Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">نوع التعبئة</Label>
                    <RadioGroup
                      value={item.transfer.packagingType}
                      onValueChange={(value) => updateItemTransfer(item.id as keyof TransferData, 'packagingType', value as PackagingType)}
                      className="flex gap-4"
                      dir="rtl"
                    >
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem 
                          value="box" 
                          id={`${item.id}-box`}
                          data-testid={`radio-${item.id}-box`}
                        />
                        <Label 
                          htmlFor={`${item.id}-box`} 
                          className="cursor-pointer font-medium text-sm"
                        >
                          كراتين ({item.boxes})
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem 
                          value="unit" 
                          id={`${item.id}-unit`}
                          data-testid={`radio-${item.id}-unit`}
                        />
                        <Label 
                          htmlFor={`${item.id}-unit`} 
                          className="cursor-pointer font-medium text-sm"
                        >
                          وحدات ({item.units})
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Quantity Input */}
                  <div className="space-y-2">
                    <Label htmlFor={`${item.id}-quantity`} className="text-sm text-muted-foreground">
                      الكمية المراد نقلها
                    </Label>
                    <div className="relative">
                      <Input
                        id={`${item.id}-quantity`}
                        type="number"
                        min="0"
                        max={available}
                        value={item.transfer.quantity}
                        onChange={(e) => updateItemTransfer(
                          item.id as keyof TransferData, 
                          'quantity', 
                          Math.max(0, Math.min(available, parseInt(e.target.value) || 0))
                        )}
                        className="h-11 text-lg font-semibold border-2 focus:ring-2"
                        data-testid={`input-transfer-${item.id}`}
                      />
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                        / {available}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t" dir="rtl">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={transferMutation.isPending}
            className="flex-1 sm:flex-initial h-11"
            data-testid="button-cancel-transfer"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={transferMutation.isPending}
            className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-11 font-semibold"
            data-testid="button-confirm-transfer"
          >
            <Package className="w-4 h-4 ml-2" />
            {transferMutation.isPending ? "جاري النقل..." : "نقل الكميات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
