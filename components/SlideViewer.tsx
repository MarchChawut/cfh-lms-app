'use client'

import { useEffect, useState } from 'react'
import type { LessonItemView } from '@/lib/lesson-types'
import { StackBlitzEmbed } from './StackBlitzEmbed'
import { saveProgress } from '@/app/actions/progress'
import { cn } from '@/lib/utils'
import { isEmbeddableUrl, toCanvaEmbedSrc } from '@/lib/canva'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

type SlideItem = Extract<LessonItemView, { type: 'SLIDE' }>

/** The slide media itself (Canva iframe or plain image), fills its parent. */
function SlideMedia({ item, className }: { item: SlideItem; className?: string }) {
  if (isEmbeddableUrl(item.imageUrl)) {
    return (
      <iframe
        src={toCanvaEmbedSrc(item.imageUrl)}
        className={cn('size-full', className)}
        loading="lazy"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        title={item.caption ?? 'slide'}
      />
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.imageUrl}
      alt={item.caption ?? 'slide'}
      className={cn('size-full object-contain', className)}
    />
  )
}

function SlideView({ item, onExpand }: { item: SlideItem; onExpand: () => void }) {
  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted">
        <SlideMedia item={item} className="absolute inset-0" />
        <button
          type="button"
          onClick={onExpand}
          aria-label="ดูเต็มจอ"
          className="absolute right-2 top-2 z-10 rounded-lg bg-black/55 p-2 text-white backdrop-blur-sm transition hover:bg-black/75"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>
      {item.caption && (
        <p className="text-center text-sm text-muted-foreground">{item.caption}</p>
      )}
    </div>
  )
}

function LabView({ item }: { item: Extract<LessonItemView, { type: 'LAB' }> }) {
  return (
    <div className="flex flex-col gap-5 py-4">
      <h2 className="text-2xl font-bold">{item.title}</h2>
      <StackBlitzEmbed
        slide={{
          title: item.title,
          goal: item.goal,
          steps: item.steps,
          files: item.files,
          openFile: item.openFile,
        }}
      />
    </div>
  )
}

export function SlideViewer({ lessonId, items }: { lessonId: number; items: LessonItemView[] }) {
  const [index, setIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const total = items.length
  const item = items[index]
  const isLab = item.type === 'LAB'

  // Save how far the student has reached (fire-and-forget)
  useEffect(() => {
    void saveProgress(lessonId, index)
  }, [lessonId, index])

  // Fullscreen overlay: lock body scroll + keyboard nav while open.
  useEffect(() => {
    if (!expanded) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
      else if (e.key === 'ArrowRight') setIndex((i) => Math.min(total - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [expanded, total])

  function prev() {
    setIndex((i) => Math.max(0, i - 1))
  }
  function next() {
    setIndex((i) => Math.min(total - 1, i + 1))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      {/* Item card */}
      <div
        className={cn(
          'rounded-2xl border bg-card px-6 py-2 shadow-sm',
          isLab && 'border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/10',
        )}
      >
        {item.type === 'SLIDE' ? (
          <SlideView item={item} onExpand={() => setExpanded(true)} />
        ) : (
          <LabView item={item} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prev}
          disabled={index === 0}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
        >
          <ChevronLeft className="size-4" /> ก่อนหน้า
        </button>

        <div className="flex items-center gap-1.5">
          {items.map((it, i) => (
            <button
              key={it.id}
              onClick={() => setIndex(i)}
              className={cn(
                'rounded-full transition-all',
                i === index
                  ? 'h-2.5 w-6 bg-primary'
                  : it.type === 'LAB'
                  ? 'h-2 w-2 bg-blue-300 hover:bg-blue-400'
                  : 'h-2 w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60',
              )}
              aria-label={`รายการ ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={index === total - 1}
          className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
        >
          ถัดไป <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Counter */}
      <p className="text-center text-xs text-muted-foreground">
        {index + 1} / {total}
        {isLab && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            💻 แล็บ
          </span>
        )}
      </p>

      {/* Fullscreen overlay — fills the device screen in both orientations (100dvh
          handles mobile browser chrome). Works on iOS where the native Fullscreen
          API is unavailable for arbitrary elements. */}
      {expanded && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-black/95" style={{ height: '100dvh' }}>
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-medium">
              {index + 1} / {total}
            </span>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="ปิดเต็มจอ"
              className="rounded-lg p-1.5 transition hover:bg-white/15"
            >
              <X className="size-6" />
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center overflow-auto p-2 sm:p-4">
            {item.type === 'SLIDE' ? (
              <div className="aspect-video max-h-full w-full max-w-[1600px] overflow-hidden rounded-lg bg-black">
                <SlideMedia item={item} />
              </div>
            ) : (
              <div className="w-full max-w-4xl">
                <LabView item={item} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <button
              type="button"
              onClick={prev}
              disabled={index === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25 disabled:opacity-40"
            >
              <ChevronLeft className="size-4" /> ก่อนหน้า
            </button>
            {item.type === 'SLIDE' && item.caption && (
              <p className="line-clamp-1 flex-1 text-center text-sm text-white/80">{item.caption}</p>
            )}
            <button
              type="button"
              onClick={next}
              disabled={index === total - 1}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25 disabled:opacity-40"
            >
              ถัดไป <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
