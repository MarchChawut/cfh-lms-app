'use server'

import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/guard'

/** Save how far a student has reached in a lesson. Silently no-ops if not logged in. */
export async function saveProgress(lessonId: number, itemIndex: number): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return

  const count = await prisma.lessonItem.count({ where: { lessonId } })
  const completed = count > 0 && itemIndex >= count - 1

  await prisma.progress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, lastItem: itemIndex, completed },
    update: { lastItem: itemIndex, completed },
  })
}
