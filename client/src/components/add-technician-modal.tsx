import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertTechnicianInventorySchema } from "@shared/schema";
import { useAuth } from "@/lib/auth";

const formSchema = insertTechnicianInventorySchema.extend({
  n950Devices: z.number().min(0, "الكمية يجب أن تكون صفر أو أكثر"),
  i900Devices: z.number().min(0, "الكمية يجب أن تكون صفر أو أكثر"),
  rollPaper: z.number().min(0, "الكمية يجب أن تكون صفر أو أكثر"),
  stickers: z.number().min(0, "الكمية يجب أن تكون صفر أو أكثر"),
  mobilySim: z.number().min(0, "الكمية يجب أن تكون صفر أو أكثر"),
  stcSim: z.number().min(0, "الكمية يجب أن تكون صفر أو أكثر"),
  zainSim: z.number().min(0, "الكمية يجب أن تكون صفر أو أكثر"),
}).omit({ technicianName: true });

type FormData = z.infer<typeof formSchema>;

interface AddTechnicianModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddTechnicianModal({ open, onOpenChange }: AddTechnicianModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      city: "",
      n950Devices: 0,
      i900Devices: 0,
      rollPaper: 0,
      stickers: 0,
      mobilySim: 0,
      stcSim: 0,
      zainSim: 0,
      notes: "",
    },
  });

  const addTechMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const dataWithTechnicianName = {
        ...data,
        technicianName: user?.fullName || ""
      };
      const response = await apiRequest("POST", "/api/technicians", dataWithTechnicianName);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      toast({
        title: "تم إضافة بيانات الفني بنجاح",
        description: "تم إضافة البيانات الجديدة للفني",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إضافة البيانات",
        description: error.message || "حدث خطأ أثناء إضافة البيانات",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    addTechMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">إضافة بيانات فني</DialogTitle>
          <DialogDescription className="text-sm">
            أدخل بيانات الفني الجديد وتجهيزاته
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
            {/* عرض اسم الفني المسجل */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">اسم الفني:</span>
                <span className="text-lg font-bold text-slate-800 dark:text-white">{user?.fullName || "غير محدد"}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">سيتم إضافة البيانات باسمك تلقائياً</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدينة</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="أدخل اسم المدينة"
                        {...field}
                        data-testid="input-city"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="n950Devices"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>أجهزة N950</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        value={field.value || 0}
                        data-testid="input-n950"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="i900Devices"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>أجهزة I900</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        value={field.value || 0}
                        data-testid="input-i900"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="rollPaper"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>أوراق رول</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        value={field.value || 0}
                        data-testid="input-roll-paper"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stickers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ملصقات مدى</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        value={field.value || 0}
                        data-testid="input-stickers"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="mobilySim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شرائح موبايلي</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        value={field.value || 0}
                        data-testid="input-mobily"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stcSim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شرائح STC</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        value={field.value || 0}
                        data-testid="input-stc"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zainSim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شرائح زين</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        value={field.value || 0}
                        data-testid="input-zain"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أضف ملاحظات إضافية..."
                      {...field}
                      value={field.value || ""}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse pt-3 sm:pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                className="flex-1 text-sm sm:text-base"
                data-testid="button-cancel"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={addTechMutation.isPending}
                className="flex-1 text-sm sm:text-base"
                data-testid="button-submit"
              >
                {addTechMutation.isPending ? "جاري الإضافة..." : "إضافة البيانات"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
