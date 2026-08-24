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
  const initial = userName.charAt(0).toUpperCase();

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen flex-col overflow-hidden border-r border-[#181A1F] bg-[#07090C] text-white shadow-[10px_0_30px_rgba(0,0,0,0.14)] transition-all duration-300',
        collapsed ? 'w-[76px]' : 'w-[228px]'
      )}
    >
      <div
        className={cn(
          'flex h-[118px] shrink-0 items-center border-b border-white/10 bg-[linear-gradient(180deg,#0B0D11_0%,#07090C_100%)]',
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
              className="h-[58px] w-[58px] shrink-0 rounded-xl object-cover shadow-[0_8px_24px_rgba(221,0,15,0.28)]"
            />
            <div className="min-w-0 leading-none">
              <div className="whitespace-nowrap text-[19px] font-extrabold tracking-[-0.04em] text-white">
                karputindo
              </div>
              <div className="mt-1.5 whitespace-nowrap text-[8px] font-medium tracking-[0.01em] text-[#B8BBC2]">
                Internet Service Provider
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-5">
        <div className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex min-h-[48px] items-center gap-3 rounded-[10px] px-4 text-[13px] font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-[linear-gradient(90deg,#F20D1C_0%,#C9000A_100%)] text-white shadow-[0_8px_24px_rgba(235,10,25,0.28)]'
                    : 'text-[#F1F3F5] hover:bg-[#17191E] hover:text-white',
                  collapsed && 'justify-center px-0'
                )}
              >
                <item.icon
                  className={cn(
                    'h-[19px] w-[19px] shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-[#D8DBE0] group-hover:text-white'
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

      <div className="shrink-0 border-t border-white/10 bg-[#07090C] p-3">
        {!collapsed && (
          <div className="mb-3 flex items-center gap-3 border-b border-white/10 px-1 pb-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#F20D1C,#B80008)] text-xs font-bold text-white shadow-[0_4px_14px_rgba(229,9,24,0.30)]">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">{userName}</p>
              <p className="mt-0.5 truncate text-[10px] text-gray-500">{userEmail}</p>
            </div>
          </div>
        )}

        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center rounded-lg py-2.5 text-gray-400 transition hover:bg-[#17191E] hover:text-red-400"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Logout</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-[13px] font-medium text-gray-300 transition hover:bg-[#17191E] hover:text-red-400"
          >
            <LogOut className="h-[19px] w-[19px]" />
            <span>Logout</span>
          </button>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'mt-1 flex w-full items-center rounded-lg py-1.5 text-[10px] text-gray-600 transition hover:bg-[#17191E] hover:text-gray-300',
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
