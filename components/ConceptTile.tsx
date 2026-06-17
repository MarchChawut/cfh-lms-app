import Link from 'next/link'
import { cn } from '@/lib/utils'

export type TileStatus = 'completed' | 'in-progress' | 'available' | 'locked'

interface ConceptTileProps {
  href: string
  title: string
  order: number
  emoji: string
  gradClass: string
  /** Small label shown below title (e.g. difficulty or category) */
  sublabel?: string
  /** Number of items inside (lessons or lesson items) */
  itemCount?: number
  status?: TileStatus
  disabled?: boolean
}

function StatusBadge({ status }: { status: TileStatus }) {
  if (status === 'completed') {
    return (
      <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
        ✓
      </span>
    )
  }
  if (status === 'in-progress') {
    return <span className="size-2.5 rounded-full bg-blue-500" />
  }
  if (status === 'locked') {
    return <span className="text-sm text-zinc-400">🔒</span>
  }
  return null
}

export function ConceptTile({
  href,
  title,
  order,
  emoji,
  gradClass,
  sublabel,
  itemCount,
  status = 'available',
  disabled = false,
}: ConceptTileProps) {
  const isLocked = status === 'locked' || disabled

  const inner = (
    <div
      className={cn(
        'group flex flex-col items-center gap-3 rounded-2xl border bg-white p-4 text-center transition-all duration-150',
        'dark:bg-zinc-900',
        isLocked
          ? 'cursor-default border-zinc-200 opacity-60 dark:border-zinc-800'
          : 'cursor-pointer border-zinc-200 hover:border-violet-400 hover:shadow-md dark:border-zinc-800 dark:hover:border-violet-500',
      )}
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
          {sublabel ? ` · ${sublabel}` : ''}
        </span>
        {itemCount !== undefined && <span>{itemCount} บท</span>}
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-center">
        <StatusBadge status={status} />
      </div>
    </div>
  )

  if (isLocked) return inner

  return <Link href={href}>{inner}</Link>
}
