import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Difficulty } from '@prisma/client'
import { getCourseWithLessons, getCourse, courseAccess, getCourseLessonProgress } from '@/lib/data'
import { getCurrentUser } from '@/lib/guard'
import { buttonVariants } from '@/components/ui/button'
import { CourseRoadmap } from '@/components/CourseRoadmap'
import { CATEGORY_THEME, FALLBACK_THEME } from '@/components/CourseCardFun'
import { cn } from '@/lib/utils'
import { Clock, BookOpen, BarChart3, ChevronRight, Lock } from 'lucide-react'

const LEARN_POINTS: Record<string, string[]> = {
  'html-css-fundamentals': [
    'เขียน HTML ที่ถูกหลัก Semantic ได้',
    'ใช้ Flexbox และ Grid จัดวาง Layout ได้คล่อง',
    'สร้าง Responsive Design รองรับทุกขนาดหน้าจอ',
    'สร้าง Landing Page จริงได้ตั้งแต่ศูนย์',
  ],
  'javascript-essentials': [
    'เข้าใจ JavaScript Core ตั้งแต่ Variables ถึง Closures',
    'จัดการ DOM และ Events ได้อย่างมืออาชีพ',
    'เขียน async code ด้วย Promise และ async/await',
    'สร้าง Todo App สมบูรณ์',
  ],
}
const DEFAULT_LEARN = [
  'เข้าใจหลักการพื้นฐานของเนื้อหาในคอร์สนี้',
  'ลงมือทำ Lab จริงในเบราว์เซอร์',
  'ต่อยอดสู่ระดับขั้นสูงได้',
]

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  BEGINNER: 'ระดับเริ่มต้น',
  INTERMEDIATE: 'ระดับปานกลาง',
  ADVANCED: 'ระดับขั้นสูง',
}

const DIFFICULTY_EMOJI: Record<Difficulty, string> = {
  BEGINNER: '🌱',
  INTERMEDIATE: '🔥',
  ADVANCED: '🚀',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const course = await getCourse(slug)
  if (!course) return { title: 'ไม่พบคอร์ส' }
  return { title: `${course.title} | CFH Kids Code`, description: course.description }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const course = await getCourseWithLessons(slug)
  if (!course) notFound()

  const user = await getCurrentUser()
  const access = user ? await courseAccess(user.id, user.role, course.id) : 'login'
  const hasAccess = access === 'ok'

  // Fetch per-lesson progress only when user has access
  const progressMap = hasAccess && user
    ? await getCourseLessonProgress(user.id, course.id)
    : new Map()

  const learnPoints = LEARN_POINTS[course.slug] ?? DEFAULT_LEARN
  const totalLessons = course.lessons.length
  const theme = CATEGORY_THEME[course.category] ?? FALLBACK_THEME

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Breadcrumb */}
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center gap-1.5 px-4 py-3 text-sm text-zinc-400 sm:px-6">
          <Link href="/#courses" className="hover:text-zinc-600 dark:hover:text-zinc-200">
            คอร์สเรียน
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="line-clamp-1 text-zinc-700 dark:text-zinc-300">{course.title}</span>
        </div>
      </div>

      {/* Course track header */}
      <section className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            {/* Thumbnail */}
            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl bg-zinc-100 shadow-sm sm:w-52 dark:bg-zinc-800">
              <Image
                src={course.thumbnailUrl}
                alt={course.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 208px"
                priority
              />
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col gap-3">
              {/* Category + difficulty */}
              <div className="flex flex-wrap gap-2 text-sm">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                    theme.soft,
                  )}
                >
                  {theme.emoji} {course.category}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {DIFFICULTY_EMOJI[course.difficulty]} {DIFFICULTY_LABEL[course.difficulty]}
                </span>
              </div>

              <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-zinc-50">
                {course.title}
              </h1>
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {course.description}
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4 text-violet-500" />
                  {course.duration}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="size-4 text-violet-500" />
                  {totalLessons} บทเรียน
                </span>
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="size-4 text-violet-500" />
                  {DIFFICULTY_LABEL[course.difficulty]}
                </span>
              </div>

              {/* CTA */}
              <div className="mt-1">
                {access === 'ok' && course.lessons.length > 0 ? (
                  <Link
                    href={`/courses/${course.slug}/lessons/${course.lessons[0].id}`}
                    className={cn(buttonVariants(), 'bg-violet-600 hover:bg-violet-700')}
                  >
                    เข้าเรียน
                  </Link>
                ) : access === 'ok' ? (
                  <span className="inline-flex items-center gap-2 text-sm text-zinc-400">
                    ยังไม่มีบทเรียน
                  </span>
                ) : access === 'login' ? (
                  <Link href="/login" className={cn(buttonVariants())}>
                    เข้าสู่ระบบเพื่อเรียน
                  </Link>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                    <Lock className="size-4" />
                    ติดต่อแอดมินเพื่อรับสิทธิ์เรียน
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learn points */}
      <section className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            สิ่งที่จะได้เรียนรู้
          </h2>
          <ul className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
            {learnPoints.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Lesson concept tile grid */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h2 className="mb-6 flex items-center gap-2 text-base font-semibold text-zinc-800 dark:text-zinc-200">
          🗺️ เส้นทางการเรียน
          <span className="font-normal text-zinc-400">({totalLessons} บทเรียน)</span>
        </h2>

        <CourseRoadmap
          lessons={course.lessons}
          progressMap={progressMap}
          hasAccess={hasAccess}
          courseSlug={course.slug}
          categoryEmoji={theme.emoji}
          categoryGrad={theme.grad}
        />
      </section>
    </main>
  )
}
