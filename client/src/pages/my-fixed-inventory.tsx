import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Save, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

interface FixedInventory {
  id?: string;
  technicianId: string;
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
}

export default function MyFixedInventory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [inventory, setInventory] = useState<FixedInventory>({
    technicianId: user?.id || '',
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
  });

  const { data: existingInventory, isLoading } = useQuery({
    queryKey: [`/api/technician-fixed-inventory/${user?.id}`],
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (existingInventory) {
      setInventory(existingInventory);
    }
  }, [existingInventory]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(
        `/api/technician-fixed-inventory/${user?.id}`,
        "PUT",
        inventory
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/technician-fixed-inventory/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fixed-inventory-dashboard'] });
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ المخزون الثابت",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ البيانات",
      });
    },
  });

  const handleUpdate = (field: keyof FixedInventory, value: number) => {
    setInventory(prev => ({
      ...prev,
      [field]: Math.max(0, value),
    }));
  };

  const getTotalForItem = (boxes: number, units: number) => {
    return boxes + units;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Package className="h-6 w-6 sm:h-8 sm:w-8" />
            المخزون الثابت
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            أدخل كميات المخزون الثابت لديك (كرتون + مفرد)
          </p>
        </div>
        <Button 
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full sm:w-auto"
          data-testid="button-save-inventory"
        >
          <Save className="w-4 h-4 ml-2" />
          حفظ التغييرات
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">إجمالي N950</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold" data-testid="text-total-n950">
              {getTotalForItem(inventory.n950Boxes, inventory.n950Units)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">إجمالي I900</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold" data-testid="text-total-i900">
              {getTotalForItem(inventory.i900Boxes, inventory.i900Units)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">إجمالي الأوراق</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold" data-testid="text-total-paper">
              {getTotalForItem(inventory.rollPaperBoxes, inventory.rollPaperUnits)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">إجمالي الملصقات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold" data-testid="text-total-stickers">
              {getTotalForItem(inventory.stickersBoxes, inventory.stickersUnits)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">إجمالي موبايلي</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold" data-testid="text-total-mobily">
              {getTotalForItem(inventory.mobilySimBoxes, inventory.mobilySimUnits)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">إجمالي STC</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold" data-testid="text-total-stc">
              {getTotalForItem(inventory.stcSimBoxes, inventory.stcSimUnits)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Input Sections */}
      <div className="space-y-4">
        {/* N950 Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">أجهزة N950</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="n950-boxes">كراتين</Label>
                <Input
                  id="n950-boxes"
                  type="number"
                  value={inventory.n950Boxes}
                  onChange={(e) => handleUpdate('n950Boxes', parseInt(e.target.value) || 0)}
                  min="0"
                  data-testid="input-n950-boxes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="n950-units">مفرد</Label>
                <Input
                  id="n950-units"
                  type="number"
                  value={inventory.n950Units}
                  onChange={(e) => handleUpdate('n950Units', parseInt(e.target.value) || 0)}
                  min="0"
                  data-testid="input-n950-units"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* I900 Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">أجهزة I900</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="i900-boxes">كراتين</Label>
                <Input
                  id="i900-boxes"
                  type="number"
                  value={inventory.i900Boxes}
                  onChange={(e) => handleUpdate('i900Boxes', parseInt(e.target.value) || 0)}
                  min="0"
                  data-testid="input-i900-boxes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="i900-units">مفرد</Label>
                <Input
                  id="i900-units"
                  type="number"
                  value={inventory.i900Units}
                  onChange={(e) => handleUpdate('i900Units', parseInt(e.target.value) || 0)}
                  min="0"
                  data-testid="input-i900-units"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roll Paper */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">أوراق رول</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paper-boxes">كراتين</Label>
                <Input
                  id="paper-boxes"
                  type="number"
                  value={inventory.rollPaperBoxes}
                  onChange={(e) => handleUpdate('rollPaperBoxes', parseInt(e.target.value) || 0)}
                  min="0"
                  data-testid="input-paper-boxes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paper-units">مفرد</Label>
                <Input
                  id="paper-units"
                  type="number"
                  value={inventory.rollPaperUnits}
                  onChange={(e) => handleUpdate('rollPaperUnits', parseInt(e.target.value) || 0)}
                  min="0"
                  data-testid="input-paper-units"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stickers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">ملصقات مداى</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stickers-boxes">كراتين</Label>
                <Input
                  id="stickers-boxes"
                  type="number"
                  value={inventory.stickersBoxes}
                  onChange={(e) => handleUpdate('stickersBoxes', parseInt(e.target.value) || 0)}
                  min="0"
                  data-testid="input-stickers-boxes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stickers-units">مفرد</Label>
                <Input
                  id="stickers-units"
                  type="number"
                  value={inventory.stickersUnits}
                  onChange={(e) => handleUpdate('stickersUnits', parseInt(e.target.value) || 0)}
                  min="0"
                  data-testid="input-stickers-units"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobily SIM */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">شرائح موبايلي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobily-boxes">كراتين</Label>
                <Input
                  id="mobily-boxes"
                  type="number"
                  value={inventory.mobilySimBoxes}
                  onChange={(e) => handleUpdate('mobilySimBoxes', parseInt(e.target.value) || 0)}
                  min="0"
                  data-testid="input-mobily-boxes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobily-units">مفرد</Label>
                <Input
                  id="mobily-units"
                  type="number"
                  value={inventory.mobilySimUnits}
                  onChange={(e) => handleUpdate('mobilySimUnits', parseInt(e.target.value) || 0)}
                  min="0"
                  data-testid="input-mobily-units"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* STC SIM */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">شرائح STC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stc-boxes">كراتين</Label>
                <Input
                  id="stc-boxes"
                  type="number"
                  value={inventory.stcSimBoxes}
                  onChange={(e) => handleUpdate('stcSimBoxes', parseInt(e.target.value) || 0)}
                  min="0"
                  data-testid="input-stc-boxes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stc-units">مفرد</Label>
                <Input
                  id="stc-units"
                  type="number"
                  value={inventory.stcSimUnits}
                  onChange={(e) => handleUpdate('stcSimUnits', parseInt(e.target.value) || 0)}
                  min="0"
                  data-testid="input-stc-units"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
        <Button 
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          size="lg"
          className="w-full sm:w-auto"
          data-testid="button-save-bottom"
        >
          <Save className="w-4 h-4 ml-2" />
          حفظ التغييرات
        </Button>
      </div>
    </div>
  );
}
