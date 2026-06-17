import Link from 'next/link'
import { Pencil, Trash2, ListTree, Users } from 'lucide-react'
import { deleteCourse } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

const DIFFICULTY_LABEL: Record<string, string> = {
  BEGINNER: 'เริ่มต้น',
  INTERMEDIATE: 'ปานกลาง',
  ADVANCED: 'ขั้นสูง',
}

interface AdminCourseTileProps {
  id: number
  title: string
  order: number
  difficulty: string
  isPublished: boolean
  emoji: string
  gradClass: string
  lessonCount: number
  enrollmentCount: number
}

/**
 * Admin variant of ConceptTile. The card body links to lesson management, while
 * edit/delete sit OUTSIDE the link (a <form> button can't nest inside an <a>).
 */
export function AdminCourseTile({
  id,
  title,
  order,
  difficulty,
  isPublished,
  emoji,
  gradClass,
  lessonCount,
  enrollmentCount,
}: AdminCourseTileProps) {
  return (
    <div
      className={cn(
        'group flex flex-col rounded-2xl border bg-white transition-all duration-150 dark:bg-zinc-900',
        'border-zinc-200 hover:border-violet-400 hover:shadow-md dark:border-zinc-800 dark:hover:border-violet-500',
      )}
    >
      {/* Card body → manage lessons */}
      <Link
        href={`/admin/courses/${id}/lessons`}
        className="flex flex-1 flex-col items-center gap-3 p-4 text-center"
      >
        {/* Icon circle */}
        <div
          className={cn(
            'flex size-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-2xl shadow-sm',
            gradClass,
          )}
        >
          {emoji}
        </div>

        {/* Title */}
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-800 dark:text-zinc-100">
          {title}
        </p>

        {/* Meta row */}
        <div className="flex w-full items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
          <span>
            #{order}
            {difficulty ? ` · ${DIFFICULTY_LABEL[difficulty] ?? difficulty}` : ''}
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5">
              <ListTree className="size-3" /> {lessonCount}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Users className="size-3" /> {enrollmentCount}
            </span>
          </span>
        </div>

        {/* Published status */}
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold',
            isPublished
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
          )}
        >
          {isPublished ? '✅ เผยแพร่' : '🚫 ซ่อน'}
        </span>
      </Link>

      {/* Actions — siblings outside the link */}
      <div className="flex items-center justify-center gap-1 border-t border-zinc-100 px-2 py-2 dark:border-zinc-800">
        <Link
          href={`/admin/courses/${id}/edit`}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40"
        >
          <Pencil className="size-3.5" /> แก้ไข
        </Link>
        <form action={deleteCourse}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="size-3.5" /> ลบ
          </button>
        </form>
      </div>
    </div>
  )
}
