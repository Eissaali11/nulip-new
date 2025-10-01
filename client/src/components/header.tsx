import { Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import logoPath from "@assets/WhatsApp Image 2025-10-01 at 18.33.50_0c78b604_1759337535480.jpg";

export default function Header() {
  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col items-start space-y-1 sm:space-y-2 min-w-0">
            <img 
              src={logoPath} 
              alt="Neoleap" 
              className="h-6 sm:h-8 md:h-10 w-auto object-contain"
            />
            <h1 className="text-xs sm:text-sm md:text-base font-semibold text-foreground/80 truncate">
              نظام إدارة المخزون
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4 space-x-reverse flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 sm:h-10 sm:w-10"
              data-testid="button-notifications"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[10px] sm:text-xs">
                3
              </span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2 space-x-reverse px-2 sm:px-3" data-testid="button-user-menu">
                  <img 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=40&h=40" 
                    alt="صورة المستخدم" 
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0" 
                  />
                  <span className="text-xs sm:text-sm font-medium hidden xs:inline">أحمد محمد</span>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 hidden xs:inline" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem data-testid="link-profile">الملف الشخصي</DropdownMenuItem>
                <DropdownMenuItem data-testid="link-settings">الإعدادات</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" data-testid="button-logout">
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
