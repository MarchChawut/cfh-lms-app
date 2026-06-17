import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { toggleEnrollment, upsertPayment } from '@/app/admin/actions'
import { PaymentForm } from '@/components/admin/forms'
import { hoursBetween } from '@/lib/utils'
import { ChevronLeft, Check } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = Number(id)

  // Attendance window: the current month (UTC, matching the @db.Date sessions).
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  const monthLabel = monthStart.toLocaleDateString('th-TH', { month: 'long', year: 'numeric', timeZone: 'UTC' })

  const [user, courses, attendanceThisMonth] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        enrollments: true,
        payments: { orderBy: { period: 'desc' } },
        progress: { include: { lesson: { include: { course: true, _count: { select: { items: true } } } } } },
      },
    }),
    prisma.course.findMany({ orderBy: { order: 'asc' } }),
    prisma.attendance.findMany({
      where: { userId, session: { date: { gte: monthStart, lt: nextMonth } } },
      include: {
        session: {
          include: {
            course: { select: { id: true, title: true, defaultStartTime: true, defaultEndTime: true } },
          },
        },
      },
    }),
  ])
  if (!user) notFound()

  const enrolledCourseIds = new Set(user.enrollments.map((e) => e.courseId))

  // Present count + accumulated hours per course this month.
  // Hours = sum of each attended session's effective duration (fallback 2h if no time set).
  const attendanceByCourse = new Map<number, { title: string; count: number; hours: number }>()
  for (const a of attendanceThisMonth) {
    const c = a.session.course
    const dur =
      hoursBetween(a.session.startTime ?? c.defaultStartTime, a.session.endTime ?? c.defaultEndTime) ?? 2
    const cur = attendanceByCourse.get(c.id) ?? { title: c.title, count: 0, hours: 0 }
    cur.count++
    cur.hours += dur
    attendanceByCourse.set(c.id, cur)
  }
  const attendanceRows = [...attendanceByCourse.values()]

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/students" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> กลับ
      </Link>
      <div>
        <h1 className="text-2xl font-black">{user.name}</h1>
        <p className="text-sm text-muted-foreground">{user.email} · {user.role === 'ADMIN' ? 'แอดมิน' : 'นักเรียน'}</p>
      </div>

      {/* Enrollment / access control */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-1 font-bold">สิทธิ์เรียน (คอร์สที่อนุญาต)</h2>
        <p className="mb-4 text-xs text-muted-foreground">ติ๊กเพื่อให้/ยกเลิกสิทธิ์เข้าเรียนคอร์ส</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {courses.map((c) => {
            const on = enrolledCourseIds.has(c.id)
            return (
              <form key={c.id} action={toggleEnrollment}>
                <input type="hidden" name="userId" value={userId} />
                <input type="hidden" name="courseId" value={c.id} />
                <button
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                    on
                      ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20'
                      : 'hover:bg-muted/40'
                  }`}
                >
                  <span
                    className={`flex size-5 items-center justify-center rounded border ${
                      on ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-zinc-300'
                    }`}
                  >
                    {on && <Check className="size-3.5" />}
                  </span>
                  <span className="font-semibold">{c.title}</span>
                </button>
              </form>
            )
          })}
        </div>
      </section>

      {/* Progress */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-1 font-bold">ความคืบหน้า (วันนี้เรียนถึงไหน)</h2>
        {user.progress.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">ยังไม่เริ่มเรียน</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y">
            {user.progress.map((p) => {
              const total = p.lesson._count.items
              const reached = Math.min(p.lastItem + 1, total)
              return (
                <li key={p.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <div>
                    <p className="font-semibold">{p.lesson.title}</p>
                    <p className="text-xs text-muted-foreground">{p.lesson.course.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {p.completed ? '🎉 จบบทเรียน' : `ถึงข้อ ${reached}/${total}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ล่าสุด {p.updatedAt.toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Attendance this month */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-1 font-bold">การเข้าเรียน — {monthLabel}</h2>
        <p className="mb-4 text-xs text-muted-foreground">เรียนเดือนละ 4 ครั้ง ครั้งละ 2 ชม.</p>
        {attendanceRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">ยังไม่มีการเข้าเรียนเดือนนี้</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {attendanceRows.map((r) => (
              <li key={r.title} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="font-semibold">{r.title}</span>
                <span className="text-right">
                  มา <span className="font-bold text-emerald-600">{r.count}</span>/4 ครั้ง
                  <span className="ml-2 text-xs text-muted-foreground">({r.hours} ชม.)</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Payments */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-1 font-bold">การจ่ายเงินรายเดือน</h2>
        <p className="mb-4 text-xs text-muted-foreground">บันทึก/อัปเดตสถานะการจ่ายของแต่ละเดือน</p>

        {user.payments.length > 0 && (
          <div className="mb-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm whitespace-nowrap">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-2">เดือน</th>
                <th className="py-2">จำนวน</th>
                <th className="py-2">สถานะ</th>
                <th className="py-2">วันที่จ่าย</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {user.payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 font-semibold">{p.period}</td>
                  <td className="py-2">{Number(p.amount).toLocaleString('th-TH')} ฿</td>
                  <td className="py-2">
                    {p.status === 'PAID' ? (
                      <span className="font-semibold text-emerald-600">✓ จ่ายแล้ว</span>
                    ) : (
                      <span className="font-semibold text-rose-500">ยังไม่จ่าย</span>
                    )}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {p.paidAt ? p.paidAt.toLocaleDateString('th-TH') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        <PaymentForm action={upsertPayment.bind(null, userId)} />
      </section>
    </div>
  )
}
