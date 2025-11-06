import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Save, ArrowRight, ArrowLeft, Plus, FileDown, Sparkles, Box, Smartphone, FileText, Sticker, Battery } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { TransferToMovingModal } from "@/components/transfer-to-moving-modal";
import { useLocation } from "wouter";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface FixedInventory {
  id?: string;
  technicianId: string;
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

export default function MyFixedInventory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [inventory, setInventory] = useState<FixedInventory>({
    technicianId: user?.id || '',
    n950Boxes: 0,
    n950Units: 0,
    i9000sBoxes: 0,
    i9000sUnits: 0,
    i9100Boxes: 0,
    i9100Units: 0,
    rollPaperBoxes: 0,
    rollPaperUnits: 0,
    stickersBoxes: 0,
    stickersUnits: 0,
    newBatteriesBoxes: 0,
    newBatteriesUnits: 0,
    mobilySimBoxes: 0,
    mobilySimUnits: 0,
    stcSimBoxes: 0,
    stcSimUnits: 0,
    zainSimBoxes: 0,
    zainSimUnits: 0,
  });

  const [notes, setNotes] = useState("");
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
        title: "✓ Saved Successfully",
        description: "Fixed inventory has been updated",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "✗ Save Failed",
        description: "An error occurred while saving data",
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

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Fixed Inventory');

    // Set RTL
    worksheet.views = [{ rightToLeft: true }];

    // Add title
    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Fixed Inventory Report';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 40;
    
    // Add date
    worksheet.mergeCells('A2:D2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Date: ${new Date().toLocaleDateString('en-US')}`;
    dateCell.font = { size: 12, italic: true };
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    dateCell.alignment = { horizontal: 'center' };
    worksheet.getRow(2).height = 25;

    // Add headers
    worksheet.addRow([]);
    const headerRow = worksheet.addRow(['Item', 'Boxes', 'Units', 'Total']);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add data
    const data = [
      ['N950 Devices', inventory.n950Boxes, inventory.n950Units, getTotalForItem(inventory.n950Boxes, inventory.n950Units)],
      ['I9000s Devices', inventory.i9000sBoxes, inventory.i9000sUnits, getTotalForItem(inventory.i9000sBoxes, inventory.i9000sUnits)],
      ['I9100 Devices', inventory.i9100Boxes, inventory.i9100Units, getTotalForItem(inventory.i9100Boxes, inventory.i9100Units)],
      ['Roll Sheets', inventory.rollPaperBoxes, inventory.rollPaperUnits, getTotalForItem(inventory.rollPaperBoxes, inventory.rollPaperUnits)],
      ['Madai Stickers', inventory.stickersBoxes, inventory.stickersUnits, getTotalForItem(inventory.stickersBoxes, inventory.stickersUnits)],
      ['New Batteries', inventory.newBatteriesBoxes, inventory.newBatteriesUnits, getTotalForItem(inventory.newBatteriesBoxes, inventory.newBatteriesUnits)],
      ['SIM Mobily', inventory.mobilySimBoxes, inventory.mobilySimUnits, getTotalForItem(inventory.mobilySimBoxes, inventory.mobilySimUnits)],
      ['SIM STC', inventory.stcSimBoxes, inventory.stcSimUnits, getTotalForItem(inventory.stcSimBoxes, inventory.stcSimUnits)],
      ['SIM Zain', inventory.zainSimBoxes, inventory.zainSimUnits, getTotalForItem(inventory.zainSimBoxes, inventory.zainSimUnits)],
    ];

    data.forEach((row, index) => {
      const dataRow = worksheet.addRow(row);
      dataRow.height = 25;
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      // Alternate row colors
      if (index % 2 === 0) {
        dataRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        });
      }
    });

    // Add total
    worksheet.addRow([]);
    const grandTotal = 
      getTotalForItem(inventory.n950Boxes, inventory.n950Units) +
      getTotalForItem(inventory.i9000sBoxes, inventory.i9000sUnits) +
      getTotalForItem(inventory.i9100Boxes, inventory.i9100Units) +
      getTotalForItem(inventory.rollPaperBoxes, inventory.rollPaperUnits) +
      getTotalForItem(inventory.stickersBoxes, inventory.stickersUnits) +
      getTotalForItem(inventory.newBatteriesBoxes, inventory.newBatteriesUnits) +
      getTotalForItem(inventory.mobilySimBoxes, inventory.mobilySimUnits) +
      getTotalForItem(inventory.stcSimBoxes, inventory.stcSimUnits) +
      getTotalForItem(inventory.zainSimBoxes, inventory.zainSimUnits);

    const totalRow = worksheet.addRow(['GRAND TOTAL', '', '', grandTotal]);
    totalRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    totalRow.height = 35;
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF059669' }
      };
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'medium' },
        bottom: { style: 'medium' },
        right: { style: 'medium' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Set column widths
    worksheet.columns = [
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];

    // Generate file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Fixed_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="text-center py-12">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
          </div>
          <p className="mt-4 text-lg font-medium bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Loading Fixed Inventory...
          </p>
        </div>
      </div>
    );
  }

  const itemsConfig = [
    {
      name: 'N950 Devices',
      icon: Box,
      boxesField: 'n950Boxes' as keyof FixedInventory,
      unitsField: 'n950Units' as keyof FixedInventory,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
      borderColor: 'border-blue-300 dark:border-blue-700',
      iconBg: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-300'
    },
    {
      name: 'I9000s Devices',
      icon: Box,
      boxesField: 'i9000sBoxes' as keyof FixedInventory,
      unitsField: 'i9000sUnits' as keyof FixedInventory,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
      borderColor: 'border-purple-300 dark:border-purple-700',
      iconBg: 'bg-purple-100 dark:bg-purple-900',
      iconColor: 'text-purple-600 dark:text-purple-300'
    },
    {
      name: 'I9100 Devices',
      icon: Box,
      boxesField: 'i9100Boxes' as keyof FixedInventory,
      unitsField: 'i9100Units' as keyof FixedInventory,
      gradient: 'from-indigo-500 to-blue-500',
      bgGradient: 'from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30',
      borderColor: 'border-indigo-300 dark:border-indigo-700',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900',
      iconColor: 'text-indigo-600 dark:text-indigo-300'
    },
    {
      name: 'Roll Sheets',
      icon: FileText,
      boxesField: 'rollPaperBoxes' as keyof FixedInventory,
      unitsField: 'rollPaperUnits' as keyof FixedInventory,
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
      borderColor: 'border-amber-300 dark:border-amber-700',
      iconBg: 'bg-amber-100 dark:bg-amber-900',
      iconColor: 'text-amber-600 dark:text-amber-300'
    },
    {
      name: 'Madai Stickers',
      icon: Sticker,
      boxesField: 'stickersBoxes' as keyof FixedInventory,
      unitsField: 'stickersUnits' as keyof FixedInventory,
      gradient: 'from-rose-500 to-red-500',
      bgGradient: 'from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30',
      borderColor: 'border-rose-300 dark:border-rose-700',
      iconBg: 'bg-rose-100 dark:bg-rose-900',
      iconColor: 'text-rose-600 dark:text-rose-300'
    },
    {
      name: 'New Batteries',
      icon: Battery,
      boxesField: 'newBatteriesBoxes' as keyof FixedInventory,
      unitsField: 'newBatteriesUnits' as keyof FixedInventory,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
      borderColor: 'border-emerald-300 dark:border-emerald-700',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900',
      iconColor: 'text-emerald-600 dark:text-emerald-300'
    },
    {
      name: 'SIM Mobily',
      icon: Smartphone,
      boxesField: 'mobilySimBoxes' as keyof FixedInventory,
      unitsField: 'mobilySimUnits' as keyof FixedInventory,
      gradient: 'from-green-500 to-lime-500',
      bgGradient: 'from-green-50 to-lime-50 dark:from-green-950/30 dark:to-lime-950/30',
      borderColor: 'border-green-300 dark:border-green-700',
      iconBg: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600 dark:text-green-300'
    },
    {
      name: 'SIM STC',
      icon: Smartphone,
      boxesField: 'stcSimBoxes' as keyof FixedInventory,
      unitsField: 'stcSimUnits' as keyof FixedInventory,
      gradient: 'from-teal-500 to-cyan-500',
      bgGradient: 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30',
      borderColor: 'border-teal-300 dark:border-teal-700',
      iconBg: 'bg-teal-100 dark:bg-teal-900',
      iconColor: 'text-teal-600 dark:text-teal-300'
    },
    {
      name: 'SIM Zain',
      icon: Smartphone,
      boxesField: 'zainSimBoxes' as keyof FixedInventory,
      unitsField: 'zainSimUnits' as keyof FixedInventory,
      gradient: 'from-violet-500 to-purple-500',
      bgGradient: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
      borderColor: 'border-violet-300 dark:border-violet-700',
      iconBg: 'bg-violet-100 dark:bg-violet-900',
      iconColor: 'text-violet-600 dark:text-violet-300'
    },
  ];

  const grandTotal = itemsConfig.reduce((total, item) => {
    return total + getTotalForItem(
      inventory[item.boxesField] as number, 
      inventory[item.unitsField] as number
    );
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/')}
                className="shrink-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0"
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white flex items-center gap-3" data-testid="text-page-title">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Package className="h-8 w-8 sm:h-10 sm:w-10" />
                  </div>
                  Fixed Inventory
                  <Sparkles className="h-6 w-6 animate-pulse" />
                </h1>
                <p className="text-sm sm:text-base text-white/90 mt-2 font-medium">
                  Manage your base stock inventory with precision
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <Button 
                onClick={() => setShowTransferModal(true)}
                className="flex-1 sm:flex-initial bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30 shadow-lg"
                data-testid="button-transfer-to-moving"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                Transfer to Moving
              </Button>
              <Button 
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="flex-1 sm:flex-initial bg-white hover:bg-gray-100 text-blue-600 font-semibold shadow-lg"
                data-testid="button-save-inventory"
              >
                <Save className="w-4 h-4 ml-2" />
                {saveMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button 
                onClick={exportToExcel}
                className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                data-testid="button-export-excel"
              >
                <FileDown className="w-4 h-4 ml-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Grand Total Card */}
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/5"></div>
          <CardContent className="p-6 sm:p-8 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">Total Items</p>
                <p className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent" data-testid="text-grand-total">
                  {grandTotal.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl">
                <Package className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Items Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {itemsConfig.map((item) => {
            const Icon = item.icon;
            const total = getTotalForItem(
              inventory[item.boxesField] as number,
              inventory[item.unitsField] as number
            );

            return (
              <Card 
                key={item.name}
                className={`group border-2 ${item.borderColor} hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br ${item.bgGradient} overflow-hidden`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 ${item.iconBg} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`h-6 w-6 ${item.iconColor}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg sm:text-xl font-bold">
                          {item.name}
                        </CardTitle>
                        <p className={`text-2xl font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                          {total}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleQuickAdd(item.boxesField, 1)}
                      className={`bg-gradient-to-r ${item.gradient} text-white hover:shadow-lg transition-shadow`}
                      data-testid={`button-add-${item.name.toLowerCase().replace(/\s+/g, '-')}-box`}
                    >
                      <Plus className="h-4 w-4 ml-1" />
                      Add Box
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${item.name}-boxes`} className="text-sm font-semibold text-muted-foreground">
                        Boxes
                      </Label>
                      <Input
                        id={`${item.name}-boxes`}
                        type="number"
                        value={inventory[item.boxesField] as number}
                        onChange={(e) => handleUpdate(item.boxesField, parseInt(e.target.value) || 0)}
                        min="0"
                        className="text-lg font-bold h-12 border-2 focus:ring-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
                        data-testid={`input-${item.name.toLowerCase().replace(/\s+/g, '-')}-boxes`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${item.name}-units`} className="text-sm font-semibold text-muted-foreground">
                        Units
                      </Label>
                      <Input
                        id={`${item.name}-units`}
                        type="number"
                        value={inventory[item.unitsField] as number}
                        onChange={(e) => handleUpdate(item.unitsField, parseInt(e.target.value) || 0)}
                        min="0"
                        className="text-lg font-bold h-12 border-2 focus:ring-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
                        data-testid={`input-${item.name.toLowerCase().replace(/\s+/g, '-')}-units`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Notes Section */}
        <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or comments about your inventory..."
              className="w-full h-24 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              data-testid="input-notes"
            />
          </CardContent>
        </Card>
      </div>

      {showTransferModal && (
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
