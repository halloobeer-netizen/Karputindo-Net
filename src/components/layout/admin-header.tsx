'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AdminSidebar } from './admin-sidebar';

export function AdminHeader() {
  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      {/* Mobile menu */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-ml-2 text-gray-600">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[260px]">
            <AdminSidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Page title area */}
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-gray-500 md:text-base">
          Karputindo Net
        </h2>
      </div>

      {/* Right side - user info placeholder for desktop */}
      <div className="hidden md:flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#C51F2A]/10 flex items-center justify-center">
          <span className="text-xs font-semibold text-[#C51F2A]">A</span>
        </div>
      </div>
    </header>
  );
}
