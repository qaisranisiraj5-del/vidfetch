import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import AdminLogoutButton from "./logout-button";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/integrations", label: "Integrations" },
  { href: "/admin/activity", label: "Activity" },
  { href: "/admin/settings", label: "Settings" },
];

/**
 * Admin shell. requireAdmin() re-verifies the role server-side on EVERY
 * admin page load — the middleware session check alone is not trusted.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin({ redirect: true });

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <p className="text-sm font-bold tracking-wide">
            VidFetch <span className="font-normal text-slate-400">· Admin</span>
          </p>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-slate-400 sm:block">{user.email}</span>
            <AdminLogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <nav aria-label="Admin navigation" className="lg:w-56 lg:shrink-0">
          <ul className="flex gap-2 overflow-x-auto lg:flex-col">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="block whitespace-nowrap rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:text-brand-700"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/"
            className="mt-4 block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            ← Back to site
          </Link>
        </nav>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
