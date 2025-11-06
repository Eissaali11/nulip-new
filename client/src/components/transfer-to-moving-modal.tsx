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
import { ArrowRight, Package, Box, Smartphone, FileText, Sticker, Battery } from "lucide-react";

interface TransferData {
  n950: number;
  i9000s: number;
  i9100: number;
  rollPaper: number;
  stickers: number;
  newBatteries: number;
  mobilySim: number;
  stcSim: number;
  zainSim: number;
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
    n950: 0,
    i9000s: 0,
    i9100: 0,
    rollPaper: 0,
    stickers: 0,
    newBatteries: 0,
    mobilySim: 0,
    stcSim: 0,
    zainSim: 0,
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
        title: "✓ Transfer Successful",
        description: "Quantities transferred from fixed to moving inventory",
      });
      setTransfer({
        n950: 0,
        i9000s: 0,
        i9100: 0,
        rollPaper: 0,
        stickers: 0,
        newBatteries: 0,
        mobilySim: 0,
        stcSim: 0,
        zainSim: 0,
      });
      onClose();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "✗ Transfer Failed",
        description: "An error occurred while transferring quantities",
      });
    },
  });

  const handleTransfer = () => {
    // Validate quantities
    const totalN950 = getTotalAvailable(fixedInventory.n950Boxes, fixedInventory.n950Units);
    const totalI9000s = getTotalAvailable(fixedInventory.i9000sBoxes, fixedInventory.i9000sUnits);
    const totalI9100 = getTotalAvailable(fixedInventory.i9100Boxes, fixedInventory.i9100Units);
    const totalPaper = getTotalAvailable(fixedInventory.rollPaperBoxes, fixedInventory.rollPaperUnits);
    const totalStickers = getTotalAvailable(fixedInventory.stickersBoxes, fixedInventory.stickersUnits);
    const totalBatteries = getTotalAvailable(fixedInventory.newBatteriesBoxes, fixedInventory.newBatteriesUnits);
    const totalMobily = getTotalAvailable(fixedInventory.mobilySimBoxes, fixedInventory.mobilySimUnits);
    const totalStc = getTotalAvailable(fixedInventory.stcSimBoxes, fixedInventory.stcSimUnits);
    const totalZain = getTotalAvailable(fixedInventory.zainSimBoxes, fixedInventory.zainSimUnits);

    if (transfer.n950 > totalN950 || transfer.i9000s > totalI9000s || transfer.i9100 > totalI9100 ||
        transfer.rollPaper > totalPaper || transfer.stickers > totalStickers || transfer.newBatteries > totalBatteries ||
        transfer.mobilySim > totalMobily || transfer.stcSim > totalStc || transfer.zainSim > totalZain) {
      toast({
        variant: "destructive",
        title: "Quantity Error",
        description: "Requested quantity exceeds available stock",
      });
      return;
    }

    if (transfer.n950 === 0 && transfer.i9000s === 0 && transfer.i9100 === 0 && transfer.rollPaper === 0 && 
        transfer.stickers === 0 && transfer.newBatteries === 0 && transfer.mobilySim === 0 && 
        transfer.stcSim === 0 && transfer.zainSim === 0) {
      toast({
        variant: "destructive",
        title: "No Quantities",
        description: "Please enter quantities to transfer",
      });
      return;
    }

    transferMutation.mutate();
  };

  const items = [
    {
      id: 'n950',
      label: 'N950 Devices',
      icon: Box,
      available: getTotalAvailable(fixedInventory.n950Boxes, fixedInventory.n950Units),
      value: transfer.n950,
      onChange: (val: number) => setTransfer({ ...transfer, n950: val }),
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'i9000s',
      label: 'I9000s Devices',
      icon: Box,
      available: getTotalAvailable(fixedInventory.i9000sBoxes, fixedInventory.i9000sUnits),
      value: transfer.i9000s,
      onChange: (val: number) => setTransfer({ ...transfer, i9000s: val }),
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      id: 'i9100',
      label: 'I9100 Devices',
      icon: Box,
      available: getTotalAvailable(fixedInventory.i9100Boxes, fixedInventory.i9100Units),
      value: transfer.i9100,
      onChange: (val: number) => setTransfer({ ...transfer, i9100: val }),
      gradient: 'from-indigo-500 to-blue-500',
    },
    {
      id: 'rollPaper',
      label: 'Roll Sheets',
      icon: FileText,
      available: getTotalAvailable(fixedInventory.rollPaperBoxes, fixedInventory.rollPaperUnits),
      value: transfer.rollPaper,
      onChange: (val: number) => setTransfer({ ...transfer, rollPaper: val }),
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      id: 'stickers',
      label: 'Madai Stickers',
      icon: Sticker,
      available: getTotalAvailable(fixedInventory.stickersBoxes, fixedInventory.stickersUnits),
      value: transfer.stickers,
      onChange: (val: number) => setTransfer({ ...transfer, stickers: val }),
      gradient: 'from-rose-500 to-red-500',
    },
    {
      id: 'newBatteries',
      label: 'New Batteries',
      icon: Battery,
      available: getTotalAvailable(fixedInventory.newBatteriesBoxes, fixedInventory.newBatteriesUnits),
      value: transfer.newBatteries,
      onChange: (val: number) => setTransfer({ ...transfer, newBatteries: val }),
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      id: 'mobilySim',
      label: 'SIM Mobily',
      icon: Smartphone,
      available: getTotalAvailable(fixedInventory.mobilySimBoxes, fixedInventory.mobilySimUnits),
      value: transfer.mobilySim,
      onChange: (val: number) => setTransfer({ ...transfer, mobilySim: val }),
      gradient: 'from-green-500 to-lime-500',
    },
    {
      id: 'stcSim',
      label: 'SIM STC',
      icon: Smartphone,
      available: getTotalAvailable(fixedInventory.stcSimBoxes, fixedInventory.stcSimUnits),
      value: transfer.stcSim,
      onChange: (val: number) => setTransfer({ ...transfer, stcSim: val }),
      gradient: 'from-teal-500 to-cyan-500',
    },
    {
      id: 'zainSim',
      label: 'SIM Zain',
      icon: Smartphone,
      available: getTotalAvailable(fixedInventory.zainSimBoxes, fixedInventory.zainSimUnits),
      value: transfer.zainSim,
      onChange: (val: number) => setTransfer({ ...transfer, zainSim: val }),
      gradient: 'from-violet-500 to-purple-500',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl sm:text-2xl font-bold">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <ArrowRight className="h-6 w-6 text-white" />
            </div>
            Transfer to Moving Inventory
          </DialogTitle>
          <DialogDescription className="text-base">
            Enter quantities to transfer from fixed to moving inventory
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id}
                className="space-y-2 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 bg-gradient-to-r ${item.gradient} rounded-lg`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <Label htmlFor={item.id} className="font-semibold">
                      {item.label}
                    </Label>
                  </div>
                  <span className={`text-sm font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                    {item.available}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Available: {item.available}</span>
                  <Input
                    id={item.id}
                    type="number"
                    min="0"
                    max={item.available}
                    value={item.value}
                    onChange={(e) => item.onChange(Math.max(0, Math.min(item.available, parseInt(e.target.value) || 0)))}
                    className="h-11 text-lg font-semibold border-2 focus:ring-2"
                    data-testid={`input-transfer-${item.id}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={transferMutation.isPending}
            className="flex-1 sm:flex-initial h-11"
            data-testid="button-cancel-transfer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={transferMutation.isPending}
            className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-11 font-semibold"
            data-testid="button-confirm-transfer"
          >
            <Package className="w-4 h-4 ml-2" />
            {transferMutation.isPending ? "Transferring..." : "Transfer Quantities"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
