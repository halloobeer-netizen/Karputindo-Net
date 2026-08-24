'use client';

import { Bell, ChevronDown, Menu } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AdminSidebar } from './admin-sidebar';

export function AdminHeader() {
  const { data: session } = useSession();
  const name = session?.user?.name || 'Super Admin';
  const role = session?.user?.role === 'SUPER_ADMIN' ? 'Administrator' : 'Admin';
  const initial = name.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex h-[76px] items-center justify-between border-b border-[#E6E7EA] bg-white/95 px-4 backdrop-blur md:px-7">
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2 text-gray-600">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[252px] p-0">
              <AdminSidebar />
            </SheetContent>
          </Sheet>
        </div>

        <div>
          <h2 className="text-[20px] font-extrabold tracking-tight text-[#111318]">
            KARPUTINDO <span className="text-[#E50914]">NET</span>
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">Customer Management System</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative hidden h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 md:flex" aria-label="Notifikasi">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E50914] px-1 text-[9px] font-bold text-white">3</span>
        </button>

        <div className="hidden h-9 w-px bg-gray-200 md:block" />

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D80F1B] text-sm font-bold text-white shadow-sm">
            {initial}
          </div>
          <div className="hidden min-w-[106px] md:block">
            <p className="max-w-[160px] truncate text-sm font-semibold text-[#171717]">{name}</p>
            <p className="text-[11px] text-gray-500">{role}</p>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-gray-500 md:block" />
        </div>
      </div>
    </header>
  );
}
