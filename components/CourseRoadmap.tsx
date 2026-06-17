'use client'

import { useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { TileStatus } from '@/components/ConceptTile'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lesson {
  id: number
  title: string
  order: number
  level: number
  _count: { items: number }
}

interface Props {
  lessons: Lesson[]
  progressMap: Map<number, { completed: boolean; lastItem: number }>
  hasAccess: boolean
  courseSlug: string
  categoryEmoji: string
  categoryGrad: string
}

interface Edge {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  opacity: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NODE_W = 200
const NODE_H = 96

// ─── Helpers ──────────────────────────────────────────────────────────────────

function abbrev(title: string) {
  const words = title.trim().split(/\s+/)
  if (words.length === 1) return title.slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

function StatusIcon({ status }: { status: TileStatus }) {
  if (status === 'completed')
    return (
      <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
        ✓
      </span>
    )
  if (status === 'in-progress') return <span className="size-3 rounded-full bg-blue-500" />
  if (status === 'locked') return <span className="text-base text-zinc-400">🔒</span>
  return <span className="size-3 rounded-full border-2 border-zinc-300" />
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CourseRoadmap({ lessons, progressMap, hasAccess, courseSlug }: Props) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [edges, setEdges] = useState<Edge[]>([])

  // Memoize levels so the array reference is stable between renders —
  // prevents useCallback / useLayoutEffect from re-running on every render.
  const levels = useMemo(() => {
    return Array.from(
      lessons
        .slice()
        .sort((a, b) => a.level - b.level || a.order - b.order)
        .reduce((map, lesson) => {
          const arr = map.get(lesson.level) ?? []
          arr.push(lesson)
          map.set(lesson.level, arr)
          return map
        }, new Map<number, Lesson[]>()),
    ).sort(([a], [b]) => a - b)
  }, [lessons])

  function lessonStatus(id: number): TileStatus {
    if (!hasAccess) return 'locked'
    const prog = progressMap.get(id)
    if (!prog) return 'available'
    if (prog.completed) return 'completed'
    if (prog.lastItem > 0) return 'in-progress'
    return 'available'
  }

  // Only setEdges (no containerSize state) — SVG covers container via CSS inset-0
  const measureEdges = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const cRect = container.getBoundingClientRect()
    const newEdges: Edge[] = []

    for (let li = 0; li < levels.length - 1; li++) {
      const [, fromLessons] = levels[li]
      const [, toLessons] = levels[li + 1]
      const opacity = fromLessons.length > 1 && toLessons.length > 1 ? 0.25 : 0.45

      for (const from of fromLessons) {
        const fromEl = nodeRefs.current.get(from.id)
        if (!fromEl) continue
        const fRect = fromEl.getBoundingClientRect()

        for (const to of toLessons) {
          const toEl = nodeRefs.current.get(to.id)
          if (!toEl) continue
          const tRect = toEl.getBoundingClientRect()

          newEdges.push({
            id: `${from.id}-${to.id}`,
            x1: fRect.left - cRect.left + fRect.width / 2,
            y1: fRect.bottom - cRect.top,
            x2: tRect.left - cRect.left + tRect.width / 2,
            y2: tRect.top - cRect.top,
            opacity,
          })
        }
      }
    }

    setEdges(newEdges)
  }, [levels]) // stable because levels is memoized

  useLayoutEffect(() => {
    measureEdges()
    const obs = new ResizeObserver(measureEdges)
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [measureEdges])

  if (lessons.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-400 dark:border-zinc-800">
        ยังไม่มีบทเรียนในคอร์สนี้
      </p>
    )
  }

  return (
    <div className="overflow-x-auto pb-6">
      <div
        ref={containerRef}
        className="relative mx-auto"
        style={{ minWidth: 640, minHeight: levels.length * (NODE_H + 80) + 40 }}
      >
        {/* SVG edge overlay — sized by CSS inset-0, no state needed */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ overflow: 'visible' }}
        >
          {edges.map((edge) => {
            const midY = (edge.y1 + edge.y2) / 2
            const d = `M ${edge.x1} ${edge.y1} C ${edge.x1} ${midY}, ${edge.x2} ${midY}, ${edge.x2} ${edge.y2}`
            return (
              <path
                key={edge.id}
                d={d}
                fill="none"
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                strokeOpacity={edge.opacity}
              />
            )
          })}
        </svg>

        {/* Level rows */}
        <div className="relative z-10 flex flex-col gap-16 py-4">
          {levels.map(([levelNum, levelLessons]) => (
            <div key={levelNum} className="flex items-start justify-center gap-6 px-4">
              {levelLessons.map((lesson) => {
                const status = lessonStatus(lesson.id)
                const isLocked = status === 'locked'

                return (
                  <div
                    key={lesson.id}
                    ref={(el) => {
                      if (el) nodeRefs.current.set(lesson.id, el)
                      else nodeRefs.current.delete(lesson.id)
                    }}
                    style={{ width: NODE_W, minHeight: NODE_H }}
                    onClick={() => {
                      if (!isLocked)
                        router.push(`/courses/${courseSlug}/lessons/${lesson.id}`)
                    }}
                    className={cn(
                      'flex flex-col gap-2 rounded-2xl border bg-white p-4 shadow-sm transition-all duration-150 dark:bg-zinc-900',
                      isLocked
                        ? 'cursor-default border-zinc-200 opacity-60 dark:border-zinc-800'
                        : 'cursor-pointer border-zinc-200 hover:border-violet-300 hover:shadow-md dark:border-zinc-700 dark:hover:border-violet-500',
                    )}
                  >
                    {/* Abbrev badge + title */}
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 rounded border border-zinc-300 px-1.5 py-0.5 font-mono text-xs font-bold text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
                        {abbrev(lesson.title)}
                      </span>
                      <span className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-800 dark:text-zinc-100">
                        {lesson.title}
                      </span>
                    </div>

                    {/* Item count + status */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">{lesson._count.items} รายการ</span>
                      <StatusIcon status={status} />
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
