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
  Network,
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
  { label: 'MikroTik', href: '/admin/mikrotik', icon: Network },
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
        'sticky top-0 relative flex h-screen flex-col overflow-hidden border-r border-[#1f2025] bg-[linear-gradient(180deg,#050607_0%,#08090c_42%,#0c080a_100%)] text-white shadow-[12px_0_32px_rgba(0,0,0,0.28)] transition-all duration-300',
        collapsed ? 'w-[78px]' : 'w-[276px]'
      )}
    >
      {!collapsed && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-36 -top-36 h-80 w-[28rem] rotate-45 bg-[linear-gradient(135deg,#090a0d_0%,#230305_52%,#8d090f_100%)] opacity-85" />
          <div className="absolute -right-44 top-[21%] h-80 w-[30rem] rotate-45 bg-[linear-gradient(135deg,#090a0d_0%,#170204_47%,#b30912_100%)] opacity-65" />
          <div className="absolute -left-40 top-[50%] h-80 w-[30rem] rotate-45 bg-[#15171b]/88" />
          <div className="absolute -right-44 bottom-[5%] h-[28rem] w-[30rem] rotate-45 bg-[linear-gradient(135deg,#0a0b0e_0%,#470407_44%,#d50a14_100%)] opacity-90" />
          <div className="absolute -left-36 -bottom-40 h-80 w-[28rem] rotate-45 bg-[linear-gradient(135deg,#090a0d_0%,#2b0305_42%,#a6070e_100%)] opacity-90" />
        </div>
      )}

      <div
        className={cn(
          'relative z-10 flex shrink-0 items-center bg-transparent',
          collapsed ? 'h-[92px] justify-center px-2' : 'h-[150px] justify-center px-2'
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
            src="/images/karputindo-logo-sidebar.png"
            alt="Karputindo Internet Service Provider"
            className="block h-auto w-[258px] max-w-full object-contain drop-shadow-[0_2px_2px_rgba(255,255,255,0.18)] drop-shadow-[0_10px_22px_rgba(0,0,0,0.45)]"
          />
        )}
      </div>

      <nav className="relative z-10 flex-1 overflow-y-auto px-3 pb-3 pt-1">
        <div className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex min-h-[54px] items-center gap-4 rounded-[12px] px-5 text-[14px] font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-[linear-gradient(90deg,#f20b18_0%,#d80712_100%)] text-white shadow-[0_10px_28px_rgba(229,9,22,0.34)]'
                    : 'text-[#f2f3f5] hover:bg-white/[0.07] hover:text-white',
                  collapsed && 'justify-center px-0'
                )}
              >
                <item.icon
                  className={cn(
                    'h-[23px] w-[23px] shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-[#f0f1f3] group-hover:text-white'
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

      <div className="relative z-10 shrink-0 px-4 pb-3 pt-2">
        {!collapsed && (
          <div className="mb-3 rounded-[17px] border border-white/20 bg-[#111216]/95 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.38)] backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f20d1c,#b80008)] text-base font-bold text-white shadow-[0_6px_18px_rgba(229,9,24,0.38)]">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-white">{userName}</p>
                <p className="mt-0.5 truncate text-[11px] font-semibold text-[#f20d1c]">{role}</p>
                <p className="mt-1 truncate text-[10px] text-gray-400">{userEmail}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d10a14] bg-black/20 px-3 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#d10a14]/20 hover:text-red-100"
            >
              <LogOut className="h-5 w-5" />
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
