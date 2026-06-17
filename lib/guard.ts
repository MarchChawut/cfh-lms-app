import 'server-only'
import { redirect } from 'next/navigation'
import prisma from './prisma'
import { getSession } from './session'
import type { User } from '@prisma/client'

/** Returns the fresh DB user for the current session, or null. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  if (!session) return null
  return prisma.user.findUnique({ where: { id: session.userId } })
}

/** Redirects to /login unless logged in. Returns the user. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Redirects to /login unless logged in AND the single configured admin.
 * Defence-in-depth: requires role === ADMIN *and* email === ADMIN_EMAIL, so
 * only chawut.sa@gmail.com can manage the system even if a stray ADMIN row exists.
 * Stored emails are lowercased, so compare against the lowercased ADMIN_EMAIL.
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
  if (user.role !== 'ADMIN' || user.email !== adminEmail) redirect('/')
  return user
}
