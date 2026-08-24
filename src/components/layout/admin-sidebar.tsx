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

  return (
    <aside
      className={cn(
        'flex h-screen sticky top-0 flex-col bg-[#111318] text-white border-r border-[#252832] shadow-xl shadow-black/10 transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[268px]'
      )}
    >
      <div className={cn(
        'flex h-[92px] shrink-0 items-center border-b border-[#252832] bg-[#0D0F13]',
        collapsed ? 'justify-center px-2' : 'justify-center px-5'
      )}>
        <img
          src="/images/karputindo-logo-sidebar.png"
          alt="Karputindo Net"
          className={cn(
            'object-contain transition-all duration-300',
            collapsed ? 'max-h-11 max-w-[52px]' : 'max-h-[64px] max-w-[205px]'
          )}
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[#C51F2A] text-white shadow-md shadow-[#C51F2A]/20'
                  : 'text-gray-400 hover:bg-[#1C1E25] hover:text-white',
                collapsed && 'justify-center px-0'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5 shrink-0 transition-colors',
                isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'
              )} />
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
      </nav>

      <div className="border-t border-[#252832] bg-[#0D0F13] p-3 space-y-1">
        {!collapsed && session?.user && (
          <div className="mb-2 rounded-xl border border-[#252832] bg-[#15171D] px-3 py-3">
            <p className="truncate text-xs font-semibold text-white">
              {session.user.name}
            </p>
            <p className="mt-0.5 truncate text-[10px] uppercase tracking-wide text-[#D4525A]">
              {session.user.role}
            </p>
            <p className="mt-1 truncate text-[10px] text-gray-500">
              {session.user.email}
            </p>
          </div>
        )}

        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center rounded-xl py-2.5 text-gray-400 transition-colors hover:bg-[#1C1E25] hover:text-red-400"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">Logout</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-[#1C1E25] hover:text-red-400"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Logout</span>
          </button>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex w-full items-center rounded-xl py-2 text-xs text-gray-600 transition-colors hover:bg-[#1C1E25] hover:text-gray-300',
            collapsed ? 'justify-center' : 'justify-end gap-2 px-3'
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
