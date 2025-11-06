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
}

interface UpdateMovingInventoryModalProps {
  open: boolean;
  onClose: () => void;
  technicianId: string;
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
    n950Boxes: currentInventory.n950Boxes || 0,
    n950Units: currentInventory.n950Units || 0,
    i9000sBoxes: currentInventory.i9000sBoxes || 0,
    i9000sUnits: currentInventory.i9000sUnits || 0,
    i9100Boxes: currentInventory.i9100Boxes || 0,
    i9100Units: currentInventory.i9100Units || 0,
    rollPaperBoxes: currentInventory.rollPaperBoxes || 0,
    rollPaperUnits: currentInventory.rollPaperUnits || 0,
    stickersBoxes: currentInventory.stickersBoxes || 0,
    stickersUnits: currentInventory.stickersUnits || 0,
    newBatteriesBoxes: currentInventory.newBatteriesBoxes || 0,
    newBatteriesUnits: currentInventory.newBatteriesUnits || 0,
    mobilySimBoxes: currentInventory.mobilySimBoxes || 0,
    mobilySimUnits: currentInventory.mobilySimUnits || 0,
    stcSimBoxes: currentInventory.stcSimBoxes || 0,
    stcSimUnits: currentInventory.stcSimUnits || 0,
    zainSimBoxes: currentInventory.zainSimBoxes || 0,
    zainSimUnits: currentInventory.zainSimUnits || 0,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(
        "PATCH",
        `/api/technicians/${technicianId}`,
        {
          n950Boxes: update.n950Boxes,
          n950Units: update.n950Units,
          i9000sBoxes: update.i9000sBoxes,
          i9000sUnits: update.i9000sUnits,
          i9100Boxes: update.i9100Boxes,
          i9100Units: update.i9100Units,
          rollPaperBoxes: update.rollPaperBoxes,
          rollPaperUnits: update.rollPaperUnits,
          stickersBoxes: update.stickersBoxes,
          stickersUnits: update.stickersUnits,
          newBatteriesBoxes: update.newBatteriesBoxes,
          newBatteriesUnits: update.newBatteriesUnits,
          mobilySimBoxes: update.mobilySimBoxes,
          mobilySimUnits: update.mobilySimUnits,
          stcSimBoxes: update.stcSimBoxes,
          stcSimUnits: update.stcSimUnits,
          zainSimBoxes: update.zainSimBoxes,
          zainSimUnits: update.zainSimUnits,
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

        <div className="space-y-6 py-4">
          {/* N950 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">أجهزة N950</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="n950Boxes" className="text-sm">كراتين</Label>
                  <span className="text-xs text-muted-foreground">
                    الحالي: {currentInventory.n950Boxes || 0}
                  </span>
                </div>
                <Input
                  id="n950Boxes"
                  type="number"
                  min="0"
                  value={update.n950Boxes}
                  onChange={(e) => setUpdate({ ...update, n950Boxes: Math.max(0, parseInt(e.target.value) || 0) })}
                  data-testid="input-update-n950-boxes"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="n950Units" className="text-sm">وحدات</Label>
                  <span className="text-xs text-muted-foreground">
                    الحالي: {currentInventory.n950Units || 0}
                  </span>
                </div>
                <Input
                  id="n950Units"
                  type="number"
                  min="0"
                  value={update.n950Units}
                  onChange={(e) => setUpdate({ ...update, n950Units: Math.max(0, parseInt(e.target.value) || 0) })}
                  data-testid="input-update-n950-units"
                />
              </div>
            </div>
          </div>

          {/* I9000s */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">أجهزة I9000s</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="i9000sBoxes" className="text-sm">كراتين</Label>
                  <span className="text-xs text-muted-foreground">
                    الحالي: {currentInventory.i9000sBoxes || 0}
                  </span>
                </div>
                <Input
                  id="i9000sBoxes"
                  type="number"
                  min="0"
                  value={update.i9000sBoxes}
                  onChange={(e) => setUpdate({ ...update, i9000sBoxes: Math.max(0, parseInt(e.target.value) || 0) })}
                  data-testid="input-update-i9000s-boxes"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="i9000sUnits" className="text-sm">وحدات</Label>
                  <span className="text-xs text-muted-foreground">
                    الحالي: {currentInventory.i9000sUnits || 0}
                  </span>
                </div>
                <Input
                  id="i9000sUnits"
                  type="number"
                  min="0"
                  value={update.i9000sUnits}
                  onChange={(e) => setUpdate({ ...update, i9000sUnits: Math.max(0, parseInt(e.target.value) || 0) })}
                  data-testid="input-update-i9000s-units"
                />
              </div>
            </div>
          </div>

          {/* I9100 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">أجهزة I9100</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="i9100Boxes" className="text-sm">كراتين</Label>
                  <span className="text-xs text-muted-foreground">
                    الحالي: {currentInventory.i9100Boxes || 0}
                  </span>
                </div>
                <Input
                  id="i9100Boxes"
                  type="number"
                  min="0"
                  value={update.i9100Boxes}
                  onChange={(e) => setUpdate({ ...update, i9100Boxes: Math.max(0, parseInt(e.target.value) || 0) })}
                  data-testid="input-update-i9100-boxes"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="i9100Units" className="text-sm">وحدات</Label>
                  <span className="text-xs text-muted-foreground">
                    الحالي: {currentInventory.i9100Units || 0}
                  </span>
                </div>
                <Input
                  id="i9100Units"
                  type="number"
                  min="0"
                  value={update.i9100Units}
                  onChange={(e) => setUpdate({ ...update, i9100Units: Math.max(0, parseInt(e.target.value) || 0) })}
                  data-testid="input-update-i9100-units"
                />
              </div>
            </div>
          </div>

          {/* Roll Paper */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">أوراق رول</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="rollPaperBoxes" className="text-sm">كراتين</Label>
                  <span className="text-xs text-muted-foreground">
                    الحالي: {currentInventory.rollPaperBoxes || 0}
                  </span>
                </div>
                <Input
                  id="rollPaperBoxes"
                  type="number"
                  min="0"
                  value={update.rollPaperBoxes}
                  onChange={(e) => setUpdate({ ...update, rollPaperBoxes: Math.max(0, parseInt(e.target.value) || 0) })}
                  data-testid="input-update-paper-boxes"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="rollPaperUnits" className="text-sm">وحدات</Label>
                  <span className="text-xs text-muted-foreground">
                    الحالي: {currentInventory.rollPaperUnits || 0}
                  </span>
                </div>
                <Input
                  id="rollPaperUnits"
                  type="number"
                  min="0"
                  value={update.rollPaperUnits}
                  onChange={(e) => setUpdate({ ...update, rollPaperUnits: Math.max(0, parseInt(e.target.value) || 0) })}
                  data-testid="input-update-paper-units"
                />
              </div>
            </div>
          </div>

          {/* Stickers */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">ملصقات مدى</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="stickersBoxes" className="text-sm">كراتين</Label>
                  <span className="text-xs text-muted-foreground">
                    الحالي: {currentInventory.stickersBoxes || 0}
                  </span>
                </div>
                <Input
                  id="stickersBoxes"
                  type="number"
                  min="0"
                  value={update.stickersBoxes}
                  onChange={(e) => setUpdate({ ...update, stickersBoxes: Math.max(0, parseInt(e.target.value) || 0) })}
                  data-testid="input-update-stickers-boxes"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="stickersUnits" className="text-sm">وحدات</Label>
                  <span className="text-xs text-muted-foreground">
                    الحالي: {currentInventory.stickersUnits || 0}
                  </span>
                </div>
                <Input
                  id="stickersUnits"
                  type="number"
                  min="0"
                  value={update.stickersUnits}
                  onChange={(e) => setUpdate({ ...update, stickersUnits: Math.max(0, parseInt(e.target.value) || 0) })}
                  data-testid="input-update-stickers-units"
                />
              </div>
            </div>
          </div>

          {/* New Batteries */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">بطاريات جديدة</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="newBatteriesBoxes" className="text-sm">كراتين</Label>
                  <span className="text-xs text-muted-foreground">
                    الحالي: {currentInventory.newBatteriesBoxes || 0}
                  </span>
                </div>
                <Input
                  id="newBatteriesBoxes"
                  type="number"
                  min="0"
                  value={update.newBatteriesBoxes}
                  onChange={(e) => setUpdate({ ...update, newBatteriesBoxes: Math.max(0, parseInt(e.target.value) || 0) })}
                  data-testid="input-update-batteries-boxes"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="newBatteriesUnits" className="text-sm">وحدات</Label>
                  <span className="text-xs text-muted-foreground">
                    الحالي: {currentInventory.newBatteriesUnits || 0}
                  </span>
                </div>
                <Input
                  id="newBatteriesUnits"
                  type="number"
                  min="0"
                  value={update.newBatteriesUnits}
                  onChange={(e) => setUpdate({ ...update, newBatteriesUnits: Math.max(0, parseInt(e.target.value) || 0) })}
                  data-testid="input-update-batteries-units"
                />
              </div>
            </div>
          </div>

          {/* Mobily SIM */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">شرائح موبايلي</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="mobilySimBoxes" className="text-sm">كراتين</Label>
                  <span className="text-xs text-muted-foreground">
                    الحالي: {currentInventory.mobilySimBoxes || 0}
                  </span>
                </div>
                <Input
                  id="mobilySimBoxes"
                  type="number"
                  min="0"
                  value={update.mobilySimBoxes}
                  onChange={(e) => setUpdate({ ...update, mobilySimBoxes: Math.max(0, parseInt(e.target.value) || 0) })}
                  data-testid="input-update-mobily-boxes"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="mobilySimUnits" className="text-sm">وحدات</Label>
                  <span className="text-xs text-muted-foreground">
                    الحالي: {currentInventory.mobilySimUnits || 0}
                  </span>
                </div>
                <Input
                  id="mobilySimUnits"
                  type="number"
                  min="0"
                  value={update.mobilySimUnits}
                  onChange={(e) => setUpdate({ ...update, mobilySimUnits: Math.max(0, parseInt(e.target.value) || 0) })}
                  data-testid="input-update-mobily-units"
                />
              </div>
            </div>
          </div>

          {/* STC SIM */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">شرائح STC</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="stcSimBoxes" className="text-sm">كراتين</Label>
                  <span className="text-xs text-muted-foreground">
                    الحالي: {currentInventory.stcSimBoxes || 0}
                  </span>
                </div>
                <Input
                  id="stcSimBoxes"
                  type="number"
                  min="0"
                  value={update.stcSimBoxes}
                  onChange={(e) => setUpdate({ ...update, stcSimBoxes: Math.max(0, parseInt(e.target.value) || 0) })}
                  data-testid="input-update-stc-boxes"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="stcSimUnits" className="text-sm">وحدات</Label>
                  <span className="text-xs text-muted-foreground">
                    الحالي: {currentInventory.stcSimUnits || 0}
                  </span>
                </div>
                <Input
                  id="stcSimUnits"
                  type="number"
                  min="0"
                  value={update.stcSimUnits}
                  onChange={(e) => setUpdate({ ...update, stcSimUnits: Math.max(0, parseInt(e.target.value) || 0) })}
                  data-testid="input-update-stc-units"
                />
              </div>
            </div>
          </div>

          {/* Zain SIM */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">شرائح زين</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="zainSimBoxes" className="text-sm">كراتين</Label>
                  <span className="text-xs text-muted-foreground">
                    الحالي: {currentInventory.zainSimBoxes || 0}
                  </span>
                </div>
                <Input
                  id="zainSimBoxes"
                  type="number"
                  min="0"
                  value={update.zainSimBoxes}
                  onChange={(e) => setUpdate({ ...update, zainSimBoxes: Math.max(0, parseInt(e.target.value) || 0) })}
                  data-testid="input-update-zain-boxes"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="zainSimUnits" className="text-sm">وحدات</Label>
                  <span className="text-xs text-muted-foreground">
                    الحالي: {currentInventory.zainSimUnits || 0}
                  </span>
                </div>
                <Input
                  id="zainSimUnits"
                  type="number"
                  min="0"
                  value={update.zainSimUnits}
                  onChange={(e) => setUpdate({ ...update, zainSimUnits: Math.max(0, parseInt(e.target.value) || 0) })}
                  data-testid="input-update-zain-units"
                />
              </div>
            </div>
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
