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
        'sticky top-0 relative flex h-screen flex-col overflow-hidden border-r border-[#1E2025] bg-[linear-gradient(180deg,#08090C_0%,#090A0D_58%,#13090B_100%)] text-white shadow-[12px_0_32px_rgba(0,0,0,0.22)] transition-all duration-300',
        collapsed ? 'w-[78px]' : 'w-[260px]'
      )}
    >
      {!collapsed && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-28 top-[48%] h-64 w-80 rotate-45 bg-[#14161A]/90" />
          <div className="absolute -right-32 top-[62%] h-72 w-80 rotate-45 bg-[linear-gradient(135deg,#210205_0%,#7B070C_45%,#D60B14_100%)] opacity-90" />
          <div className="absolute -left-28 -bottom-20 h-64 w-80 rotate-45 bg-[linear-gradient(135deg,#090A0D_0%,#4B0508_45%,#D90913_100%)] opacity-95" />
        </div>
      )}

      <div
        className={cn(
          'relative z-10 flex h-[122px] shrink-0 items-center border-b border-white/10 bg-transparent',
          collapsed ? 'justify-center px-2' : 'px-4'
        )}
      >
        {collapsed ? (
          <img
            src="/images/karputindo-icon.png"
            alt="Karputindo"
            className="h-12 w-12 rounded-xl object-cover shadow-[0_8px_24px_rgba(221,0,15,0.30)]"
          />
        ) : (
          <div className="flex w-full items-center gap-3">
            <img
              src="/images/karputindo-icon.png"
              alt="Karputindo"
              className="h-[58px] w-[58px] shrink-0 rounded-[15px] object-cover shadow-[0_8px_22px_rgba(213,8,18,0.28)]"
            />
            <div className="min-w-0 flex-1 leading-none">
              <div className="whitespace-nowrap text-[25px] font-semibold tracking-[-1.2px]">
                <span className="text-white">karp</span><span className="text-[#C7C9CD]">utindo</span>
              </div>
              <div className="mt-1 whitespace-nowrap text-[8px] font-medium italic tracking-[0.2px] text-[#E6E7E9]">
                Internet Service Provider
              </div>
            </div>
          </div>
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
                  'group flex min-h-[50px] items-center gap-3 rounded-[10px] px-4 text-[13px] font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-[linear-gradient(90deg,#F20D1C_0%,#D50711_100%)] text-white shadow-[0_8px_24px_rgba(229,9,22,0.28)]'
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
          <div className="mb-3 rounded-[16px] border border-white/20 bg-[#101115]/95 p-4 shadow-[0_10px_28px_rgba(0,0,0,0.34)] backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#F20D1C,#B80008)] text-sm font-bold text-white shadow-[0_5px_16px_rgba(229,9,24,0.35)]">
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
              className="mt-4 flex items-center gap-2 rounded-xl border border-[#C20B14] bg-black/20 px-3 py-2.5 text-[12px] font-medium text-white transition hover:bg-[#C20B14]/20 hover:text-red-200"
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
