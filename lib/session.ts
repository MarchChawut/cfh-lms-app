import 'server-only'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'cfh_session'
const secretKey = process.env.SESSION_SECRET
// Fail loudly instead of silently signing with an empty/weak key (forgeable tokens).
if (!secretKey) {
  throw new Error('SESSION_SECRET is not set — refuse to start without a session signing key')
}
const encodedKey = new TextEncoder().encode(secretKey)

/**
 * Idle timeout: the session expires after this many seconds of inactivity.
 * It's a *sliding* window — every refresh (login or heartbeat) issues a fresh
 * token + cookie with this lifetime, so an active user never gets logged out
 * while an idle one does. Override via SESSION_IDLE_MINUTES (default 10 min).
 */
export const IDLE_TIMEOUT_SECONDS =
  (Number(process.env.SESSION_IDLE_MINUTES) || 10) * 60

export type SessionPayload = {
  userId: number
  name: string
  role: 'STUDENT' | 'ADMIN'
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${IDLE_TIMEOUT_SECONDS}s`)
    .sign(encodedKey)
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    })
    if (
      typeof payload.userId === 'number' &&
      typeof payload.name === 'string' &&
      (payload.role === 'STUDENT' || payload.role === 'ADMIN')
    ) {
      return { userId: payload.userId, name: payload.name, role: payload.role }
    }
    return null
  } catch {
    return null
  }
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await encrypt(payload)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: IDLE_TIMEOUT_SECONDS,
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  return decrypt(cookieStore.get(COOKIE_NAME)?.value)
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
