import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Minus, Plus, FileText, TriangleAlert, Settings, LogOut, User, Shield, History, Smartphone, Package, TruckIcon, Home } from "lucide-react";
import { InventoryItemWithStatus, Transaction } from "@shared/schema";
import AddItemModal from "./add-item-modal";
import WithdrawalModal from "./withdrawal-modal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

interface SidebarProps {
  inventory?: InventoryItemWithStatus[];
}

export default function Sidebar({ inventory }: SidebarProps) {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions?recent=true&limit=10"],
  });

  const lowStockItems = inventory?.filter(item => item.status === 'low') || [];
  const outOfStockItems = inventory?.filter(item => item.status === 'out') || [];
  const alertItems = [...lowStockItems, ...outOfStockItems];
  
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "شكراً لك على استخدام النظام",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الخروج",
        description: "حدث خطأ غير متوقع",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleQuickWithdraw = () => {
    if (!inventory || inventory.length === 0) {
      toast({
        title: "لا توجد أصناف في المخزون",
        description: "يجب إضافة أصناف أولاً قبل السحب",
        variant: "destructive",
      });
      return;
    }
    
    const availableItems = inventory.filter(item => item.quantity > 0);
    if (availableItems.length === 0) {
      toast({
        title: "جميع الأصناف نافدة",
        description: `يوجد ${inventory.length} صنف ولكن جميعها بكمية صفر`,
        variant: "destructive",
      });
      return;
    }
    
    setShowWithdrawModal(true);
  };
  
  const handleGenerateReport = () => {
    if (!inventory || inventory.length === 0) {
      toast({
        title: "لا يمكن إنشاء التقرير",
        description: "لا توجد أصناف في المخزون لإنشاء تقرير",
        variant: "destructive",
      });
      return;
    }

    // Create a simple report content
    const totalItems = inventory.length;
    const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockCount = inventory.filter(item => item.status === 'low').length;
    const outOfStockCount = inventory.filter(item => item.status === 'out').length;
    
    const reportContent = `
تقرير المخزون - ${new Date().toLocaleDateString('ar-SA')}

إجمالي الأصناف: ${totalItems}
إجمالي الكميات: ${totalQuantity}
أصناف منخفضة المخزون: ${lowStockCount}
أصناف نافدة: ${outOfStockCount}

تفاصيل الأصناف:
${inventory.map(item => 
  `- ${item.name}: ${item.quantity} ${item.unit} (${item.status === 'available' ? 'متوفر' : item.status === 'low' ? 'منخفض' : 'نافد'})`
).join('\n')}
    `.trim();

    // Create and download the report
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_المخزون_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "تم إنشاء التقرير",
      description: "تم تحميل تقرير المخزون بنجاح",
    });
  };

  return (
    <div className="space-y-6">
      {/* User Info Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 bg-primary/10 rounded-full">
              {user?.role === 'admin' ? (
                <Shield className="h-5 w-5 text-primary" />
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {user?.role === 'admin' ? 'مدير النظام' : 'فني'}
              </p>
            </div>
            <Button 
              data-testid="button-logout"
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <Link href="/home">
            <Button
              variant="default"
              className="w-full mt-4 flex items-center justify-center space-x-2 space-x-reverse"
              data-testid="button-home"
            >
              <Home className="h-4 w-4" />
              <span>الصفحة الرئيسية</span>
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="destructive"
            className="w-full flex items-center justify-center space-x-2 space-x-reverse"
            onClick={handleQuickWithdraw}
            data-testid="button-quick-withdraw"
          >
            <Minus className="h-4 w-4" />
            <span>سحب من المخزون</span>
          </Button>
          
          <Button
            className="w-full bg-success hover:bg-success/90 text-white flex items-center justify-center space-x-2 space-x-reverse"
            onClick={() => setShowAddModal(true)}
            data-testid="button-quick-add-stock"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة للمخزون</span>
          </Button>
          
          <Button
            variant="secondary"
            className="w-full flex items-center justify-center space-x-2 space-x-reverse"
            onClick={handleGenerateReport}
            data-testid="button-generate-report"
          >
            <FileText className="h-4 w-4" />
            <span>تقرير المخزون</span>
          </Button>
          
          <Link href="/transactions">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center space-x-2 space-x-reverse"
              data-testid="button-transaction-history"
            >
              <History className="h-4 w-4" />
              <span>سجل المعاملات</span>
            </Button>
          </Link>
          
          <Link href="/withdrawn-devices">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center space-x-2 space-x-reverse"
              data-testid="button-withdrawn-devices"
            >
              <Smartphone className="h-4 w-4" />
              <span>الأجهزة المسحوبة</span>
            </Button>
          </Link>
          
          {user?.role === 'technician' && (
            <>
              <Link href="/my-fixed-inventory">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2 space-x-reverse"
                  data-testid="button-my-fixed-inventory"
                >
                  <Package className="h-4 w-4" />
                  <span>مخزوني الثابت</span>
                </Button>
              </Link>

              <Link href="/my-moving-inventory">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2 space-x-reverse"
                  data-testid="button-my-moving-inventory"
                >
                  <TruckIcon className="h-4 w-4" />
                  <span>مخزوني المتحرك</span>
                </Button>
              </Link>
            </>
          )}
          
          {user?.role === 'admin' && (
            <>
              <Link href="/fixed-inventory">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2 space-x-reverse"
                  data-testid="button-fixed-inventory"
                >
                  <Package className="h-4 w-4" />
                  <span>المخزون الثابت</span>
                </Button>
              </Link>
              
              <Link href="/admin">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2 space-x-reverse"
                  data-testid="button-admin-panel"
                >
                  <Settings className="h-4 w-4" />
                  <span>لوحة الإدارة</span>
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">العمليات الأخيرة</CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 bg-accent/30 rounded-lg">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : !transactions || !Array.isArray(transactions) || transactions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              لا توجد عمليات حديثة
            </div>
          ) : (
            <div className="space-y-3">
              {(Array.isArray(transactions) ? transactions : []).slice(0, 3).map((transaction) => {
                const item = inventory?.find(i => i.id === transaction.itemId);
                return (
                  <div key={transaction.id} className="p-3 bg-accent/30 rounded-lg" data-testid={`transaction-${transaction.id}`}>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className={`${
                        transaction.type === 'withdraw' 
                          ? 'bg-destructive/10 text-destructive' 
                          : 'bg-success/10 text-success'
                      } p-2 rounded-full`}>
                        {transaction.type === 'withdraw' ? (
                          <Minus className="h-3 w-3" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {transaction.type === 'withdraw' ? 'سحب' : 'إضافة'} {item?.name || 'صنف محذوف'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.createdAt!).toLocaleString('ar')}
                        </p>
                      </div>
                      <span className={`text-xs font-medium ${
                        transaction.type === 'withdraw' ? 'text-destructive' : 'text-success'
                      }`}>
                        {transaction.type === 'withdraw' ? '-' : '+'}{transaction.quantity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center space-x-2 space-x-reverse">
            <TriangleAlert className="h-5 w-5 text-warning" />
            <span>تنبيهات المخزون</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertItems.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              لا توجد تنبيهات حالياً
            </div>
          ) : (
            <div className="space-y-2">
              {alertItems.map((item) => (
                <div
                  key={item.id}
                  className={`${
                    item.status === 'out' 
                      ? 'bg-destructive/10 border-destructive/20' 
                      : 'bg-warning/10 border-warning/20'
                  } border rounded-lg p-3`}
                  data-testid={`alert-${item.id}`}
                >
                  <p className={`text-sm font-medium ${
                    item.status === 'out' ? 'text-destructive' : 'text-warning'
                  }`}>
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.status === 'out' 
                      ? 'نافد تماماً - يحتاج تجديد فوري'
                      : `الكمية: ${item.quantity} ${item.unit} (أقل من الحد الأدنى)`
                    }
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modals */}
      <AddItemModal open={showAddModal} onOpenChange={setShowAddModal} />
      <WithdrawalModal 
        open={showWithdrawModal} 
        onOpenChange={setShowWithdrawModal}
        selectedItem={null}
        inventory={inventory}
      />
    </div>
  );
}
