import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import type { UserSafe } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const editUserFormSchema = insertUserSchema.extend({
  city: z.string().optional(),
  password: z.string().optional(),
});

type EditUserFormData = z.infer<typeof editUserFormSchema>;

export function EditUserModal({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserSafe | null;
}) {
  const { toast } = useToast();

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
      city: "",
      role: "employee",
      isActive: true,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        email: user.email,
        password: "", // Don't show password
        fullName: user.fullName,
        city: user.city || "",
        role: user.role,
        isActive: user.isActive,
      });
    }
  }, [user, form]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: EditUserFormData) => {
      // Remove password if empty
      const updateData = { ...data };
      if (!updateData.password) {
        delete updateData.password;
      }
      return await apiRequest("PATCH", `/api/users/${user?.id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات المستخدم",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error?.message || "فشل في تحديث المستخدم",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditUserFormData) => {
    updateUserMutation.mutate(data);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">تعديل المستخدم</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الكامل</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="أدخل الاسم الكامل"
                        data-testid="input-fullname"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المستخدم</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="أدخل اسم المستخدم"
                        data-testid="input-username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="example@company.com"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة السر الجديدة (اتركها فارغة للإبقاء على القديمة)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="أدخل كلمة السر الجديدة"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدينة</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="أدخل المدينة"
                        data-testid="input-city"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الصلاحية</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      data-testid="select-role"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الصلاحية" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">إدمن (Admin)</SelectItem>
                        <SelectItem value="employee">فني (Employee)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">الحساب نشط</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={updateUserMutation.isPending}
                data-testid="button-submit"
              >
                {updateUserMutation.isPending ? "جاري التحديث..." : "تحديث"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
