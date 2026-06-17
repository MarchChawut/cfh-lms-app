import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { toggleAttendance, markAllPresent } from '@/app/admin/actions'
import { fmtTimeRange } from '@/lib/utils'
import { ChevronLeft, Check, CheckCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

const fmtFull = (d: Date) =>
  d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

export default async function CheckInPage({ params }: { params: Promise<{ courseId: string; sessionId: string }> }) {
  const { courseId: courseIdStr, sessionId: sessionIdStr } = await params
  const courseId = Number(courseIdStr)
  const sessionId = Number(sessionIdStr)

  const [session, students] = await Promise.all([
    prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { course: true, attendances: { select: { userId: true } } },
    }),
    prisma.user.findMany({ where: { role: 'STUDENT' }, orderBy: { name: 'asc' } }),
  ])
  if (!session || session.courseId !== courseId) notFound()

  const present = new Set(session.attendances.map((a) => a.userId))
  const presentCount = present.size
  const timeRange = fmtTimeRange(
    session.startTime ?? session.course.defaultStartTime,
    session.endTime ?? session.course.defaultEndTime,
  )

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/admin/attendance/${courseId}`} className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> กลับ
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">เช็คชื่อ — {fmtFull(session.date)}</h1>
          <p className="text-sm text-muted-foreground">
            {session.course.title}
            {timeRange ? ` · ${timeRange}` : ''}
            {session.type === 'MAKEUP' ? ' · ชดเชย' : ''}
            {session.topic ? ` · ${session.topic}` : ''} · มาแล้ว {presentCount}/{students.length}
          </p>
        </div>
        <form action={markAllPresent}>
          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="courseId" value={courseId} />
          <button className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
            <CheckCheck className="size-4" /> มาทั้งหมด
          </button>
        </form>
      </div>

      {students.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">ยังไม่มีนักเรียนในระบบ</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {students.map((u) => {
            const on = present.has(u.id)
            return (
              <form key={u.id} action={toggleAttendance}>
                <input type="hidden" name="sessionId" value={sessionId} />
                <input type="hidden" name="userId" value={u.id} />
                <input type="hidden" name="courseId" value={courseId} />
                <button
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                    on ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20' : 'hover:bg-muted/40'
                  }`}
                >
                  <span
                    className={`flex size-5 items-center justify-center rounded border ${
                      on ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-zinc-300'
                    }`}
                  >
                    {on && <Check className="size-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{u.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                  </span>
                  <span className={`text-xs font-semibold ${on ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {on ? 'มา' : 'ขาด'}
                  </span>
                </button>
              </form>
            )
          })}
        </div>
      )}
    </div>
  )
}
