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
import { Button } from '@/components/ui/button';
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
        'flex flex-col bg-sidebar text-sidebar-foreground h-screen sticky top-0 transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      {/* Brand Header — Horizontal Logo */}
      <div
        className={cn(
          'flex items-center shrink-0 px-5 py-3',
          collapsed ? 'justify-center' : ''
        )}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {!collapsed ? (
          <img
            src="/images/karputindo-logo-sidebar.png"
            alt="Karputindo Net - Internet Service Provider"
            style={{ width: '155px', height: 'auto', objectFit: 'contain' }}
          />
        ) : (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(227,6,19,0.9)' }}
          >
            <span className="text-sm font-extrabold text-white tracking-tight">KN</span>
          </div>
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
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                collapsed && 'justify-center px-0'
              )}
            >
              <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-sidebar-primary')} />
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
      <div className="border-t border-sidebar-border p-3 space-y-1">
        {/* User Info */}
        {!collapsed && session?.user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {session.user.name}
            </p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">
              {session.user.role}
            </p>
            <p className="text-[10px] text-sidebar-foreground/40 truncate">
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
                className="flex items-center justify-center w-full px-0 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
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
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Logout</span>
          </button>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center w-full py-2 rounded-lg text-xs text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors',
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
