import { requireAuth } from '@/lib/session';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminHeader } from '@/components/layout/admin-header';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 p-4 md:p-6 bg-background">
          {children}
        </main>
        {/* Footer */}
        <footer className="border-t border-border bg-white px-6 py-3 mt-auto">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} Karputindo Net</span>
            <span>Customer Management System v1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
