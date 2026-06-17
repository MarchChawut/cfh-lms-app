import prisma from './prisma'

export async function getCourses() {
  return prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { order: 'asc' },
  })
}

export async function getCourse(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
  })
}

/** Course + its lessons (with item counts) for the course detail page. */
export async function getCourseWithLessons(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        include: { _count: { select: { items: true } } },
      },
    },
  })
}

/** A lesson with its ordered items (slides + labs) + parent course. */
export async function getLessonWithItems(lessonId: number) {
  return prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: true,
      items: { orderBy: { order: 'asc' } },
    },
  })
}

export async function isEnrolled(userId: number, courseId: number): Promise<boolean> {
  const e = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  })
  return e !== null
}

export async function getProgress(userId: number, lessonId: number) {
  return prisma.progress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  })
}

export type CourseAccess = 'ok' | 'enroll'

/**
 * Whether a logged-in user can view a course's content.
 * Access is granted purely by the admin via enrollment — no payment gate.
 * - ADMIN → always 'ok' (preview)
 * - enrolled → 'ok'
 * - not enrolled → 'enroll'
 */
/** Per-lesson progress for a user within a course. Returns Map<lessonId, progress>. */
export async function getCourseLessonProgress(userId: number, courseId: number) {
  const rows = await prisma.progress.findMany({
    where: { userId, lesson: { courseId } },
  })
  return new Map(rows.map((r) => [r.lessonId, r]))
}

export async function courseAccess(
  userId: number,
  role: 'STUDENT' | 'ADMIN',
  courseId: number,
): Promise<CourseAccess> {
  if (role === 'ADMIN') return 'ok'
  if (!(await isEnrolled(userId, courseId))) return 'enroll'
  return 'ok'
}
