import Image from 'next/image'
import Link from 'next/link'
import type { Course, Difficulty } from '@prisma/client'
import { cn } from '@/lib/utils'

export const CATEGORY_THEME: Record<
  string,
  { emoji: string; label: string; grad: string; soft: string; ring: string }
> = {
  Frontend: {
    emoji: '🎨',
    label: 'หน้าเว็บสวยๆ',
    grad: 'from-pink-400 to-rose-400',
    soft: 'bg-pink-100 text-pink-700',
    ring: 'group-hover/fun:ring-pink-300',
  },
  Backend: {
    emoji: '⚙️',
    label: 'เบื้องหลังระบบ',
    grad: 'from-sky-400 to-cyan-400',
    soft: 'bg-sky-100 text-sky-700',
    ring: 'group-hover/fun:ring-sky-300',
  },
  DevOps: {
    emoji: '🚀',
    label: 'ส่งเว็บขึ้นจริง',
    grad: 'from-amber-400 to-orange-400',
    soft: 'bg-amber-100 text-amber-700',
    ring: 'group-hover/fun:ring-amber-300',
  },
  'Graphic&Design': {
    emoji: '🖌️',
    label: 'งานออกแบบ',
    grad: 'from-fuchsia-400 to-pink-400',
    soft: 'bg-fuchsia-100 text-fuchsia-700',
    ring: 'group-hover/fun:ring-fuchsia-300',
  },
  IoT: {
    emoji: '📡',
    label: 'อุปกรณ์อัจฉริยะ',
    grad: 'from-emerald-400 to-teal-400',
    soft: 'bg-emerald-100 text-emerald-700',
    ring: 'group-hover/fun:ring-emerald-300',
  },
  'Block Programming': {
    emoji: '🧩',
    label: 'เขียนโค้ดแบบบล็อก',
    grad: 'from-indigo-400 to-blue-400',
    soft: 'bg-indigo-100 text-indigo-700',
    ring: 'group-hover/fun:ring-indigo-300',
  },
}

export const FALLBACK_THEME = {
  emoji: '✨',
  label: 'น่าเรียน',
  grad: 'from-violet-400 to-purple-400',
  soft: 'bg-violet-100 text-violet-700',
  ring: 'group-hover/fun:ring-violet-300',
}

const difficultyFun: Record<Difficulty, string> = {
  BEGINNER: '🌱 เริ่มต้น',
  INTERMEDIATE: '🔥 ปานกลาง',
  ADVANCED: '🚀 ขั้นสูง',
}

export function getCategoryTheme(category: string) {
  return CATEGORY_THEME[category] ?? FALLBACK_THEME
}

export function CourseCardFun({ course }: { course: Course }) {
  const theme = getCategoryTheme(course.category)

  return (
    <Link
      href={`/courses/${course.slug}`}
      className={cn(
        'group/fun flex flex-col overflow-hidden rounded-3xl bg-white shadow-md ring-2 ring-transparent transition-all duration-200',
        'hover:-translate-y-1.5 hover:shadow-xl dark:bg-zinc-900',
        theme.ring,
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <Image
          src={course.thumbnailUrl}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-300 group-hover/fun:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* order badge */}
        <div
          className={cn(
            'absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br text-sm font-extrabold text-white shadow-lg',
            theme.grad,
          )}
        >
          {course.order}
        </div>
        {/* difficulty pill */}
        <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-zinc-700 shadow dark:bg-zinc-800/90 dark:text-zinc-100">
          {difficultyFun[course.difficulty]}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span
          className={cn(
            'inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold',
            theme.soft,
          )}
        >
          {theme.emoji} {course.category}
        </span>

        <h3 className="text-lg font-extrabold leading-snug text-zinc-800 line-clamp-2 dark:text-zinc-50">
          {course.title}
        </h3>

        <p className="flex-1 text-sm text-zinc-500 line-clamp-2 dark:text-zinc-400">
          {course.description}
        </p>

        {/* CTA */}
        <span
          className={cn(
            'mt-2 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-linear-to-r px-4 py-2.5 text-sm font-extrabold text-white shadow-md transition-transform group-hover/fun:scale-[1.02]',
            theme.grad,
          )}
        >
          ไปเรียนเลย! →
        </span>
      </div>
    </Link>
  )
}
