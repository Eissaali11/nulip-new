import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Filter, TrendingUp, TrendingDown, Users, MapPin, Search, Download, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TransactionHistoryPage() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    type: "all",
    userId: "all-users",
    regionId: "all-regions",
    startDate: "",
    endDate: "",
    search: ""
  });

  // Fetch transactions with filters
  const { data: transactionData, isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery({
    queryKey: ['/api/transactions', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        // Convert "all" values to empty for API and skip empty values
        if (value && value !== "all" && value !== "all-users" && value !== "all-regions") {
          params.append(key, value.toString());
        }
      });
      return fetch(`/api/transactions?${params}`).then(res => res.json());
    }
  });

  // Fetch transaction statistics
  const { data: statisticsData, isLoading: statisticsLoading } = useQuery({
    queryKey: ['/api/transactions/statistics', filters.startDate, filters.endDate, filters.regionId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.regionId && filters.regionId !== "all-regions") params.append('regionId', filters.regionId);
      return fetch(`/api/transactions/statistics?${params}`).then(res => res.json());
    }
  });

  // Fetch users and regions for filter dropdowns
  const { data: users } = useQuery({
    queryKey: ['/api/users']
  });

  const { data: regions } = useQuery({
    queryKey: ['/api/regions']
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      type: "all",
      userId: "all-users",
      regionId: "all-regions",
      startDate: "",
      endDate: "",
      search: ""
    });
  };

  const exportData = () => {
    // TODO: Implement export functionality
    console.log('Export data:', transactionData);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">سجل المعاملات</h1>
          <p className="text-muted-foreground">عرض وتحليل جميع عمليات السحب والإضافة</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetchTransactions()}
            data-testid="button-refresh-transactions"
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          <Button 
            variant="outline" 
            onClick={exportData}
            data-testid="button-export-transactions"
          >
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
        </div>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">المعاملات</TabsTrigger>
          <TabsTrigger value="statistics">الإحصائيات</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Filters Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                تصفية النتائج
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Search */}
                <div className="space-y-2">
                  <Label>البحث</Label>
                  <div className="relative">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="البحث في الأصناف والموظفين..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pr-9"
                      data-testid="input-search-transactions"
                    />
                  </div>
                </div>

                {/* Transaction Type */}
                <div className="space-y-2">
                  <Label>نوع العملية</Label>
                  <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                    <SelectTrigger data-testid="select-transaction-type">
                      <SelectValue placeholder="جميع العمليات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع العمليات</SelectItem>
                      <SelectItem value="add">إضافة</SelectItem>
                      <SelectItem value="withdraw">سحب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* User Filter */}
                <div className="space-y-2">
                  <Label>الموظف</Label>
                  <Select value={filters.userId} onValueChange={(value) => handleFilterChange('userId', value)}>
                    <SelectTrigger data-testid="select-user-filter">
                      <SelectValue placeholder="جميع الموظفين" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-users">جميع الموظفين</SelectItem>
                      {users && Array.isArray(users) && users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Region Filter */}
                <div className="space-y-2">
                  <Label>المنطقة</Label>
                  <Select value={filters.regionId} onValueChange={(value) => handleFilterChange('regionId', value)}>
                    <SelectTrigger data-testid="select-region-filter">
                      <SelectValue placeholder="جميع المناطق" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-regions">جميع المناطق</SelectItem>
                      {regions && Array.isArray(regions) && regions.map((region: any) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label>من تاريخ</Label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    data-testid="input-start-date"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label>إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    data-testid="input-end-date"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  data-testid="button-clear-filters"
                >
                  مسح التصفية
                </Button>
                <div className="text-sm text-muted-foreground">
                  {transactionData?.total ? `${transactionData.total} معاملة` : ''}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>نتائج البحث</CardTitle>
              <CardDescription>
                عرض المعاملات مع إمكانية التصفية والبحث
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !transactionData?.transactions || transactionData.transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">لا توجد معاملات تطابق معايير البحث</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الصنف</TableHead>
                        <TableHead className="text-right">نوع العملية</TableHead>
                        <TableHead className="text-right">الكمية</TableHead>
                        <TableHead className="text-right">الموظف</TableHead>
                        <TableHead className="text-right">المنطقة</TableHead>
                        <TableHead className="text-right">السبب</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionData.transactions.map((transaction: any) => (
                        <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                          <TableCell className="text-right font-medium">
                            {transaction.itemName}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={transaction.type === "add" ? "default" : "destructive"}>
                              {transaction.type === "add" ? (
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  إضافة
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <TrendingDown className="h-3 w-3" />
                                  سحب
                                </div>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`font-medium ${
                              transaction.type === 'add' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'add' ? '+' : '-'}{transaction.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{transaction.userName}</TableCell>
                          <TableCell className="text-right">{transaction.regionName}</TableCell>
                          <TableCell className="text-right">{transaction.reason || "غير محدد"}</TableCell>
                          <TableCell className="text-right">
                            {new Date(transaction.createdAt).toLocaleDateString("ar-SA", {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {transactionData.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        الصفحة {transactionData.page} من {transactionData.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(transactionData.page - 1)}
                          disabled={transactionData.page <= 1}
                          data-testid="button-previous-page"
                        >
                          السابق
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(transactionData.page + 1)}
                          disabled={transactionData.page >= transactionData.totalPages}
                          data-testid="button-next-page"
                        >
                          التالي
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          {statisticsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : statisticsData ? (
            <>
              {/* Statistics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold">{statisticsData.totalTransactions}</p>
                        <p className="text-sm text-muted-foreground">إجمالي المعاملات</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-green-600">{statisticsData.totalAdditions}</p>
                        <p className="text-sm text-muted-foreground">عمليات الإضافة</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="text-2xl font-bold text-red-600">{statisticsData.totalWithdrawals}</p>
                        <p className="text-sm text-muted-foreground">عمليات السحب</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-bold text-sm">ص</span>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {statisticsData.totalAddedQuantity - statisticsData.totalWithdrawnQuantity}
                        </p>
                        <p className="text-sm text-muted-foreground">صافي الحركة</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Region and User Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      المعاملات حسب المنطقة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {statisticsData.byRegion.slice(0, 5).map((region: any, index: number) => (
                        <div key={region.regionName} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <span>{region.regionName}</span>
                          </div>
                          <Badge variant="secondary">{region.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      أكثر الموظفين نشاطاً
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {statisticsData.byUser.slice(0, 5).map((user: any, index: number) => (
                        <div key={user.userName} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <span>{user.userName}</span>
                          </div>
                          <Badge variant="secondary">{user.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">فشل في تحميل الإحصائيات</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}