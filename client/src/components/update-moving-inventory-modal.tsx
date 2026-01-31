import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useActiveItemTypes } from "@/hooks/use-item-types";

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

const legacyFieldMapping: Record<string, { boxes: string; units: string }> = {
  n950: { boxes: "n950Boxes", units: "n950Units" },
  i9000s: { boxes: "i9000sBoxes", units: "i9000sUnits" },
  i9100: { boxes: "i9100Boxes", units: "i9100Units" },
  rollPaper: { boxes: "rollPaperBoxes", units: "rollPaperUnits" },
  stickers: { boxes: "stickersBoxes", units: "stickersUnits" },
  newBatteries: { boxes: "newBatteriesBoxes", units: "newBatteriesUnits" },
  mobilySim: { boxes: "mobilySimBoxes", units: "mobilySimUnits" },
  stcSim: { boxes: "stcSimBoxes", units: "stcSimUnits" },
  zainSim: { boxes: "zainSimBoxes", units: "zainSimUnits" },
};

export function UpdateMovingInventoryModal({
  open,
  onClose,
  technicianId,
  currentInventory,
}: UpdateMovingInventoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: itemTypes } = useActiveItemTypes();
  const { data: movingEntries } = useQuery<{ itemTypeId: string; boxes: number; units: number }[]>({
    queryKey: ['/api/technician-moving-entries', technicianId],
    enabled: !!technicianId,
  });

  const [entryUpdates, setEntryUpdates] = useState<Record<string, { boxes: number; units: number }>>({});

  useEffect(() => {
    if (!itemTypes) return;

    const initial: Record<string, { boxes: number; units: number }> = {};
    const entriesMap = new Map(movingEntries?.map(e => [e.itemTypeId, e]) || []);

    for (const itemType of itemTypes.filter(it => it.isActive && it.isVisible)) {
      const entry = entriesMap.get(itemType.id);
      if (entry) {
        initial[itemType.id] = { boxes: entry.boxes, units: entry.units };
      } else {
        const legacy = legacyFieldMapping[itemType.id];
        if (legacy && currentInventory) {
          initial[itemType.id] = {
            boxes: (currentInventory as any)[legacy.boxes] || 0,
            units: (currentInventory as any)[legacy.units] || 0,
          };
        } else {
          initial[itemType.id] = { boxes: 0, units: 0 };
        }
      }
    }

    setEntryUpdates(initial);
  }, [itemTypes, movingEntries, currentInventory]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(entryUpdates).map(([itemTypeId, values]) => ({
        itemTypeId,
        boxes: values.boxes,
        units: values.units,
      }));

      const legacyFields: Record<string, number> = {};
      for (const [itemTypeId, values] of Object.entries(entryUpdates)) {
        const legacy = legacyFieldMapping[itemTypeId];
        if (legacy) {
          legacyFields[legacy.boxes] = values.boxes;
          legacyFields[legacy.units] = values.units;
        }
      }

      await apiRequest("POST", `/api/technician-moving-entries/${technicianId}`, { entries });

      return await apiRequest("PATCH", `/api/technicians/${technicianId}`, legacyFields);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/technicians/${technicianId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/all-technicians-inventory'] });
      queryClient.invalidateQueries({ queryKey: [`/api/technician-inventory/${technicianId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/technician-moving-entries', technicianId] });
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

  const handleBoxesChange = (itemTypeId: string, value: number) => {
    setEntryUpdates(prev => ({
      ...prev,
      [itemTypeId]: {
        ...prev[itemTypeId],
        boxes: Math.max(0, value),
      },
    }));
  };

  const handleUnitsChange = (itemTypeId: string, value: number) => {
    setEntryUpdates(prev => ({
      ...prev,
      [itemTypeId]: {
        ...prev[itemTypeId],
        units: Math.max(0, value),
      },
    }));
  };

  const getCurrentValue = (itemTypeId: string): { boxes: number; units: number } => {
    const legacy = legacyFieldMapping[itemTypeId];
    if (legacy && currentInventory) {
      return {
        boxes: (currentInventory as any)[legacy.boxes] || 0,
        units: (currentInventory as any)[legacy.units] || 0,
      };
    }
    return { boxes: 0, units: 0 };
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
          {itemTypes?.filter(it => it.isActive && it.isVisible).map((itemType) => {
            const currentValues = getCurrentValue(itemType.id);
            const updateValues = entryUpdates[itemType.id] || { boxes: 0, units: 0 };

            return (
              <div key={itemType.id} className="space-y-3">
                <Label className="text-base font-semibold">{itemType.nameAr}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor={`${itemType.id}-boxes`} className="text-sm">كراتين</Label>
                      <span className="text-xs text-muted-foreground">
                        الحالي: {currentValues.boxes}
                      </span>
                    </div>
                    <Input
                      id={`${itemType.id}-boxes`}
                      type="number"
                      min="0"
                      value={updateValues.boxes}
                      onChange={(e) => handleBoxesChange(itemType.id, parseInt(e.target.value) || 0)}
                      data-testid={`input-update-${itemType.id}-boxes`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor={`${itemType.id}-units`} className="text-sm">وحدات</Label>
                      <span className="text-xs text-muted-foreground">
                        الحالي: {currentValues.units}
                      </span>
                    </div>
                    <Input
                      id={`${itemType.id}-units`}
                      type="number"
                      min="0"
                      value={updateValues.units}
                      onChange={(e) => handleUnitsChange(itemType.id, parseInt(e.target.value) || 0)}
                      data-testid={`input-update-${itemType.id}-units`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
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
