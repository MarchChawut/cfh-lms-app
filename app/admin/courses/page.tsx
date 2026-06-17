import Link from 'next/link'
import prisma from '@/lib/prisma'
import { AdminCourseTile } from '@/components/admin/AdminCourseTile'
import { CATEGORY_THEME, FALLBACK_THEME } from '@/components/CourseCardFun'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminCourses({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { category } = await searchParams
  const activeCategory = typeof category === 'string' ? category : 'ทั้งหมด'

  // Admin sees every course, including unpublished ones.
  const allCourses = await prisma.course.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { lessons: true, enrollments: true } } },
  })
  const courses =
    activeCategory === 'ทั้งหมด'
      ? allCourses
      : allCourses.filter((c) => c.category === activeCategory)

  // Tabs = categories actually in use, ordered by known-theme order then extras.
  const usedCategories = [...new Set(allCourses.map((c) => c.category))]
  const themeOrder = Object.keys(CATEGORY_THEME)
  usedCategories.sort((a, b) => {
    const ia = themeOrder.indexOf(a)
    const ib = themeOrder.indexOf(b)
    return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib) || a.localeCompare(b)
  })
  const CATEGORIES = ['ทั้งหมด', ...usedCategories]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">จัดการคอร์ส</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ทั้งหมด {allCourses.length} คอร์ส · คลิกการ์ดเพื่อจัดการบทเรียน
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700"
        >
          <Plus className="size-4" /> เพิ่มคอร์ส
        </Link>
      </div>

      {/* Category filter tabs */}
      <nav className="flex gap-1 overflow-x-auto" aria-label="Category filter">
        {CATEGORIES.map((cat) => {
          const theme = CATEGORY_THEME[cat]
          const isActive = cat === activeCategory
          return (
            <Link
              key={cat}
              href={cat === 'ทั้งหมด' ? '/admin/courses' : `/admin/courses?category=${encodeURIComponent(cat)}`}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800',
              )}
            >
              {theme ? `${theme.emoji} ` : ''}
              {cat}
            </Link>
          )
        })}
      </nav>

      {/* Course tile grid */}
      {courses.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">
          {allCourses.length === 0 ? 'ยังไม่มีคอร์ส' : 'ไม่มีคอร์สในหมวดนี้'}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {courses.map((course) => {
            const theme = CATEGORY_THEME[course.category] ?? FALLBACK_THEME
            return (
              <AdminCourseTile
                key={course.id}
                id={course.id}
                title={course.title}
                order={course.order}
                difficulty={course.difficulty}
                isPublished={course.isPublished}
                emoji={theme.emoji}
                gradClass={theme.grad}
                lessonCount={course._count.lessons}
                enrollmentCount={course._count.enrollments}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
