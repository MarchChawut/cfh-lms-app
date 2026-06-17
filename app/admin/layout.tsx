import Link from 'next/link'
import { requireAdmin } from '@/lib/guard'
import { logout } from '@/app/actions/auth'
import { LayoutDashboard, BookOpen, Users, Home, CalendarCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()

  const nav = [
    { href: '/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { href: '/admin/courses', label: 'คอร์ส', icon: BookOpen },
    { href: '/admin/students', label: 'นักเรียน', icon: Users },
    { href: '/admin/attendance', label: 'เช็คชื่อ', icon: CalendarCheck },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 lg:flex-row dark:bg-zinc-950">
      {/* Mobile top bar */}
      <header className="flex flex-col gap-2 border-b bg-white px-4 py-3 lg:hidden dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-1.5 font-extrabold">
            <span className="text-xl">🛠️</span> Admin
          </Link>
          <form action={logout}>
            <button type="submit" className="text-sm font-semibold text-rose-600">
              ออกจากระบบ
            </button>
          </form>
        </div>
        <nav className="-mx-1 flex gap-1 overflow-x-auto whitespace-nowrap pb-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <Home className="size-4" /> หน้าเว็บ
          </Link>
        </nav>
      </header>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-white lg:flex dark:bg-zinc-900">
        <div className="border-b px-5 py-4">
          <Link href="/admin" className="flex items-center gap-1.5 font-extrabold">
            <span className="text-xl">🛠️</span> Admin
          </Link>
          <p className="mt-1 truncate text-xs text-muted-foreground">{admin.email}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-1 border-t p-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Home className="size-4" /> กลับหน้าเว็บ
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>

      {/* Content */}
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 lg:p-8">{children}</main>
    </div>
  )
}
