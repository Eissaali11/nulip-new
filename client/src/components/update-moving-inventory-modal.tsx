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
import { PlusCircle } from "lucide-react";

interface UpdateData {
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

interface UpdateMovingInventoryModalProps {
  open: boolean;
  onClose: () => void;
  technicianId: string;
  currentInventory: {
    n950Devices: number;
    i9000sDevices: number;
    i9100Devices: number;
    rollPaper: number;
    stickers: number;
    newBatteries: number;
    mobilySim: number;
    stcSim: number;
    zainSim: number;
  };
}

export function UpdateMovingInventoryModal({
  open,
  onClose,
  technicianId,
  currentInventory,
}: UpdateMovingInventoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [update, setUpdate] = useState<UpdateData>({
    n950: currentInventory.n950Devices || 0,
    i9000s: currentInventory.i9000sDevices || 0,
    i9100: currentInventory.i9100Devices || 0,
    rollPaper: currentInventory.rollPaper || 0,
    stickers: currentInventory.stickers || 0,
    newBatteries: currentInventory.newBatteries || 0,
    mobilySim: currentInventory.mobilySim || 0,
    stcSim: currentInventory.stcSim || 0,
    zainSim: currentInventory.zainSim || 0,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(
        "PATCH",
        `/api/technicians/${technicianId}`,
        {
          n950Devices: update.n950,
          i9000sDevices: update.i9000s,
          i9100Devices: update.i9100,
          rollPaper: update.rollPaper,
          stickers: update.stickers,
          newBatteries: update.newBatteries,
          mobilySim: update.mobilySim,
          stcSim: update.stcSim,
          zainSim: update.zainSim,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/technicians/${technicianId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث المخزون المتحرك",
      });
      onClose();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث المخزون",
      });
    },
  });

  const handleUpdate = () => {
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <PlusCircle className="h-5 w-5" />
            تحديث المخزون المتحرك
          </DialogTitle>
          <DialogDescription>
            أدخل الكميات الجديدة للمخزون المتحرك
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* N950 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="n950">أجهزة N950</Label>
              <span className="text-sm text-muted-foreground">
                الحالي: {currentInventory.n950Devices || 0}
              </span>
            </div>
            <Input
              id="n950"
              type="number"
              min="0"
              value={update.n950}
              onChange={(e) => setUpdate({ ...update, n950: Math.max(0, parseInt(e.target.value) || 0) })}
              data-testid="input-update-n950"
            />
          </div>

          {/* I9000s */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="i9000s">أجهزة I9000s</Label>
              <span className="text-sm text-muted-foreground">
                الحالي: {currentInventory.i9000sDevices || 0}
              </span>
            </div>
            <Input
              id="i9000s"
              type="number"
              min="0"
              value={update.i9000s}
              onChange={(e) => setUpdate({ ...update, i9000s: Math.max(0, parseInt(e.target.value) || 0) })}
              data-testid="input-update-i9000s"
            />
          </div>

          {/* I9100 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="i9100">أجهزة I9100</Label>
              <span className="text-sm text-muted-foreground">
                الحالي: {currentInventory.i9100Devices || 0}
              </span>
            </div>
            <Input
              id="i9100"
              type="number"
              min="0"
              value={update.i9100}
              onChange={(e) => setUpdate({ ...update, i9100: Math.max(0, parseInt(e.target.value) || 0) })}
              data-testid="input-update-i9100"
            />
          </div>

          {/* Roll Paper */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="rollPaper">أوراق رول</Label>
              <span className="text-sm text-muted-foreground">
                الحالي: {currentInventory.rollPaper || 0}
              </span>
            </div>
            <Input
              id="rollPaper"
              type="number"
              min="0"
              value={update.rollPaper}
              onChange={(e) => setUpdate({ ...update, rollPaper: Math.max(0, parseInt(e.target.value) || 0) })}
              data-testid="input-update-paper"
            />
          </div>

          {/* Stickers */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="stickers">ملصقات مدى</Label>
              <span className="text-sm text-muted-foreground">
                الحالي: {currentInventory.stickers || 0}
              </span>
            </div>
            <Input
              id="stickers"
              type="number"
              min="0"
              value={update.stickers}
              onChange={(e) => setUpdate({ ...update, stickers: Math.max(0, parseInt(e.target.value) || 0) })}
              data-testid="input-update-stickers"
            />
          </div>

          {/* New Batteries */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="newBatteries">بطاريات جديدة</Label>
              <span className="text-sm text-muted-foreground">
                الحالي: {currentInventory.newBatteries || 0}
              </span>
            </div>
            <Input
              id="newBatteries"
              type="number"
              min="0"
              value={update.newBatteries}
              onChange={(e) => setUpdate({ ...update, newBatteries: Math.max(0, parseInt(e.target.value) || 0) })}
              data-testid="input-update-batteries"
            />
          </div>

          {/* Mobily SIM */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="mobilySim">شرائح موبايلي</Label>
              <span className="text-sm text-muted-foreground">
                الحالي: {currentInventory.mobilySim || 0}
              </span>
            </div>
            <Input
              id="mobilySim"
              type="number"
              min="0"
              value={update.mobilySim}
              onChange={(e) => setUpdate({ ...update, mobilySim: Math.max(0, parseInt(e.target.value) || 0) })}
              data-testid="input-update-mobily"
            />
          </div>

          {/* STC SIM */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="stcSim">شرائح STC</Label>
              <span className="text-sm text-muted-foreground">
                الحالي: {currentInventory.stcSim || 0}
              </span>
            </div>
            <Input
              id="stcSim"
              type="number"
              min="0"
              value={update.stcSim}
              onChange={(e) => setUpdate({ ...update, stcSim: Math.max(0, parseInt(e.target.value) || 0) })}
              data-testid="input-update-stc"
            />
          </div>

          {/* Zain SIM */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="zainSim">شرائح زين</Label>
              <span className="text-sm text-muted-foreground">
                الحالي: {currentInventory.zainSim || 0}
              </span>
            </div>
            <Input
              id="zainSim"
              type="number"
              min="0"
              value={update.zainSim}
              onChange={(e) => setUpdate({ ...update, zainSim: Math.max(0, parseInt(e.target.value) || 0) })}
              data-testid="input-update-zain"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={updateMutation.isPending}
            data-testid="button-cancel-update"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={updateMutation.isPending}
            data-testid="button-confirm-update"
          >
            <PlusCircle className="w-4 h-4 ml-2" />
            حفظ التغييرات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
