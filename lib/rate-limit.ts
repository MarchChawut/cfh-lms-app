import 'server-only'

/**
 * Minimal in-memory fixed-window rate limiter. Adequate for a single-instance
 * deployment (no Redis). Keys are arbitrary strings (e.g. `login-ip:1.2.3.4`).
 *
 * Usage: check() before the protected work; fail() on each failure; reset() on
 * success. A window opens on the first recorded failure and lasts `windowSec`.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number }

/** Drop expired buckets so the Map can't grow without bound. */
function prune(now: number): void {
  if (buckets.size < 5000) return
  for (const [key, b] of buckets) if (now >= b.resetAt) buckets.delete(key)
}

/** True (ok) unless the key has already hit `limit` failures in the open window. */
export function checkRateLimit(key: string, limit: number, windowSec: number): RateLimitResult {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || now >= b.resetAt) return { ok: true }
  if (b.count >= limit) return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) }
  return { ok: true }
}

/** Record one failure against the key, opening the window if needed. */
export function recordFailure(key: string, windowSec: number): void {
  const now = Date.now()
  prune(now)
  const b = buckets.get(key)
  if (!b || now >= b.resetAt) buckets.set(key, { count: 1, resetAt: now + windowSec * 1000 })
  else b.count++
}

/** Clear the key (call after a successful attempt). */
export function resetRateLimit(key: string): void {
  buckets.delete(key)
}
