import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { createLesson, deleteLesson } from '@/app/admin/actions'
import { LessonForm } from '@/components/admin/forms'
import { ChevronLeft, Trash2, SlidersHorizontal } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CourseLessonsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const courseId = Number(id)
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        include: { _count: { select: { items: true } } },
      },
    },
  })
  if (!course) notFound()

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/courses" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> กลับไปหน้าคอร์ส
      </Link>
      <div>
        <h1 className="text-2xl font-black">บทเรียน — {course.title}</h1>
        <p className="text-sm text-muted-foreground">จัดการบทเรียนในคอร์สนี้</p>
      </div>

      <LessonForm action={createLesson.bind(null, courseId)} />

      <div className="flex flex-col gap-2">
        {course.lessons.map((l) => (
          <div key={l.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
            <div>
              <p className="font-semibold">
                <span className="mr-2 text-xs text-muted-foreground">#{l.order}</span>
                {l.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {l.description} · {l._count.items} รายการ
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/admin/lessons/${l.id}`}
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-violet-600 hover:bg-violet-50"
              >
                <SlidersHorizontal className="size-3.5" /> จัดการสไลด์/แล็บ
              </Link>
              <form action={deleteLesson}>
                <input type="hidden" name="id" value={l.id} />
                <button className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                  <Trash2 className="size-3.5" /> ลบ
                </button>
              </form>
            </div>
          </div>
        ))}
        {course.lessons.length === 0 && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            ยังไม่มีบทเรียน — เพิ่มด้านบน
          </p>
        )}
      </div>
    </div>
  )
}
