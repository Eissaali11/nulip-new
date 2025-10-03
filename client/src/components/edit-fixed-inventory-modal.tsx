import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const fixedInventorySchema = z.object({
  n950Boxes: z.coerce.number().min(0, "يجب أن يكون العدد 0 أو أكثر"),
  n950Units: z.coerce.number().min(0, "يجب أن يكون العدد 0 أو أكثر"),
  i900Boxes: z.coerce.number().min(0, "يجب أن يكون العدد 0 أو أكثر"),
  i900Units: z.coerce.number().min(0, "يجب أن يكون العدد 0 أو أكثر"),
  rollPaperBoxes: z.coerce.number().min(0, "يجب أن يكون العدد 0 أو أكثر"),
  rollPaperUnits: z.coerce.number().min(0, "يجب أن يكون العدد 0 أو أكثر"),
  stickersBoxes: z.coerce.number().min(0, "يجب أن يكون العدد 0 أو أكثر"),
  stickersUnits: z.coerce.number().min(0, "يجب أن يكون العدد 0 أو أكثر"),
  mobilySimBoxes: z.coerce.number().min(0, "يجب أن يكون العدد 0 أو أكثر"),
  mobilySimUnits: z.coerce.number().min(0, "يجب أن يكون العدد 0 أو أكثر"),
  stcSimBoxes: z.coerce.number().min(0, "يجب أن يكون العدد 0 أو أكثر"),
  stcSimUnits: z.coerce.number().min(0, "يجب أن يكون العدد 0 أو أكثر"),
});

type FixedInventoryForm = z.infer<typeof fixedInventorySchema>;

interface EditFixedInventoryModalProps {
  open: boolean;
  onClose: () => void;
  technicianId: string;
  technicianName: string;
}

export default function EditFixedInventoryModal({
  open,
  onClose,
  technicianId,
  technicianName,
}: EditFixedInventoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventory, isLoading: loadingInventory } = useQuery({
    queryKey: [`/api/technician-fixed-inventory/${technicianId}`],
    enabled: open && !!technicianId,
  });

  const form = useForm<FixedInventoryForm>({
    resolver: zodResolver(fixedInventorySchema),
    defaultValues: {
      n950Boxes: 0,
      n950Units: 0,
      i900Boxes: 0,
      i900Units: 0,
      rollPaperBoxes: 0,
      rollPaperUnits: 0,
      stickersBoxes: 0,
      stickersUnits: 0,
      mobilySimBoxes: 0,
      mobilySimUnits: 0,
      stcSimBoxes: 0,
      stcSimUnits: 0,
    },
  });

  // Update form when inventory data is loaded
  useEffect(() => {
    if (inventory) {
      form.reset({
        n950Boxes: inventory.n950Boxes || 0,
        n950Units: inventory.n950Units || 0,
        i900Boxes: inventory.i900Boxes || 0,
        i900Units: inventory.i900Units || 0,
        rollPaperBoxes: inventory.rollPaperBoxes || 0,
        rollPaperUnits: inventory.rollPaperUnits || 0,
        stickersBoxes: inventory.stickersBoxes || 0,
        stickersUnits: inventory.stickersUnits || 0,
        mobilySimBoxes: inventory.mobilySimBoxes || 0,
        mobilySimUnits: inventory.mobilySimUnits || 0,
        stcSimBoxes: inventory.stcSimBoxes || 0,
        stcSimUnits: inventory.stcSimUnits || 0,
      });
    }
  }, [inventory, form]);

  const mutation = useMutation({
    mutationFn: async (data: FixedInventoryForm) => {
      return await apiRequest(
        `/api/technician-fixed-inventory/${technicianId}`,
        "PUT",
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fixed-inventory-dashboard'] });
      queryClient.invalidateQueries({ queryKey: [`/api/technician-fixed-inventory/${technicianId}`] });
      toast({
        title: "تم التحديث بنجاح",
        description: `تم تحديث المخزون الثابت لـ ${technicianName}`,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ في التحديث",
        description: error.message || "حدث خطأ أثناء تحديث المخزون",
      });
    },
  });

  const onSubmit = (data: FixedInventoryForm) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            تعديل المخزون الثابت - {technicianName}
          </DialogTitle>
        </DialogHeader>

        {loadingInventory ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* N950 Devices */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">أجهزة N950</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="n950Boxes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كراتين</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            data-testid="input-n950-boxes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="n950Units"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مفرد</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            data-testid="input-n950-units"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* I900 Devices */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">أجهزة I900</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="i900Boxes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كراتين</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            data-testid="input-i900-boxes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="i900Units"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مفرد</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            data-testid="input-i900-units"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Roll Paper */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">أوراق رول</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rollPaperBoxes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كراتين</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            data-testid="input-paper-boxes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rollPaperUnits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مفرد</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            data-testid="input-paper-units"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Stickers */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">ملصقات مداى</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stickersBoxes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كراتين</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            data-testid="input-stickers-boxes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stickersUnits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مفرد</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            data-testid="input-stickers-units"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Mobily SIM */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">شرائح موبايلي</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mobilySimBoxes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كراتين</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            data-testid="input-mobily-boxes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobilySimUnits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مفرد</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            data-testid="input-mobily-units"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* STC SIM */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">شرائح STC</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stcSimBoxes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كراتين</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            data-testid="input-stc-boxes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stcSimUnits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مفرد</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            data-testid="input-stc-units"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={mutation.isPending}
                  data-testid="button-cancel"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  data-testid="button-save"
                >
                  {mutation.isPending && (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  )}
                  حفظ التغييرات
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
