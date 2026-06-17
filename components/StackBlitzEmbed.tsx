'use client'

import { useEffect, useRef, useState } from 'react'
import type { LabData } from '@/lib/lesson-types'

type Props = {
  slide: LabData
}

export function StackBlitzEmbed({ slide }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  useEffect(() => {
    const wrapper = containerRef.current
    if (!wrapper) return
    setStatus('loading')

    let cancelled = false

    // StackBlitz calls target.replaceWith(iframe), so never hand it a
    // React-managed node. Embed into a throwaway child of the stable
    // wrapper that React does not reconcile.
    const target = document.createElement('div')
    target.className = 'w-full'
    wrapper.appendChild(target)

    async function load() {
      try {
        const sdk = (await import('@stackblitz/sdk')).default
        if (cancelled) return

        await sdk.embedProject(
          target,
          {
            title: slide.title,
            description: slide.goal,
            template: 'html',
            files: slide.files,
          },
          {
            height: 520,
            hideNavigation: true,
            hideExplorer: false,
            view: 'default',
            theme: 'light',
            openFile: slide.openFile,
          },
        )

        if (!cancelled) setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    load()

    return () => {
      cancelled = true
      // Remove whatever StackBlitz left behind (the replaced iframe) so the
      // next slide gets a fresh embed and React's wrapper stays empty.
      wrapper.replaceChildren()
    }
  }, [slide])

  return (
    <div className="overflow-hidden rounded-xl border shadow-sm">
      {/* Lab header */}
      <div className="flex items-center gap-2 border-b bg-blue-50 px-4 py-2.5 dark:bg-blue-950/40">
        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
          💻 แล็บ
        </span>
        <span className="text-sm text-blue-600 dark:text-blue-400">{slide.goal}</span>
      </div>

      {/* Steps */}
      <div className="border-b bg-muted/30 px-4 py-3">
        <p className="mb-1.5 text-xs font-semibold text-muted-foreground">ขั้นตอน:</p>
        <ol className="flex flex-col gap-1">
          {slide.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* StackBlitz embed */}
      <div className="relative min-h-[520px] bg-muted/20">
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500" />
            <p className="text-sm text-muted-foreground">กำลังโหลด Code Editor...</p>
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-2xl">😢</p>
            <p className="font-medium">โหลด Lab ไม่สำเร็จ</p>
            <p className="text-sm text-muted-foreground">ลอง refresh หน้านี้ใหม่</p>
          </div>
        )}
        <div ref={containerRef} className="w-full" />
      </div>
    </div>
  )
}
