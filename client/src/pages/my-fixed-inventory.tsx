import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Save, ArrowRight, ArrowLeft, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { TransferToMovingModal } from "@/components/transfer-to-moving-modal";
import { useLocation } from "wouter";

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
  const [, setLocation] = useLocation();

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

  const [showTransferModal, setShowTransferModal] = useState(false);

  const { data: existingInventory, isLoading } = useQuery<FixedInventory>({
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
        "PUT",
        `/api/technician-fixed-inventory/${user?.id}`,
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

  const handleQuickAdd = (field: keyof FixedInventory, amount: number) => {
    setInventory(prev => ({
      ...prev,
      [field]: Math.max(0, (prev[field] as number) + amount),
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
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            className="shrink-0"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              المخزون الثابت
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              أدخل كميات المخزون الثابت لديك (كرتون + مفرد)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={() => setShowTransferModal(true)}
            variant="outline"
            className="flex-1 sm:flex-initial border-green-500/30 hover:bg-green-50 dark:hover:bg-green-950"
            data-testid="button-transfer-to-moving"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            نقل للمخزون المتحرك
          </Button>
          <Button 
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex-1 sm:flex-initial"
            data-testid="button-save-inventory"
          >
            <Save className="w-4 h-4 ml-2" />
            {saveMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">إجمالي N950</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100" data-testid="text-total-n950">
              {getTotalForItem(inventory.n950Boxes, inventory.n950Units)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-purple-700 dark:text-purple-300">إجمالي I900</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-100" data-testid="text-total-i900">
              {getTotalForItem(inventory.i900Boxes, inventory.i900Units)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">إجمالي الأوراق</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl sm:text-3xl font-bold text-amber-900 dark:text-amber-100" data-testid="text-total-paper">
              {getTotalForItem(inventory.rollPaperBoxes, inventory.rollPaperUnits)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-orange-700 dark:text-orange-300">إجمالي الملصقات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl sm:text-3xl font-bold text-orange-900 dark:text-orange-100" data-testid="text-total-stickers">
              {getTotalForItem(inventory.stickersBoxes, inventory.stickersUnits)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-green-700 dark:text-green-300">إجمالي موبايلي</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100" data-testid="text-total-mobily">
              {getTotalForItem(inventory.mobilySimBoxes, inventory.mobilySimUnits)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border-teal-200 dark:border-teal-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-teal-700 dark:text-teal-300">إجمالي STC</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl sm:text-3xl font-bold text-teal-900 dark:text-teal-100" data-testid="text-total-stc">
              {getTotalForItem(inventory.stcSimBoxes, inventory.stcSimUnits)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Input Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* N950 Devices */}
        <Card className="border-2 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
          <CardHeader className="bg-blue-50 dark:bg-blue-950/30">
            <CardTitle className="text-base sm:text-lg flex items-center justify-between">
              <span>أجهزة N950</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleQuickAdd('n950Boxes', 1);
                  }}
                  data-testid="button-add-n950-box"
                >
                  <Plus className="h-3 w-3 ml-1" />
                  كرتون
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="n950-boxes">كراتين</Label>
                <Input
                  id="n950-boxes"
                  type="number"
                  value={inventory.n950Boxes}
                  onChange={(e) => handleUpdate('n950Boxes', parseInt(e.target.value) || 0)}
                  min="0"
                  className="text-lg"
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
                  className="text-lg"
                  data-testid="input-n950-units"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* I900 Devices */}
        <Card className="border-2 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
          <CardHeader className="bg-purple-50 dark:bg-purple-950/30">
            <CardTitle className="text-base sm:text-lg flex items-center justify-between">
              <span>أجهزة I900</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleQuickAdd('i900Boxes', 1);
                  }}
                  data-testid="button-add-i900-box"
                >
                  <Plus className="h-3 w-3 ml-1" />
                  كرتون
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="i900-boxes">كراتين</Label>
                <Input
                  id="i900-boxes"
                  type="number"
                  value={inventory.i900Boxes}
                  onChange={(e) => handleUpdate('i900Boxes', parseInt(e.target.value) || 0)}
                  min="0"
                  className="text-lg"
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
                  className="text-lg"
                  data-testid="input-i900-units"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roll Paper */}
        <Card className="border-2 hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
          <CardHeader className="bg-amber-50 dark:bg-amber-950/30">
            <CardTitle className="text-base sm:text-lg flex items-center justify-between">
              <span>أوراق رول</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleQuickAdd('rollPaperBoxes', 1);
                  }}
                  data-testid="button-add-paper-box"
                >
                  <Plus className="h-3 w-3 ml-1" />
                  كرتون
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="paper-boxes">كراتين</Label>
                <Input
                  id="paper-boxes"
                  type="number"
                  value={inventory.rollPaperBoxes}
                  onChange={(e) => handleUpdate('rollPaperBoxes', parseInt(e.target.value) || 0)}
                  min="0"
                  className="text-lg"
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
                  className="text-lg"
                  data-testid="input-paper-units"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stickers */}
        <Card className="border-2 hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
          <CardHeader className="bg-orange-50 dark:bg-orange-950/30">
            <CardTitle className="text-base sm:text-lg flex items-center justify-between">
              <span>ملصقات مداى</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleQuickAdd('stickersBoxes', 1);
                  }}
                  data-testid="button-add-stickers-box"
                >
                  <Plus className="h-3 w-3 ml-1" />
                  كرتون
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="stickers-boxes">كراتين</Label>
                <Input
                  id="stickers-boxes"
                  type="number"
                  value={inventory.stickersBoxes}
                  onChange={(e) => handleUpdate('stickersBoxes', parseInt(e.target.value) || 0)}
                  min="0"
                  className="text-lg"
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
                  className="text-lg"
                  data-testid="input-stickers-units"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobily SIM */}
        <Card className="border-2 hover:border-green-300 dark:hover:border-green-700 transition-colors">
          <CardHeader className="bg-green-50 dark:bg-green-950/30">
            <CardTitle className="text-base sm:text-lg flex items-center justify-between">
              <span>شرائح موبايلي</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleQuickAdd('mobilySimBoxes', 1);
                  }}
                  data-testid="button-add-mobily-box"
                >
                  <Plus className="h-3 w-3 ml-1" />
                  كرتون
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="mobily-boxes">كراتين</Label>
                <Input
                  id="mobily-boxes"
                  type="number"
                  value={inventory.mobilySimBoxes}
                  onChange={(e) => handleUpdate('mobilySimBoxes', parseInt(e.target.value) || 0)}
                  min="0"
                  className="text-lg"
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
                  className="text-lg"
                  data-testid="input-mobily-units"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* STC SIM */}
        <Card className="border-2 hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
          <CardHeader className="bg-teal-50 dark:bg-teal-950/30">
            <CardTitle className="text-base sm:text-lg flex items-center justify-between">
              <span>شرائح STC</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleQuickAdd('stcSimBoxes', 1);
                  }}
                  data-testid="button-add-stc-box"
                >
                  <Plus className="h-3 w-3 ml-1" />
                  كرتون
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="stc-boxes">كراتين</Label>
                <Input
                  id="stc-boxes"
                  type="number"
                  value={inventory.stcSimBoxes}
                  onChange={(e) => handleUpdate('stcSimBoxes', parseInt(e.target.value) || 0)}
                  min="0"
                  className="text-lg"
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
                  className="text-lg"
                  data-testid="input-stc-units"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
        <Button 
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          size="lg"
          className="w-full sm:w-auto"
          data-testid="button-save-bottom"
        >
          <Save className="w-4 h-4 ml-2" />
          {saveMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
        </Button>
      </div>

      {/* Transfer Modal */}
      {existingInventory && (
        <TransferToMovingModal
          open={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          technicianId={user?.id || ''}
          fixedInventory={inventory}
        />
      )}
    </div>
  );
}
