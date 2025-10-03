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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, Package } from "lucide-react";

interface TransferData {
  n950: number;
  i900: number;
  rollPaper: number;
  stickers: number;
  mobilySim: number;
  stcSim: number;
}

interface TransferToMovingModalProps {
  open: boolean;
  onClose: () => void;
  technicianId: string;
  fixedInventory: {
    n950Boxes: number;
    n950Units: number;
    i900Boxes: number;
    i900Units: number;
    rollPaperBoxes: number;
    rollPaperUnits: number;
    stickersBoxes: number;
    stickersUnits: number;
    mobilySimBoxes: number;
    mobilySimUnits: number;
    stcSimBoxes: number;
    stcSimUnits: number;
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
    n950: 0,
    i900: 0,
    rollPaper: 0,
    stickers: 0,
    mobilySim: 0,
    stcSim: 0,
  });

  const getTotalAvailable = (boxes: number, units: number) => boxes + units;

  const transferMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(
        "POST",
        `/api/stock-transfer`,
        {
          technicianId,
          ...transfer,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/technician-fixed-inventory/${technicianId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/technicians/${technicianId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fixed-inventory-dashboard'] });
      toast({
        title: "تم النقل بنجاح",
        description: "تم نقل الكميات من المخزون الثابت إلى المتحرك",
      });
      setTransfer({
        n950: 0,
        i900: 0,
        rollPaper: 0,
        stickers: 0,
        mobilySim: 0,
        stcSim: 0,
      });
      onClose();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطأ في النقل",
        description: "حدث خطأ أثناء نقل الكميات",
      });
    },
  });

  const handleTransfer = () => {
    // Validate quantities
    const totalN950 = getTotalAvailable(fixedInventory.n950Boxes, fixedInventory.n950Units);
    const totalI900 = getTotalAvailable(fixedInventory.i900Boxes, fixedInventory.i900Units);
    const totalPaper = getTotalAvailable(fixedInventory.rollPaperBoxes, fixedInventory.rollPaperUnits);
    const totalStickers = getTotalAvailable(fixedInventory.stickersBoxes, fixedInventory.stickersUnits);
    const totalMobily = getTotalAvailable(fixedInventory.mobilySimBoxes, fixedInventory.mobilySimUnits);
    const totalStc = getTotalAvailable(fixedInventory.stcSimBoxes, fixedInventory.stcSimUnits);

    if (transfer.n950 > totalN950 || transfer.i900 > totalI900 || 
        transfer.rollPaper > totalPaper || transfer.stickers > totalStickers ||
        transfer.mobilySim > totalMobily || transfer.stcSim > totalStc) {
      toast({
        variant: "destructive",
        title: "خطأ في الكمية",
        description: "الكمية المطلوبة أكبر من المتاح",
      });
      return;
    }

    if (transfer.n950 === 0 && transfer.i900 === 0 && transfer.rollPaper === 0 && 
        transfer.stickers === 0 && transfer.mobilySim === 0 && transfer.stcSim === 0) {
      toast({
        variant: "destructive",
        title: "لا توجد كميات للنقل",
        description: "يرجى إدخال كميات للنقل",
      });
      return;
    }

    transferMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ArrowRight className="h-5 w-5" />
            نقل من المخزون الثابت إلى المتحرك
          </DialogTitle>
          <DialogDescription>
            أدخل الكميات التي تريد نقلها من المخزون الثابت إلى المخزون المتحرك
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* N950 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="n950">أجهزة N950</Label>
              <span className="text-sm text-muted-foreground">
                المتاح: {getTotalAvailable(fixedInventory.n950Boxes, fixedInventory.n950Units)}
              </span>
            </div>
            <Input
              id="n950"
              type="number"
              min="0"
              max={getTotalAvailable(fixedInventory.n950Boxes, fixedInventory.n950Units)}
              value={transfer.n950}
              onChange={(e) => setTransfer({ ...transfer, n950: Math.max(0, parseInt(e.target.value) || 0) })}
              data-testid="input-transfer-n950"
            />
          </div>

          {/* I900 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="i900">أجهزة I900</Label>
              <span className="text-sm text-muted-foreground">
                المتاح: {getTotalAvailable(fixedInventory.i900Boxes, fixedInventory.i900Units)}
              </span>
            </div>
            <Input
              id="i900"
              type="number"
              min="0"
              max={getTotalAvailable(fixedInventory.i900Boxes, fixedInventory.i900Units)}
              value={transfer.i900}
              onChange={(e) => setTransfer({ ...transfer, i900: Math.max(0, parseInt(e.target.value) || 0) })}
              data-testid="input-transfer-i900"
            />
          </div>

          {/* Roll Paper */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="rollPaper">أوراق رول</Label>
              <span className="text-sm text-muted-foreground">
                المتاح: {getTotalAvailable(fixedInventory.rollPaperBoxes, fixedInventory.rollPaperUnits)}
              </span>
            </div>
            <Input
              id="rollPaper"
              type="number"
              min="0"
              max={getTotalAvailable(fixedInventory.rollPaperBoxes, fixedInventory.rollPaperUnits)}
              value={transfer.rollPaper}
              onChange={(e) => setTransfer({ ...transfer, rollPaper: Math.max(0, parseInt(e.target.value) || 0) })}
              data-testid="input-transfer-paper"
            />
          </div>

          {/* Stickers */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="stickers">ملصقات مدى</Label>
              <span className="text-sm text-muted-foreground">
                المتاح: {getTotalAvailable(fixedInventory.stickersBoxes, fixedInventory.stickersUnits)}
              </span>
            </div>
            <Input
              id="stickers"
              type="number"
              min="0"
              max={getTotalAvailable(fixedInventory.stickersBoxes, fixedInventory.stickersUnits)}
              value={transfer.stickers}
              onChange={(e) => setTransfer({ ...transfer, stickers: Math.max(0, parseInt(e.target.value) || 0) })}
              data-testid="input-transfer-stickers"
            />
          </div>

          {/* Mobily SIM */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="mobilySim">شرائح موبايلي</Label>
              <span className="text-sm text-muted-foreground">
                المتاح: {getTotalAvailable(fixedInventory.mobilySimBoxes, fixedInventory.mobilySimUnits)}
              </span>
            </div>
            <Input
              id="mobilySim"
              type="number"
              min="0"
              max={getTotalAvailable(fixedInventory.mobilySimBoxes, fixedInventory.mobilySimUnits)}
              value={transfer.mobilySim}
              onChange={(e) => setTransfer({ ...transfer, mobilySim: Math.max(0, parseInt(e.target.value) || 0) })}
              data-testid="input-transfer-mobily"
            />
          </div>

          {/* STC SIM */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="stcSim">شرائح STC</Label>
              <span className="text-sm text-muted-foreground">
                المتاح: {getTotalAvailable(fixedInventory.stcSimBoxes, fixedInventory.stcSimUnits)}
              </span>
            </div>
            <Input
              id="stcSim"
              type="number"
              min="0"
              max={getTotalAvailable(fixedInventory.stcSimBoxes, fixedInventory.stcSimUnits)}
              value={transfer.stcSim}
              onChange={(e) => setTransfer({ ...transfer, stcSim: Math.max(0, parseInt(e.target.value) || 0) })}
              data-testid="input-transfer-stc"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={transferMutation.isPending}
            data-testid="button-cancel-transfer"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={transferMutation.isPending}
            data-testid="button-confirm-transfer"
          >
            <Package className="w-4 h-4 ml-2" />
            نقل الكميات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
