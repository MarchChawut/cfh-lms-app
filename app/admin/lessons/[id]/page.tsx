import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { createSlide, createLab, deleteItem, moveItem, uploadSlides } from '@/app/admin/actions'
import { SlideForm, SlideUploadForm, LabForm } from '@/components/admin/forms'
import { isEmbeddableUrl } from '@/lib/canva'
import { ChevronLeft, Trash2, ImageIcon, FlaskConical, ChevronUp, ChevronDown } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LessonItemsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lessonId = Number(id)
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: true,
      items: { orderBy: { order: 'asc' } },
    },
  })
  if (!lesson) notFound()

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/admin/courses/${lesson.courseId}/lessons`}
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> กลับไปหน้าบทเรียน
      </Link>
      <div>
        <h1 className="text-2xl font-black">{lesson.title}</h1>
        <p className="text-sm text-muted-foreground">
          {lesson.course.title} · สไลด์รูป + แล็บ (เรียงตามลำดับ)
        </p>
      </div>

      {/* Items list */}
      <div className="flex flex-col gap-2">
        {lesson.items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-2 rounded-xl border bg-card p-3 sm:gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              {item.type === 'SLIDE' ? (
                <ImageIcon className="size-5 text-violet-500" />
              ) : (
                <FlaskConical className="size-5 text-sky-500" />
              )}
            </div>
            {item.type === 'SLIDE' ? (
              isEmbeddableUrl(item.imageUrl ?? '') ? (
                <span className="hidden h-12 w-20 shrink-0 items-center justify-center rounded bg-violet-100 text-xs font-bold text-violet-600 sm:flex">
                  🎨 Canva
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl ?? ''} alt={item.caption ?? 'slide'} className="hidden h-12 w-20 shrink-0 rounded object-cover sm:block" />
              )
            ) : null}
            <div className="min-w-0 flex-1 text-sm">
              <span className="font-semibold">{item.type === 'SLIDE' ? 'สไลด์' : 'แล็บ'}</span>
              {item.type === 'LAB' && item.title && (
                <span className="ml-2 font-semibold">{item.title}</span>
              )}
              <span className="block truncate text-muted-foreground">
                {item.type === 'SLIDE' ? item.caption : item.goal}
              </span>
            </div>
            <div className="flex flex-col">
              <form action={moveItem}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="dir" value="up" />
                <button
                  disabled={i === 0}
                  className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                  aria-label="เลื่อนขึ้น"
                >
                  <ChevronUp className="size-4" />
                </button>
              </form>
              <form action={moveItem}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="dir" value="down" />
                <button
                  disabled={i === lesson.items.length - 1}
                  className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                  aria-label="เลื่อนลง"
                >
                  <ChevronDown className="size-4" />
                </button>
              </form>
            </div>
            <form action={deleteItem}>
              <input type="hidden" name="id" value={item.id} />
              <button className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50" aria-label="ลบ">
                <Trash2 className="size-4" />
              </button>
            </form>
          </div>
        ))}
        {lesson.items.length === 0 && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            ยังไม่มีสไลด์หรือแล็บ
          </p>
        )}
      </div>

      {/* Add: upload many slides (primary) */}
      <div className="rounded-xl border-2 border-violet-200 bg-violet-50/40 p-5 dark:border-violet-900 dark:bg-violet-950/10">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <ImageIcon className="size-4 text-violet-500" /> อัปโหลดสไลด์ PNG (หลายไฟล์พร้อมกัน)
        </h2>
        <SlideUploadForm action={uploadSlides.bind(null, lessonId)} />
      </div>

      {/* Add: lab + single-url slide */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <FlaskConical className="size-4 text-sky-500" /> เพิ่มแล็บ (StackBlitz)
          </h2>
          <LabForm action={createLab.bind(null, lessonId)} />
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <ImageIcon className="size-4 text-violet-500" /> เพิ่มสไลด์จาก URL (ทางเลือก)
          </h2>
          <SlideForm action={createSlide.bind(null, lessonId)} />
        </div>
      </div>
    </div>
  )
}
