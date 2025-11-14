import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const isValidLanguage = (lang: any): lang is Language => {
  return lang === 'ar' || lang === 'en';
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'ar';
    try {
      const saved = localStorage.getItem('language');
      if (saved && isValidLanguage(saved)) {
        return saved;
      }
      return 'ar';
    } catch {
      return 'ar';
    }
  });

  const setLanguage = (lang: Language) => {
    if (!isValidLanguage(lang)) {
      console.warn(`Invalid language: ${lang}, falling back to 'ar'`);
      lang = 'ar';
    }
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('language', lang);
      } catch (error) {
        console.warn('Failed to save language preference:', error);
      }
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', language);
      document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    }
  }, [language]);

  const t = (key: string): string => {
    const langTranslations = translations[language];
    if (!langTranslations) {
      console.warn(`Missing translations for language: ${language}`);
      return key;
    }
    return langTranslations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t,
      dir: language === 'ar' ? 'rtl' : 'ltr'
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Common
    'app.name': 'نظام إدارة المخزون',
    'app.subtitle': 'مرحباً بك، عيسى الفخاني',
    'home': 'الصفحة الرئيسية',
    'back': 'العودة',
    'save': 'حفظ',
    'cancel': 'إلغاء',
    'delete': 'حذف',
    'edit': 'تعديل',
    'add': 'إضافة',
    'search': 'بحث',
    'filter': 'تصفية',
    'export': 'تصدير',
    'import': 'استيراد',
    'logout': 'تسجيل الخروج',
    'profile': 'الملف الشخصي',
    'settings': 'الإعدادات',
    'notifications': 'الإشعارات',
    'language': 'اللغة',
    'arabic': 'العربية',
    'english': 'English',
    
    // Dashboard
    'dashboard.title': 'لوحة التحكم',
    'dashboard.stats': 'الإحصائيات',
    'dashboard.fixed_inventory': 'المخزون الثابت',
    'dashboard.moving_inventory': 'المخزون المتحرك',
    'dashboard.warehouses': 'المخازن',
    'dashboard.technicians': 'الفنيين',
    
    // Navigation
    'nav.home': 'الصفحة الرئيسية',
    'nav.admin_operations': 'إدارة العمليات',
    'nav.operations': 'العمليات',
    'nav.technician_inventory': 'لوحة مخزون الفنيين',
    'nav.moving_inventory': 'المخزون المتحرك',
    'nav.fixed_inventory': 'المخزون الثابت',
    'nav.devices': 'الأجهزة',
    'nav.notifications': 'الإشعارات',
    'nav.users': 'المستخدمين',
    'nav.warehouses': 'المستودعات',
    'nav.main_menu': 'القائمة الرئيسية',
    
    // Inventory
    'inventory.title': 'المخزون',
    'inventory.fixed': 'المخزون الثابت',
    'inventory.moving': 'المخزون المتحرك',
    'inventory.add_stock': 'إضافة للمخزون',
    'inventory.withdraw': 'سحب من المخزون',
    'inventory.total': 'الإجمالي',
    'inventory.available': 'متوفر',
    'inventory.low': 'منخفض',
    'inventory.out': 'نفذ',
    
    // Warehouses
    'warehouses.title': 'المخازن',
    'warehouses.add': 'إضافة مخزن',
    'warehouses.transfer': 'نقل من المخزن',
    'warehouses.details': 'تفاصيل المخزن',
    
    // Users
    'users.title': 'المستخدمين',
    'users.add': 'إضافة مستخدم',
    'users.technician': 'فني',
    'users.supervisor': 'مشرف',
    'users.admin': 'مدير',
    'users.role': 'الدور',
    'users.region': 'المنطقة',
    'users.active': 'نشط',
    'users.inactive': 'غير نشط',
    
    // Regions
    'regions.title': 'المناطق',
    'regions.add': 'إضافة منطقة',
    'regions.name': 'اسم المنطقة',
    'regions.code': 'كود المنطقة',
    
    // Admin
    'admin.title': 'لوحة الإدارة',
    'admin.control': 'التحكم الكامل في النظام',
    'admin.regions': 'إدارة المناطق',
    'admin.users': 'إدارة المستخدمين',
    'admin.system_logs': 'عمليات النظام',
    
    // Products
    'products.n950': 'جهاز N950',
    'products.i9000s': 'جهاز I9000s',
    'products.i9100': 'جهاز I9100',
    'products.roll_paper': 'ورق حراري',
    'products.stickers': 'ملصقات',
    'products.batteries': 'بطاريات جديدة',
    'products.mobily_sim': 'شريحة موبايلي',
    'products.stc_sim': 'شريحة STC',
    'products.zain_sim': 'شريحة زين',
    
    // Units
    'units.box': 'كرتون',
    'units.boxes': 'كراتين',
    'units.unit': 'وحدة',
    'units.units': 'وحدات',
    
    // Actions
    'actions.quick_withdraw': 'سحب من المخزون',
    'actions.quick_add': 'إضافة للمخزون',
    'actions.generate_report': 'تقرير المخزون',
    'actions.view_transactions': 'سجل المعاملات',
    'actions.view_operations': 'العمليات',
    'actions.request_inventory': 'طلب مخزون',
    'actions.view_details': 'عرض التفاصيل',
    'actions.export_excel': 'تصدير Excel',
    
    // Sidebar
    'sidebar.home': 'الصفحة الرئيسية',
    'sidebar.quick_actions': 'إجراءات سريعة',
    'sidebar.my_inventory': 'مخزوني',
    'sidebar.warehouses': 'المخازن',
    'sidebar.operations': 'العمليات',
    'sidebar.admin': 'لوحة الإدارة',
    
    // Dashboard Page
    'dashboard.app_name': 'STOCKPRO نظام إدارة المخزون',
    'dashboard.welcome': 'مرحباً بك',
    'dashboard.admin_panel': 'لوحة التحكم الإدارية',
    'dashboard.personal_panel': 'لوحة التحكم الشخصية',
    'dashboard.account': 'الحساب',
    'dashboard.all_fixed_products': 'جميع المنتجات المخزنة بشكل دائم',
    'dashboard.all_moving_products': 'المنتجات الجاهزة للعمليات الميدانية',
    'dashboard.no_fixed_inventory': 'لا يوجد مخزون ثابت حالياً',
    'dashboard.no_moving_inventory': 'لا يوجد مخزون متحرك حالياً',
    'dashboard.request_inventory_hint': 'يمكنك طلب مخزون جديد من خلال زر "طلب مخزون" أعلاه',
    'dashboard.moving_inventory_hint': 'سيظهر المخزون المتحرك بعد قبول طلبات النقل من المستودعات',
    'dashboard.search_placeholder': 'بحث بالاسم أو المدينة...',
    'dashboard.warehouse_management': 'إدارة المستودعات',
    'dashboard.no_warehouses_found': 'لا توجد مستودعات مطابقة للبحث',
    'dashboard.try_other_search': 'جرب كلمات بحث أخرى',
    'dashboard.technicians_panel': 'لوحة الفنيين',
    'dashboard.technicians_overview': 'نظرة شاملة على مخزون جميع الفنيين',
    'dashboard.no_technicians_found': 'لا يوجد فنيين مطابقين للبحث',
    'dashboard.report_date': 'تاريخ التقرير: ',
    'dashboard.report_filename': 'تقرير_المخزون_',
    
    // Messages
    'messages.success': 'تمت العملية بنجاح',
    'messages.error': 'حدث خطأ',
    'messages.loading': 'جاري التحميل...',
    'messages.loading_products': 'جاري تحميل المنتجات...',
    'messages.no_data': 'لا توجد بيانات',
    'messages.confirm_delete': 'هل أنت متأكد من الحذف؟',
  },
  en: {
    // Common
    'app.name': 'Inventory Management System',
    'app.subtitle': 'Welcome, Eissa Al-Fakhani',
    'home': 'Home',
    'back': 'Back',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'add': 'Add',
    'search': 'Search',
    'filter': 'Filter',
    'export': 'Export',
    'import': 'Import',
    'logout': 'Logout',
    'profile': 'Profile',
    'settings': 'Settings',
    'notifications': 'Notifications',
    'language': 'Language',
    'arabic': 'العربية',
    'english': 'English',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.stats': 'Statistics',
    'dashboard.fixed_inventory': 'Fixed Inventory',
    'dashboard.moving_inventory': 'Moving Inventory',
    'dashboard.warehouses': 'Warehouses',
    'dashboard.technicians': 'Technicians',
    
    // Navigation
    'nav.home': 'Home',
    'nav.admin_operations': 'Operations Management',
    'nav.operations': 'Operations',
    'nav.technician_inventory': 'Technician Inventory Dashboard',
    'nav.moving_inventory': 'Moving Inventory',
    'nav.fixed_inventory': 'Fixed Inventory',
    'nav.devices': 'Devices',
    'nav.notifications': 'Notifications',
    'nav.users': 'Users',
    'nav.warehouses': 'Warehouses',
    'nav.main_menu': 'Main Menu',
    
    // Inventory
    'inventory.title': 'Inventory',
    'inventory.fixed': 'Fixed Inventory',
    'inventory.moving': 'Moving Inventory',
    'inventory.add_stock': 'Add Stock',
    'inventory.withdraw': 'Withdraw',
    'inventory.total': 'Total',
    'inventory.available': 'Available',
    'inventory.low': 'Low',
    'inventory.out': 'Out of Stock',
    
    // Warehouses
    'warehouses.title': 'Warehouses',
    'warehouses.add': 'Add Warehouse',
    'warehouses.transfer': 'Transfer from Warehouse',
    'warehouses.details': 'Warehouse Details',
    
    // Users
    'users.title': 'Users',
    'users.add': 'Add User',
    'users.technician': 'Technician',
    'users.supervisor': 'Supervisor',
    'users.admin': 'Administrator',
    'users.role': 'Role',
    'users.region': 'Region',
    'users.active': 'Active',
    'users.inactive': 'Inactive',
    
    // Regions
    'regions.title': 'Regions',
    'regions.add': 'Add Region',
    'regions.name': 'Region Name',
    'regions.code': 'Region Code',
    
    // Admin
    'admin.title': 'Admin Panel',
    'admin.control': 'Full System Control',
    'admin.regions': 'Manage Regions',
    'admin.users': 'Manage Users',
    'admin.system_logs': 'System Operations',
    
    // Products
    'products.n950': 'N950 Device',
    'products.i9000s': 'I9000s Device',
    'products.i9100': 'I9100 Device',
    'products.roll_paper': 'Roll Paper',
    'products.stickers': 'Stickers',
    'products.batteries': 'New Batteries',
    'products.mobily_sim': 'Mobily SIM',
    'products.stc_sim': 'STC SIM',
    'products.zain_sim': 'Zain SIM',
    
    // Units
    'units.box': 'Box',
    'units.boxes': 'Boxes',
    'units.unit': 'Unit',
    'units.units': 'Units',
    
    // Actions
    'actions.quick_withdraw': 'Quick Withdraw',
    'actions.quick_add': 'Quick Add Stock',
    'actions.generate_report': 'Generate Report',
    'actions.view_transactions': 'View Transactions',
    'actions.view_operations': 'Operations',
    'actions.request_inventory': 'Request Inventory',
    'actions.view_details': 'View Details',
    'actions.export_excel': 'Export Excel',
    
    // Sidebar
    'sidebar.home': 'Home',
    'sidebar.quick_actions': 'Quick Actions',
    'sidebar.my_inventory': 'My Inventory',
    'sidebar.warehouses': 'Warehouses',
    'sidebar.operations': 'Operations',
    'sidebar.admin': 'Admin Panel',
    
    // Dashboard Page
    'dashboard.app_name': 'STOCKPRO Inventory Management System',
    'dashboard.welcome': 'Welcome',
    'dashboard.admin_panel': 'Admin Control Panel',
    'dashboard.personal_panel': 'Personal Dashboard',
    'dashboard.account': 'Account',
    'dashboard.all_fixed_products': 'All permanently stored products',
    'dashboard.all_moving_products': 'Products ready for field operations',
    'dashboard.no_fixed_inventory': 'No fixed inventory available',
    'dashboard.no_moving_inventory': 'No moving inventory available',
    'dashboard.request_inventory_hint': 'You can request new inventory using the "Request Inventory" button above',
    'dashboard.moving_inventory_hint': 'Moving inventory will appear after warehouse transfer requests are accepted',
    'dashboard.search_placeholder': 'Search by name or city...',
    'dashboard.warehouse_management': 'Warehouse Management',
    'dashboard.no_warehouses_found': 'No warehouses match your search',
    'dashboard.try_other_search': 'Try different search terms',
    'dashboard.technicians_panel': 'Technicians Panel',
    'dashboard.technicians_overview': 'Comprehensive view of all technicians inventory',
    'dashboard.no_technicians_found': 'No technicians match your search',
    'dashboard.report_date': 'Report Date: ',
    'dashboard.report_filename': 'inventory_report_',
    
    // Messages
    'messages.success': 'Operation successful',
    'messages.error': 'An error occurred',
    'messages.loading': 'Loading...',
    'messages.loading_products': 'Loading products...',
    'messages.no_data': 'No data available',
    'messages.confirm_delete': 'Are you sure you want to delete?',
  }
};
