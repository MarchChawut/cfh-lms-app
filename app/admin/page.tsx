import Link from 'next/link'
import prisma from '@/lib/prisma'
import { BookOpen, Users, AlertCircle, GraduationCap } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminHome() {
  const period = new Date().toISOString().slice(0, 7)
  const [courseCount, studentCount, paidThisMonth, recentEnrollments] = await Promise.all([
    prisma.course.count(),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.payment.count({ where: { period, status: 'PAID' } }),
    prisma.enrollment.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { user: true, course: true },
    }),
  ])
  const unpaid = studentCount - paidThisMonth

  const cards = [
    { label: 'คอร์สทั้งหมด', value: courseCount, icon: BookOpen, color: 'text-violet-600 bg-violet-100' },
    { label: 'นักเรียน', value: studentCount, icon: Users, color: 'text-sky-600 bg-sky-100' },
    { label: `จ่ายแล้วเดือน ${period}`, value: paidThisMonth, icon: GraduationCap, color: 'text-emerald-600 bg-emerald-100' },
    { label: 'ค้างจ่ายเดือนนี้', value: unpaid < 0 ? 0 : unpaid, icon: AlertCircle, color: 'text-rose-600 bg-rose-100' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black">แดชบอร์ด</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="flex items-center gap-4 rounded-xl border bg-card p-5">
            <div className={`flex size-12 items-center justify-center rounded-xl ${c.color}`}>
              <c.icon className="size-6" />
            </div>
            <div>
              <p className="text-2xl font-black">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 font-bold">ลงเรียนล่าสุด</h2>
        {recentEnrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">ยังไม่มีการลงเรียน</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {recentEnrollments.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/admin/students/${e.userId}`} className="font-semibold hover:text-violet-600">
                  {e.user.name}
                </Link>
                <span className="text-muted-foreground">{e.course.title}</span>
                <span className="text-xs text-muted-foreground">
                  {e.createdAt.toLocaleDateString('th-TH')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
