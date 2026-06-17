'use client'

import { useEffect, useRef } from 'react'
import { refreshSession, expireSession } from '@/app/actions/auth'

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
] as const

interface IdleTimeoutProps {
  /** Only arm the timer for logged-in users (avoids redirect loops on /login). */
  enabled: boolean
  /** Idle window in seconds — must match the server session lifetime. */
  idleSeconds: number
}

/**
 * Logs the user out after `idleSeconds` of inactivity:
 * - Idle check: if no activity for the full window → clear cookie + go to /login.
 * - Heartbeat: while active, periodically re-issue the server cookie so an active
 *   session never expires mid-use (the server cookie only slides on requests).
 * - Refresh once on mount so every full page load counts as activity.
 */
export function IdleTimeout({ enabled, idleSeconds }: IdleTimeoutProps) {
  useEffect(() => {
    if (!enabled) return

    const idleMs = idleSeconds * 1000
    const refreshAfterMs = idleMs / 2 // slide well before expiry
    const checkEveryMs = Math.min(15_000, Math.max(2_000, refreshAfterMs / 4))

    let lastActivity = Date.now()
    let lastRefresh = Date.now()
    let refreshing = false
    let stopped = false

    const markActivity = () => {
      lastActivity = Date.now()
    }

    const doRefresh = async () => {
      if (refreshing) return
      refreshing = true
      try {
        await refreshSession()
        lastRefresh = Date.now()
      } catch {
        // network blip — try again next tick
      } finally {
        refreshing = false
      }
    }

    // A full page load is itself activity: slide the cookie immediately.
    void doRefresh()

    const interval = setInterval(() => {
      if (stopped) return
      const now = Date.now()

      if (now - lastActivity >= idleMs) {
        stopped = true
        clearInterval(interval)
        void expireSession().finally(() => {
          window.location.href = '/login'
        })
        return
      }

      if (now - lastRefresh >= refreshAfterMs) void doRefresh()
    }, checkEveryMs)

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, markActivity, { passive: true })
    }

    return () => {
      stopped = true
      clearInterval(interval)
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, markActivity)
      }
    }
  }, [enabled, idleSeconds])

  return null
}
