'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Package,
  FileSpreadsheet,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState } from 'react';

const menuItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Pelanggan', href: '/admin/customers', icon: Users },
  { label: 'Peta Pelanggan', href: '/admin/map', icon: MapPin },
  { label: 'Paket Internet', href: '/admin/packages', icon: Package },
  { label: 'Import Excel', href: '/admin/import', icon: FileSpreadsheet },
  { label: 'Laporan', href: '/admin/reports', icon: BarChart3 },
  { label: 'Admin', href: '/admin/users', icon: UserCog },
  { label: 'Pengaturan', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const userName = session?.user?.name || 'Super Admin';
  const userEmail = session?.user?.email || 'admin@karputindo.net';
  const role = session?.user?.role || 'SUPER_ADMIN';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <aside
      className={cn(
        'sticky top-0 relative flex h-screen flex-col overflow-hidden border-r border-[#202228] bg-[#090B0E] text-white shadow-[12px_0_32px_rgba(0,0,0,0.18)] transition-all duration-300',
        collapsed ? 'w-[78px]' : 'w-[250px]'
      )}
    >
      {!collapsed && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] overflow-hidden">
          <div className="absolute -left-24 bottom-32 h-56 w-72 rotate-45 bg-[#15171B] opacity-95" />
          <div className="absolute -left-10 bottom-8 h-64 w-72 rotate-45 bg-[linear-gradient(135deg,#16181D_0%,#090B0E_56%,#7B080C_100%)] opacity-95" />
          <div className="absolute -right-24 -bottom-28 h-72 w-80 rotate-45 bg-[linear-gradient(135deg,#310305_0%,#C10912_58%,#E30B17_100%)] opacity-95" />
        </div>
      )}

      <div
        className={cn(
          'relative z-10 flex h-[126px] shrink-0 items-center border-b border-white/10 bg-[linear-gradient(180deg,#0C0E12_0%,#090B0E_100%)]',
          collapsed ? 'justify-center px-2' : 'justify-center px-4'
        )}
      >
        {collapsed ? (
          <img
            src="/images/karputindo-icon.png"
            alt="Karputindo"
            className="h-12 w-12 rounded-xl object-cover shadow-[0_8px_24px_rgba(221,0,15,0.30)]"
          />
        ) : (
          <img
            src="/images/karputindo-logo-sidebar.png.png"
            alt="Karputindo Internet Service Provider"
            className="h-[88px] w-[210px] object-contain drop-shadow-[0_5px_14px_rgba(0,0,0,0.45)]"
          />
        )}
      </div>

      <nav className="relative z-10 flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex min-h-[48px] items-center gap-3 rounded-[9px] px-4 text-[13px] font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-[linear-gradient(90deg,#E50916_0%,#CB0710_100%)] text-white shadow-[0_8px_22px_rgba(229,9,22,0.26)]'
                    : 'text-[#F0F1F3] hover:bg-white/[0.07] hover:text-white',
                  collapsed && 'justify-center px-0'
                )}
              >
                <item.icon
                  className={cn(
                    'h-[20px] w-[20px] shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-[#E4E6EA] group-hover:text-white'
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </div>
      </nav>

      <div className="relative z-10 shrink-0 p-4 pt-2">
        {!collapsed && (
          <div className="mb-3 rounded-[12px] border border-white/20 bg-[#101216]/95 p-4 shadow-[0_10px_28px_rgba(0,0,0,0.34)] backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#F20D1C,#B80008)] text-sm font-bold text-white shadow-[0_5px_16px_rgba(229,9,24,0.35)]">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">{userName}</p>
                <p className="mt-0.5 truncate text-[10px] font-semibold text-[#F20D1C]">{role}</p>
                <p className="mt-1 truncate text-[10px] text-gray-400">{userEmail}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-4 flex items-center gap-2 rounded-lg border border-[#B30A12] bg-black/20 px-3 py-2 text-[12px] font-medium text-white transition hover:bg-[#B30A12]/20 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        )}

        {collapsed && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center rounded-lg py-2.5 text-gray-400 transition hover:bg-white/[0.07] hover:text-red-400"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Logout</TooltipContent>
          </Tooltip>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'mt-1 flex w-full items-center rounded-lg py-1.5 text-[10px] text-gray-500 transition hover:bg-white/[0.06] hover:text-gray-300',
            collapsed ? 'justify-center' : 'justify-end gap-1 px-2'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <span>Tutup Sidebar</span>
              <ChevronLeft className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
