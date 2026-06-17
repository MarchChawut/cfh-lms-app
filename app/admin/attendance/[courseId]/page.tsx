import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { createSession, generateMonthSessions, deleteSession } from '@/app/admin/actions'
import { SessionForm, GenerateMonthForm, type SessionWarning } from '@/components/admin/forms'
import { fmtTimeRange } from '@/lib/utils'
import { ChevronLeft, Trash2, ClipboardCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

const fmtDate = (d: Date) =>
  d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const monthKey = (d: Date) => d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export default async function CourseAttendancePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId: courseIdStr } = await params
  const courseId = Number(courseIdStr)

  const [course, sessions, totalStudents, allSessions] = await Promise.all([
    prisma.course.findUnique({ where: { id: courseId } }),
    prisma.classSession.findMany({
      where: { courseId },
      orderBy: { date: 'desc' },
      include: { _count: { select: { attendances: true } } },
    }),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    // คาบของทุกคอร์ส — ใช้เตือนตอนเลือกวันที่ว่าวันนั้นมีวิชาไหน/เวลาอะไรลงไว้แล้ว
    prisma.classSession.findMany({
      orderBy: { startTime: 'asc' },
      include: { course: { select: { title: true, defaultStartTime: true, defaultEndTime: true } } },
    }),
  ])
  if (!course) notFound()

  // group คาบทุกคอร์สตามวันที่ (YYYY-MM-DD ตรงกับค่า input type=date) สำหรับคำเตือน live
  const sessionsByDate: Record<string, SessionWarning[]> = {}
  for (const s of allSessions) {
    const key = s.date.toISOString().slice(0, 10)
    ;(sessionsByDate[key] ??= []).push({
      courseTitle: s.course.title,
      timeLabel: fmtTimeRange(s.startTime ?? s.course.defaultStartTime, s.endTime ?? s.course.defaultEndTime),
      topic: s.topic,
      type: s.type,
    })
  }

  // Group sessions by month (UTC) preserving the desc order.
  const groups: { label: string; items: typeof sessions }[] = []
  for (const s of sessions) {
    const label = monthKey(s.date)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(s)
    else groups.push({ label, items: [s] })
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/attendance" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> กลับ
      </Link>
      <div>
        <h1 className="text-2xl font-black">{course.title}</h1>
        <p className="text-sm text-muted-foreground">
          จัดการคาบเรียน &amp; เช็คชื่อ (เรียนเสาร์ เดือนละ 4 ครั้ง)
          {fmtTimeRange(course.defaultStartTime, course.defaultEndTime)
            ? ` · เวลาเรียน ${fmtTimeRange(course.defaultStartTime, course.defaultEndTime)}`
            : ' · ยังไม่ได้ตั้งเวลาเรียน (ตั้งได้ที่หน้าแก้ไขคอร์ส)'}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <GenerateMonthForm action={generateMonthSessions.bind(null, courseId)} />
        <SessionForm
          action={createSession.bind(null, courseId)}
          defaultStart={course.defaultStartTime}
          defaultEnd={course.defaultEndTime}
          sessionsByDate={sessionsByDate}
        />
      </div>

      {sessions.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">ยังไม่มีคาบเรียน — สร้างตารางหรือเพิ่มคาบด้านบน</p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <section key={g.label} className="flex flex-col gap-2">
              <h2 className="text-sm font-bold text-muted-foreground">{g.label}</h2>
              <div className="overflow-hidden rounded-xl border bg-card divide-y">
                {g.items.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{fmtDate(s.date)}</span>
                      {fmtTimeRange(s.startTime ?? course.defaultStartTime, s.endTime ?? course.defaultEndTime) && (
                        <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
                          {fmtTimeRange(s.startTime ?? course.defaultStartTime, s.endTime ?? course.defaultEndTime)}
                        </span>
                      )}
                      {s.type === 'MAKEUP' && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                          ชดเชย
                        </span>
                      )}
                      {s.topic && <span className="text-xs text-muted-foreground">· {s.topic}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        มา <span className="font-bold text-emerald-600">{s._count.attendances}</span>/{totalStudents}
                      </span>
                      <Link
                        href={`/admin/attendance/${courseId}/${s.id}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40"
                      >
                        <ClipboardCheck className="size-3.5" /> เช็คชื่อ
                      </Link>
                      <form action={deleteSession}>
                        <input type="hidden" name="id" value={s.id} />
                        <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40">
                          <Trash2 className="size-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
