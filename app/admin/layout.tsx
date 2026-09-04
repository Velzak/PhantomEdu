import Link from "next/link";
import { getSession } from "@/lib/auth";
import { AdminProviders } from "@/components/admin/AdminProviders";
import { AdminSignOut } from "@/components/admin/AdminSignOut";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    return <AdminProviders>{children}</AdminProviders>;
  }

  return (
    <AdminProviders>
      <div className="min-h-screen bg-void">
        <div className="flex min-h-screen">
          <aside className="hidden w-56 shrink-0 border-r border-white/10 bg-surface p-4 md:block">
            <Link href="/admin" className="font-display text-lg font-semibold">
              Phantom Admin
            </Link>
            <nav className="mt-6 grid gap-1 text-sm">
              <Link href="/admin" className="rounded-md px-2 py-2 hover:bg-surface-2">
                Dashboard
              </Link>
              <Link href="/admin/games" className="rounded-md px-2 py-2 hover:bg-surface-2">
                Games
              </Link>
              <Link href="/admin/games/new" className="rounded-md px-2 py-2 hover:bg-surface-2">
                Add game
              </Link>
              <Link href="/admin/reports" className="rounded-md px-2 py-2 hover:bg-surface-2">
                Reports
              </Link>
              <Link href="/" className="rounded-md px-2 py-2 text-muted hover:bg-surface-2">
                View site
              </Link>
            </nav>
            <div className="mt-8 text-xs text-muted">{session.user.email}</div>
            <AdminSignOut />
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:hidden">
              <Link href="/admin" className="font-display font-semibold">
                Admin
              </Link>
              <nav className="flex gap-3 text-sm">
                <Link href="/admin/games">Games</Link>
                <Link href="/admin/reports">Reports</Link>
              </nav>
            </header>
            <div className="flex-1 px-4 py-6 md:px-8">{children}</div>
          </div>
        </div>
      </div>
    </AdminProviders>
  );
}
