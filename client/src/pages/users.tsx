import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, Trash2, Users as UsersIcon, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { UserSafe } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AddUserModal } from "@/components/add-user-modal";
import { EditUserModal } from "@/components/edit-user-modal";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSafe | null>(null);
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery<UserSafe[]>({
    queryKey: ["/api/users"],
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المستخدم",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل حذف المستخدم",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (user: UserSafe) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      deleteUserMutation.mutate(id);
    }
  };

  const filteredUsers = users?.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                <Link href="/" data-testid="button-back-home">
                  <ArrowRight className="h-4 w-4 ml-2" />
                  <span>العودة للرئيسية</span>
                </Link>
              </Button>
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">إدارة المستخدمين</h2>
                  <p className="text-sm text-muted-foreground">إضافة وإدارة مستخدمي النظام</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="relative flex-1 sm:flex-initial">
                  <Input
                    type="text"
                    placeholder="ابحث..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64 bg-white dark:bg-gray-900 text-sm"
                    data-testid="input-search"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="flex-1 sm:flex-initial gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                    data-testid="button-add-user"
                  >
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>إضافة مستخدم</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredUsers && filteredUsers.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden space-y-3">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="bg-card border border-border rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm text-foreground">{user.fullName}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 
                              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                            {user.role === 'admin' ? 'إدمن' : 'فني'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {user.city && <p className="text-xs text-muted-foreground">📍 {user.city}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                          className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400"
                          data-testid={`button-edit-${user.id}`}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(user.id)}
                          className="h-8 w-8 hover:bg-destructive/10"
                          data-testid={`button-delete-${user.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">الحالة: </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                          ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                          {user.isActive ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto -mx-4 sm:mx-0 rounded-lg">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                      <tr>
                        <th className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 text-right text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">الاسم</th>
                        <th className="hidden md:table-cell whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 text-right text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">اسم المستخدم</th>
                        <th className="hidden xl:table-cell whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 text-right text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">البريد</th>
                        <th className="whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">المدينة</th>
                        <th className="whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">الصلاحية</th>
                        <th className="hidden lg:table-cell whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">الحالة</th>
                        <th className="whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-user-${user.id}`}>
                          <td className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-sm font-medium text-foreground">
                            {user.fullName}
                          </td>
                          <td className="hidden md:table-cell whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-sm text-muted-foreground">
                            @{user.username}
                          </td>
                          <td className="hidden xl:table-cell whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-sm text-muted-foreground">
                            {user.email}
                          </td>
                          <td className="whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-sm">
                            {user.city || '-'}
                          </td>
                          <td className="whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-semibold
                              ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 
                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                              {user.role === 'admin' ? 'إدمن' : 'فني'}
                            </span>
                          </td>
                          <td className="hidden lg:table-cell whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-semibold
                              ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                              {user.isActive ? 'نشط' : 'غير نشط'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-1 py-2 sm:px-4 sm:py-3">
                            <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(user)}
                                className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400"
                                title="تعديل"
                                data-testid={`button-edit-${user.id}`}
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(user.id)}
                                className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-destructive/10 hover:text-destructive"
                                title="حذف"
                                data-testid={`button-delete-${user.id}`}
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">
                لا يوجد مستخدمين مسجلين
              </p>
              <Button onClick={() => setShowAddModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                <span>إضافة أول مستخدم</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AddUserModal open={showAddModal} onOpenChange={setShowAddModal} />
      <EditUserModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal}
        user={selectedUser}
      />
    </>
  );
}
