import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { LessonItem } from '@prisma/client'
import { getLessonWithItems, courseAccess } from '@/lib/data'
import { getCurrentUser } from '@/lib/guard'
import { SlideViewer } from '@/components/SlideViewer'
import type { LessonItemView } from '@/lib/lesson-types'
import { ChevronRight } from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonId: string }>
}): Promise<Metadata> {
  const { lessonId } = await params
  const lesson = await getLessonWithItems(Number(lessonId))
  if (!lesson) return { title: 'ไม่พบบทเรียน' }
  return { title: `${lesson.title} | CFH Kids Code`, description: lesson.description }
}

function toView(items: LessonItem[]): LessonItemView[] {
  return items.map((it) =>
    it.type === 'SLIDE'
      ? { id: it.id, type: 'SLIDE' as const, order: it.order, imageUrl: it.imageUrl ?? '', caption: it.caption }
      : {
          id: it.id,
          type: 'LAB' as const,
          order: it.order,
          title: it.title ?? 'Lab',
          goal: it.goal ?? '',
          steps: (it.steps as string[]) ?? [],
          files: (it.files as Record<string, string>) ?? {},
          openFile: it.openFile ?? undefined,
        },
  )
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>
}) {
  const { slug, lessonId } = await params
  const lesson = await getLessonWithItems(Number(lessonId))
  if (!lesson || lesson.course.slug !== slug) notFound()

  const user = await getCurrentUser()

  // Access control — not free: must be logged in + enrolled + paid this month
  if (!user) {
    return <AccessGate slug={slug} reason="login" />
  }
  const access = await courseAccess(user.id, user.role, lesson.courseId)
  if (access !== 'ok') {
    return <AccessGate slug={slug} reason={access} />
  }

  const items = toView(lesson.items)

  return (
    <main className="min-h-screen pb-16">
      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="mx-auto flex max-w-4xl items-center gap-1.5 px-4 py-3 text-sm text-muted-foreground sm:px-6">
          <Link href="/#courses" className="hover:text-foreground">คอร์สเรียน</Link>
          <ChevronRight className="size-3.5" />
          <Link href={`/courses/${slug}`} className="hover:text-foreground">{lesson.course.title}</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">{lesson.title}</span>
        </div>
      </div>

      {/* Header */}
      <div className="border-b bg-muted/10 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-xl font-bold sm:text-2xl">{lesson.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{lesson.description}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>📖 {items.length} รายการ</span>
            <span className="text-blue-600 dark:text-blue-400">
              💻 {items.filter((i) => i.type === 'LAB').length} แล็บ
            </span>
          </div>
        </div>
      </div>

      {/* Viewer */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {items.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">บทเรียนนี้ยังไม่มีเนื้อหา</p>
        ) : (
          <SlideViewer lessonId={lesson.id} items={items} />
        )}
      </div>
    </main>
  )
}

function AccessGate({ slug, reason }: { slug: string; reason: 'login' | 'enroll' }) {
  const copy = {
    login: {
      emoji: '🔒',
      title: 'ต้องเข้าสู่ระบบก่อน',
      desc: 'บทเรียนนี้สำหรับนักเรียนที่ลงทะเบียนแล้ว กรุณาเข้าสู่ระบบ',
      href: '/login',
      cta: 'เข้าสู่ระบบ',
    },
    enroll: {
      emoji: '🔒',
      title: 'ยังไม่ได้รับสิทธิ์เรียนคอร์สนี้',
      desc: 'คอร์สนี้ไม่ฟรี — กรุณาติดต่อแอดมินเพื่อขอสิทธิ์เข้าเรียน 🙏',
      href: `/courses/${slug}`,
      cta: 'กลับไปหน้าคอร์ส',
    },
  }[reason]

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-violet-100 text-3xl">
        {copy.emoji}
      </div>
      <h1 className="text-2xl font-black">{copy.title}</h1>
      <p className="max-w-md text-muted-foreground">{copy.desc}</p>
      <Link href={copy.href} className="rounded-2xl bg-violet-600 px-6 py-3 font-bold text-white hover:bg-violet-700">
        {copy.cta}
      </Link>
    </main>
  )
}
