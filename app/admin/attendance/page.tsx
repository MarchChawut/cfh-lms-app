import Link from 'next/link'
import prisma from '@/lib/prisma'
import { fmtTimeRange } from '@/lib/utils'
import { ChevronRight, CalendarCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AttendanceCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { sessions: true } } },
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">เช็คชื่อเข้าเรียน</h1>
        <p className="mt-1 text-sm text-muted-foreground">เลือกคอร์สเพื่อจัดการคาบเรียนและเช็คชื่อนักเรียน</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {courses.map((c) => (
          <Link
            key={c.id}
            href={`/admin/attendance/${c.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-violet-400 hover:bg-violet-50/40 dark:hover:bg-violet-950/20"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950/40">
                <CalendarCheck className="size-5" />
              </span>
              <div>
                <p className="font-semibold">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {c._count.sessions} คาบเรียน
                  {fmtTimeRange(c.defaultStartTime, c.defaultEndTime)
                    ? ` · ${fmtTimeRange(c.defaultStartTime, c.defaultEndTime)}`
                    : ''}
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
        {courses.length === 0 && (
          <p className="text-sm text-muted-foreground">ยังไม่มีคอร์ส</p>
        )}
      </div>
    </div>
  )
}
