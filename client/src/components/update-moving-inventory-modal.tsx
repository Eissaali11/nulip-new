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
  i900: number;
  rollPaper: number;
  stickers: number;
  mobilySim: number;
  stcSim: number;
}

interface UpdateMovingInventoryModalProps {
  open: boolean;
  onClose: () => void;
  technicianId: string;
  currentInventory: {
    n950Devices: number;
    i900Devices: number;
    rollPaper: number;
    stickers: number;
    mobilySim: number;
    stcSim: number;
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
    n950: 0,
    i900: 0,
    rollPaper: 0,
    stickers: 0,
    mobilySim: 0,
    stcSim: 0,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Direct update to moving inventory only
      return await apiRequest(
        "PATCH",
        `/api/technicians/${technicianId}`,
        {
          n950Devices: update.n950,
          i900Devices: update.i900,
          rollPaper: update.rollPaper,
          stickers: update.stickers,
          mobilySim: update.mobilySim,
          stcSim: update.stcSim,
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
      setUpdate({
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
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث المخزون",
      });
    },
  });

  const handleUpdate = () => {
    // Validate that at least one field has a value
    if (update.n950 === 0 && update.i900 === 0 && update.rollPaper === 0 && 
        update.stickers === 0 && update.mobilySim === 0 && update.stcSim === 0) {
      toast({
        variant: "destructive",
        title: "لا توجد كميات للتحديث",
        description: "يرجى إدخال كميات للتحديث",
      });
      return;
    }

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
                الحالي: {currentInventory.n950Devices}
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

          {/* I900 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="i900">أجهزة I900</Label>
              <span className="text-sm text-muted-foreground">
                الحالي: {currentInventory.i900Devices}
              </span>
            </div>
            <Input
              id="i900"
              type="number"
              min="0"
              value={update.i900}
              onChange={(e) => setUpdate({ ...update, i900: Math.max(0, parseInt(e.target.value) || 0) })}
              data-testid="input-update-i900"
            />
          </div>

          {/* Roll Paper */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="rollPaper">أوراق رول</Label>
              <span className="text-sm text-muted-foreground">
                الحالي: {currentInventory.rollPaper}
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
                الحالي: {currentInventory.stickers}
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

          {/* Mobily SIM */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="mobilySim">شرائح موبايلي</Label>
              <span className="text-sm text-muted-foreground">
                الحالي: {currentInventory.mobilySim}
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
                الحالي: {currentInventory.stcSim}
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
