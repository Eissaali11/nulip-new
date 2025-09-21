import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Minus, Plus, FileText, TriangleAlert } from "lucide-react";
import { InventoryItemWithStatus, Transaction } from "@shared/schema";

interface SidebarProps {
  inventory?: InventoryItemWithStatus[];
}

export default function Sidebar({ inventory }: SidebarProps) {
  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions?limit=10"],
  });

  const lowStockItems = inventory?.filter(item => item.status === 'low') || [];
  const outOfStockItems = inventory?.filter(item => item.status === 'out') || [];
  const alertItems = [...lowStockItems, ...outOfStockItems];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="destructive"
            className="w-full flex items-center justify-center space-x-2 space-x-reverse"
            data-testid="button-quick-withdraw"
          >
            <Minus className="h-4 w-4" />
            <span>سحب من المخزون</span>
          </Button>
          
          <Button
            className="w-full bg-success hover:bg-success/90 text-white flex items-center justify-center space-x-2 space-x-reverse"
            data-testid="button-quick-add-stock"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة للمخزون</span>
          </Button>
          
          <Button
            variant="secondary"
            className="w-full flex items-center justify-center space-x-2 space-x-reverse"
            data-testid="button-generate-report"
          >
            <FileText className="h-4 w-4" />
            <span>تقرير المخزون</span>
          </Button>
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
          ) : !transactions || transactions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              لا توجد عمليات حديثة
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 3).map((transaction) => {
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
    </div>
  );
}
