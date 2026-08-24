import { requireAuth } from '@/lib/session';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminHeader } from '@/components/layout/admin-header';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="flex min-h-screen bg-[#F7F8FA]">
      <div className="hidden shrink-0 md:block">
        <AdminSidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1 bg-[#F7F8FA] p-4 md:p-5 lg:p-6">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
        <footer className="mt-auto border-t border-[#E7E8EC] bg-white px-5 py-3 md:px-7">
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between text-[11px] text-gray-400">
            <span>&copy; {new Date().getFullYear()} Karputindo Net</span>
            <span>Customer Management System</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
