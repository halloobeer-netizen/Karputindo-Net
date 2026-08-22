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
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Pelanggan',
    href: '/admin/customers',
    icon: Users,
  },
  {
    label: 'Peta Pelanggan',
    href: '/admin/map',
    icon: MapPin,
  },
  {
    label: 'Paket Internet',
    href: '/admin/packages',
    icon: Package,
  },
  {
    label: 'Import Excel',
    href: '/admin/import',
    icon: FileSpreadsheet,
  },
  {
    label: 'Laporan',
    href: '/admin/reports',
    icon: BarChart3,
  },
  {
    label: 'Admin',
    href: '/admin/users',
    icon: UserCog,
  },
  {
    label: 'Pengaturan',
    href: '/admin/settings',
    icon: Settings,
  },
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
        'flex flex-col bg-[#111318] text-white h-screen sticky top-0 transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[#1E2028] shrink-0">
        {collapsed ? (
          <div className="flex items-center justify-center w-full">
            <img
              src="/images/karputindo-logo-sidebar.png"
              alt="Karputindo Net"
              className="h-8 w-auto"
            />
          </div>
        ) : (
          <>
            <img
              src="/images/karputindo-logo-sidebar.png"
              alt="Karputindo Net"
              className="h-10 w-auto shrink-0"
            />
          </>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#C51F2A] text-white'
                  : 'text-gray-400 hover:bg-[#1C1E25] hover:text-white',
                collapsed && 'justify-center px-0'
              )}
            >
              <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-white')} />
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

      {/* Bottom Section */}
      <div className="border-t border-[#1E2028] p-3 space-y-1">
        {/* User Info */}
        {!collapsed && session?.user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-medium text-gray-400 truncate">
              {session.user.name}
            </p>
            <p className="text-[10px] text-gray-400/70 truncate">
              {session.user.role}
            </p>
            <p className="text-[10px] text-gray-400/50 truncate">
              {session.user.email}
            </p>
          </div>
        )}

        {/* Logout Button */}
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-full px-0 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-[#1C1E25] hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5 shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              Logout
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-[#1C1E25] hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Logout</span>
          </button>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center w-full py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-colors',
            collapsed ? 'justify-center' : 'justify-end px-3 gap-2'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <span>Tutup Sidebar</span>
              <ChevronLeft className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
