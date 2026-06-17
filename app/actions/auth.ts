'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { createSession, deleteSession, getSession } from '@/lib/session'
import { checkRateLimit, recordFailure, resetRateLimit } from '@/lib/rate-limit'

export type AuthState = {
  error?: string
  fieldErrors?: Record<string, string>
} | null

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
})

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '')
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}

// Brute-force throttle: a failed login opens a 15-min window.
// - per-account (email only) is the primary guard against targeted password
//   guessing; it's independent of the client-spoofable X-Forwarded-For.
// - per-IP is a best-effort backstop against spraying many accounts from one host.
// Tradeoff: a per-account cap allows a determined attacker to delay an account's
// logins (temporary, not a permanent lockout). Acceptable for a single-admin app;
// revisit with CAPTCHA/backoff if abuse appears.
const RL_WINDOW_SEC = 15 * 60
const RL_PER_IP = 30
const RL_PER_ACCOUNT = 10

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const hdrs = await headers()
  const ip =
    (hdrs.get('x-forwarded-for')?.split(',')[0] ?? hdrs.get('x-real-ip') ?? '').trim() || 'unknown'

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error) }
  }

  const { email, password } = parsed.data

  // Throttle before doing any (expensive) password work.
  const ipKey = `login-ip:${ip}`
  const acctKey = `login-acct:${email}`
  for (const [key, limit] of [
    [ipKey, RL_PER_IP],
    [acctKey, RL_PER_ACCOUNT],
  ] as const) {
    const r = checkRateLimit(key, limit, RL_WINDOW_SEC)
    if (!r.ok) {
      return { error: `พยายามเข้าสู่ระบบบ่อยเกินไป กรุณาลองใหม่ใน ${Math.ceil(r.retryAfterSec / 60)} นาที` }
    }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.password))) {
    recordFailure(ipKey, RL_WINDOW_SEC)
    recordFailure(acctKey, RL_WINDOW_SEC)
    return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
  }

  resetRateLimit(ipKey)
  resetRateLimit(acctKey)
  await createSession({ userId: user.id, name: user.name, role: user.role })
  redirect('/')
}

export async function logout(): Promise<void> {
  await deleteSession()
  redirect('/')
}

/**
 * Slides the idle window: re-issues a fresh token + cookie if the session is
 * still valid. Called periodically by the client IdleTimeout while the user is
 * active so an active session never expires mid-use. No-op if already expired.
 */
export async function refreshSession(): Promise<void> {
  const session = await getSession()
  if (session) await createSession(session)
}

/** Clears the session cookie (called by IdleTimeout before redirecting to /login). */
export async function expireSession(): Promise<void> {
  await deleteSession()
}
