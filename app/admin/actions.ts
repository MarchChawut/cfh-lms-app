'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/guard'
import { extractEmbedSrc, toCanvaEmbedSrc } from '@/lib/canva'

export type ActionState = {
  error?: string
  fieldErrors?: Record<string, string>
  ok?: boolean
} | null

function feOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const i of error.issues) {
    const k = String(i.path[0] ?? '')
    if (k && !out[k]) out[k] = i.message
  }
  return out
}

const IMAGE_RE = /\.(png|jpe?g|webp|gif)$/i

/** Write an uploaded image to public/uploads/<subdir>/ and return its public URL path. */
async function saveImageFile(file: File, subdir: string): Promise<string> {
  const { writeFile, mkdir } = await import('node:fs/promises')
  const { join } = await import('node:path')
  const { randomUUID } = await import('node:crypto')
  const dir = join(process.cwd(), 'public', 'uploads', subdir)
  await mkdir(dir, { recursive: true })
  const ext = (file.name.match(IMAGE_RE)?.[1] ?? 'png').toLowerCase()
  const name = `${randomUUID()}.${ext}`
  await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()))
  return `/uploads/${subdir}/${name}`
}

function isImageFile(v: FormDataEntryValue | null): v is File {
  return v instanceof File && v.size > 0 && (v.type.startsWith('image/') || IMAGE_RE.test(v.name))
}

// ─────────────────────────── Courses ───────────────────────────

/** Optional HH:MM time field: empty → null, otherwise validated 24h time. */
const optionalTime = z.preprocess(
  (v) => (v === '' || v == null ? null : v),
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'รูปแบบเวลาต้องเป็น HH:MM').nullable(),
)

const courseSchema = z
  .object({
    slug: z.string().trim().min(1, 'ต้องมี slug').regex(/^[a-z0-9-]+$/, 'slug ใช้ a-z, 0-9, - เท่านั้น'),
    title: z.string().trim().min(1, 'ต้องมีชื่อคอร์ส'),
    description: z.string().trim().min(1, 'ต้องมีคำอธิบาย'),
    duration: z.string().trim().min(1, 'ต้องมีระยะเวลา'),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    category: z.string().trim().min(1, 'ต้องมีหมวดหมู่'),
    order: z.coerce.number().int().min(0),
    isPublished: z.coerce.boolean(),
    defaultStartTime: optionalTime,
    defaultEndTime: optionalTime,
  })
  .refine((d) => !d.defaultStartTime || !d.defaultEndTime || d.defaultEndTime > d.defaultStartTime, {
    message: 'เวลาเลิกต้องมากกว่าเวลาเริ่ม',
    path: ['defaultEndTime'],
  })

function parseCourse(formData: FormData) {
  return courseSchema.safeParse({
    slug: formData.get('slug'),
    title: formData.get('title'),
    description: formData.get('description'),
    duration: formData.get('duration'),
    difficulty: formData.get('difficulty'),
    category: formData.get('category'),
    order: formData.get('order') || 0,
    isPublished: formData.get('isPublished') === 'on',
    defaultStartTime: formData.get('defaultStartTime'),
    defaultEndTime: formData.get('defaultEndTime'),
  })
}

export async function createCourse(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const parsed = parseCourse(formData)
  if (!parsed.success) return { fieldErrors: feOf(parsed.error) }
  const exists = await prisma.course.findUnique({ where: { slug: parsed.data.slug } })
  if (exists) return { fieldErrors: { slug: 'slug นี้ถูกใช้แล้ว' } }

  const file = formData.get('thumbnail')
  if (!isImageFile(file)) return { fieldErrors: { thumbnail: 'กรุณาอัปโหลดรูปหน้าปก (PNG/JPG)' } }
  const thumbnailUrl = await saveImageFile(file, 'thumbnails')

  await prisma.course.create({ data: { ...parsed.data, thumbnailUrl } })
  revalidatePath('/admin/courses')
  redirect('/admin/courses')
}

export async function updateCourse(id: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const parsed = parseCourse(formData)
  if (!parsed.success) return { fieldErrors: feOf(parsed.error) }
  const clash = await prisma.course.findFirst({
    where: { slug: parsed.data.slug, NOT: { id } },
  })
  if (clash) return { fieldErrors: { slug: 'slug นี้ถูกใช้แล้ว' } }

  // Keep existing thumbnail unless a new file is uploaded
  const file = formData.get('thumbnail')
  const data: typeof parsed.data & { thumbnailUrl?: string } = { ...parsed.data }
  if (isImageFile(file)) {
    data.thumbnailUrl = await saveImageFile(file, 'thumbnails')
  }

  await prisma.course.update({ where: { id }, data })
  revalidatePath('/admin/courses')
  redirect('/admin/courses')
}

export async function deleteCourse(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = Number(formData.get('id'))
  await prisma.course.delete({ where: { id } })
  revalidatePath('/admin/courses')
}

// ─────────────────────────── Lessons ───────────────────────────

const lessonSchema = z.object({
  title: z.string().trim().min(1, 'ต้องมีชื่อบทเรียน'),
  description: z.string().trim().min(1, 'ต้องมีคำอธิบาย'),
  order: z.coerce.number().int().min(0),
  level: z.coerce.number().int().min(1).default(1),
})

export async function createLesson(courseId: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const parsed = lessonSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    order: formData.get('order') || 0,
    level: formData.get('level') || 1,
  })
  if (!parsed.success) return { fieldErrors: feOf(parsed.error) }
  await prisma.lesson.create({ data: { ...parsed.data, courseId } })
  revalidatePath(`/admin/courses/${courseId}/lessons`)
  return { ok: true }
}

export async function updateLesson(id: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const parsed = lessonSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    order: formData.get('order') || 0,
    level: formData.get('level') || 1,
  })
  if (!parsed.success) return { fieldErrors: feOf(parsed.error) }
  const lesson = await prisma.lesson.update({ where: { id }, data: parsed.data })
  revalidatePath(`/admin/courses/${lesson.courseId}/lessons`)
  return { ok: true }
}

export async function deleteLesson(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = Number(formData.get('id'))
  const lesson = await prisma.lesson.delete({ where: { id } })
  revalidatePath(`/admin/courses/${lesson.courseId}/lessons`)
}

// ─────────────────────────── Lesson items (slide / lab) ───────────────────────────

export async function createSlide(lessonId: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const raw = String(formData.get('imageUrl') ?? '')
  let url = extractEmbedSrc(raw)
  if (!url) return { fieldErrors: { imageUrl: 'ต้องวางลิงก์ Canva / embed code / URL รูป' } }

  // best-effort: resolve canva.link short links to the real design URL
  try {
    if (/(^|\.)canva\.link$/i.test(new URL(url).hostname)) {
      const res = await fetch(url, { redirect: 'follow' })
      if (res.url) url = res.url
    }
  } catch {
    // keep url as-is
  }
  url = toCanvaEmbedSrc(url)

  const order = Number(formData.get('order') || 0)
  await prisma.lessonItem.create({
    data: { lessonId, type: 'SLIDE', imageUrl: url, caption: String(formData.get('caption') ?? '').trim() || null, order },
  })
  revalidatePath(`/admin/lessons/${lessonId}`)
  return { ok: true }
}

const labSchema = z.object({
  title: z.string().trim().min(1, 'ต้องมีชื่อ Lab'),
  goal: z.string().trim().min(1, 'ต้องมีเป้าหมาย'),
  steps: z.string().trim().min(1, 'ต้องมีขั้นตอน'),
  files: z.string().trim().min(1, 'ต้องมีไฟล์เริ่มต้น'),
  openFile: z.string().trim().optional(),
  order: z.coerce.number().int().min(0),
})

/** steps = บรรทัดละขั้น; files = JSON object { "index.html": "..." } */
export async function createLab(lessonId: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const parsed = labSchema.safeParse({
    title: formData.get('title'),
    goal: formData.get('goal'),
    steps: formData.get('steps'),
    files: formData.get('files'),
    openFile: formData.get('openFile') || undefined,
    order: formData.get('order') || 0,
  })
  if (!parsed.success) return { fieldErrors: feOf(parsed.error) }

  let files: Record<string, string>
  try {
    files = JSON.parse(parsed.data.files)
    if (typeof files !== 'object' || files === null || Array.isArray(files)) throw new Error()
  } catch {
    return { fieldErrors: { files: 'files ต้องเป็น JSON object เช่น {"index.html":"..."}' } }
  }
  const steps = parsed.data.steps.split('\n').map((s) => s.trim()).filter(Boolean)

  await prisma.lessonItem.create({
    data: {
      lessonId,
      type: 'LAB',
      title: parsed.data.title,
      goal: parsed.data.goal,
      steps,
      files,
      openFile: parsed.data.openFile || Object.keys(files)[0],
      order: parsed.data.order,
    },
  })
  revalidatePath(`/admin/lessons/${lessonId}`)
  return { ok: true }
}

export async function deleteItem(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = Number(formData.get('id'))
  const item = await prisma.lessonItem.delete({ where: { id } })
  revalidatePath(`/admin/lessons/${item.lessonId}`)
}

/** Swap an item's order with its neighbour (up/down) for easy reordering. */
export async function moveItem(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = Number(formData.get('id'))
  const dir = String(formData.get('dir')) // 'up' | 'down'
  const item = await prisma.lessonItem.findUnique({ where: { id } })
  if (!item) return
  const neighbour = await prisma.lessonItem.findFirst({
    where: {
      lessonId: item.lessonId,
      order: dir === 'up' ? { lt: item.order } : { gt: item.order },
    },
    orderBy: { order: dir === 'up' ? 'desc' : 'asc' },
  })
  if (!neighbour) return
  await prisma.$transaction([
    prisma.lessonItem.update({ where: { id: item.id }, data: { order: neighbour.order } }),
    prisma.lessonItem.update({ where: { id: neighbour.id }, data: { order: item.order } }),
  ])
  revalidatePath(`/admin/lessons/${item.lessonId}`)
}

/** Upload many PNG/image files at once → create SLIDE items in natural filename order. */
export async function uploadSlides(lessonId: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const files = formData
    .getAll('files')
    .filter(isImageFile)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

  if (files.length === 0) return { fieldErrors: { files: 'กรุณาเลือกไฟล์รูป (PNG/JPG)' } }

  const agg = await prisma.lessonItem.aggregate({ where: { lessonId }, _max: { order: true } })
  let order = (agg._max.order ?? 0) + 1

  const data: { lessonId: number; type: 'SLIDE'; imageUrl: string; order: number }[] = []
  for (const file of files) {
    const imageUrl = await saveImageFile(file, `slides/${lessonId}`)
    data.push({ lessonId, type: 'SLIDE', imageUrl, order: order++ })
  }
  await prisma.lessonItem.createMany({ data })

  revalidatePath(`/admin/lessons/${lessonId}`)
  return { ok: true }
}

// ─────────────────────────── Users / students ───────────────────────────

// Students are always created as STUDENT — the single ADMIN is bootstrapped via seed only.
const userSchema = z.object({
  name: z.string().trim().min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
  email: z.string().trim().toLowerCase().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านอย่างน้อย 6 ตัวอักษร'),
})

export async function createUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const parsed = userSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { fieldErrors: feOf(parsed.error) }
  if (parsed.data.email === process.env.ADMIN_EMAIL?.toLowerCase()) {
    return { fieldErrors: { email: 'อีเมลนี้สงวนไว้สำหรับแอดมิน' } }
  }
  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (exists) return { fieldErrors: { email: 'อีเมลนี้ถูกใช้แล้ว' } }
  const hashed = await bcrypt.hash(parsed.data.password, 10)
  await prisma.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, password: hashed, role: 'STUDENT' },
  })
  revalidatePath('/admin/students')
  return { ok: true }
}

export async function deleteUser(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = Number(formData.get('id'))
  const target = await prisma.user.findUnique({ where: { id } })
  // Never allow deleting the single admin account.
  if (!target || target.email === process.env.ADMIN_EMAIL?.toLowerCase()) return
  await prisma.user.delete({ where: { id } })
  revalidatePath('/admin/students')
}

// ─────────────────────────── Enrollment (สิทธิ์เรียน) ───────────────────────────

export async function toggleEnrollment(formData: FormData): Promise<void> {
  await requireAdmin()
  const userId = Number(formData.get('userId'))
  const courseId = Number(formData.get('courseId'))
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  })
  if (existing) {
    await prisma.enrollment.delete({ where: { id: existing.id } })
  } else {
    await prisma.enrollment.create({ data: { userId, courseId } })
  }
  revalidatePath(`/admin/students/${userId}`)
}

// ─────────────────────────── Payment ───────────────────────────

const paymentSchema = z.object({
  period: z.string().trim().regex(/^\d{4}-\d{2}$/, 'รูปแบบเดือนต้องเป็น YYYY-MM'),
  amount: z.coerce.number().min(0, 'จำนวนเงินต้องไม่ติดลบ'),
  status: z.enum(['PAID', 'UNPAID']),
})

export async function upsertPayment(userId: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const parsed = paymentSchema.safeParse({
    period: formData.get('period'),
    amount: formData.get('amount') || 0,
    status: formData.get('status') || 'UNPAID',
  })
  if (!parsed.success) return { fieldErrors: feOf(parsed.error) }
  const { period, amount, status } = parsed.data
  const paidAt = status === 'PAID' ? new Date() : null
  await prisma.payment.upsert({
    where: { userId_period: { userId, period } },
    create: { userId, period, amount, status, paidAt },
    update: { amount, status, paidAt },
  })
  revalidatePath(`/admin/students/${userId}`)
  return { ok: true }
}

// ─────────────────────────── Attendance (เช็คชื่อ) ───────────────────────────

const sessionSchema = z
  .object({
    date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ต้องเป็น YYYY-MM-DD'),
    type: z.enum(['REGULAR', 'MAKEUP']),
    startTime: optionalTime,
    endTime: optionalTime,
    topic: z.string().trim().max(200).optional(),
  })
  .refine((d) => !d.startTime || !d.endTime || d.endTime > d.startTime, {
    message: 'เวลาเลิกต้องมากกว่าเวลาเริ่ม',
    path: ['endTime'],
  })

/** Parse a YYYY-MM-DD string into a UTC-midnight Date, to match the @db.Date column. */
function toUtcDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`)
}

export async function createSession(courseId: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const parsed = sessionSchema.safeParse({
    date: formData.get('date'),
    type: formData.get('type') || 'REGULAR',
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    topic: formData.get('topic') || undefined,
  })
  if (!parsed.success) return { fieldErrors: feOf(parsed.error) }
  const { date, type, startTime, endTime, topic } = parsed.data
  // ไม่บล็อกวันซ้ำ — อนุญาตหลายคาบต่อวัน (คนละเวลา). คำเตือนคาบที่ลงไว้แล้วแสดงฝั่ง UI ตอนเลือกวันที่
  await prisma.classSession.create({
    data: { courseId, date: toUtcDate(date), type, startTime, endTime, topic: topic || null },
  })
  revalidatePath(`/admin/attendance/${courseId}`)
  return { ok: true }
}

export async function generateMonthSessions(courseId: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const month = String(formData.get('month') || '')
  if (!/^\d{4}-\d{2}$/.test(month)) return { fieldErrors: { month: 'รูปแบบเดือนต้องเป็น YYYY-MM' } }
  const [y, m] = month.split('-').map(Number)
  // First 4 Saturdays of the month — computed entirely in UTC to match @db.Date.
  const saturdays: Date[] = []
  for (let d = 1; d <= 31 && saturdays.length < 4; d++) {
    const dt = new Date(Date.UTC(y, m - 1, d))
    if (dt.getUTCMonth() !== m - 1) break // rolled into next month
    if (dt.getUTCDay() === 6) saturdays.push(dt)
  }
  if (saturdays.length === 0) return { fieldErrors: { month: 'หาวันเสาร์ในเดือนนี้ไม่เจอ' } }
  // ไม่มี unique (courseId, date) แล้ว — กรองวันที่มีคาบอยู่แล้วออกเอง กันสร้างเสาร์ซ้ำเมื่อกดซ้ำ
  const existing = await prisma.classSession.findMany({
    where: { courseId, date: { in: saturdays } },
    select: { date: true },
  })
  const have = new Set(existing.map((e) => e.date.toISOString().slice(0, 10)))
  const toCreate = saturdays.filter((d) => !have.has(d.toISOString().slice(0, 10)))
  if (toCreate.length === 0) return { ok: true }
  await prisma.classSession.createMany({
    data: toCreate.map((date) => ({ courseId, date, type: 'REGULAR' as const })),
  })
  revalidatePath(`/admin/attendance/${courseId}`)
  return { ok: true }
}

export async function deleteSession(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = Number(formData.get('id'))
  const session = await prisma.classSession.findUnique({ where: { id } })
  if (!session) return
  await prisma.classSession.delete({ where: { id } }) // cascade removes attendances
  revalidatePath(`/admin/attendance/${session.courseId}`)
}

export async function toggleAttendance(formData: FormData): Promise<void> {
  await requireAdmin()
  const sessionId = Number(formData.get('sessionId'))
  const userId = Number(formData.get('userId'))
  const courseId = Number(formData.get('courseId'))
  const existing = await prisma.attendance.findUnique({
    where: { sessionId_userId: { sessionId, userId } },
  })
  if (existing) {
    await prisma.attendance.delete({ where: { id: existing.id } })
  } else {
    await prisma.attendance.create({ data: { sessionId, userId } })
  }
  revalidatePath(`/admin/attendance/${courseId}/${sessionId}`)
}

export async function markAllPresent(formData: FormData): Promise<void> {
  await requireAdmin()
  const sessionId = Number(formData.get('sessionId'))
  const courseId = Number(formData.get('courseId'))
  const students = await prisma.user.findMany({ where: { role: 'STUDENT' }, select: { id: true } })
  await prisma.attendance.createMany({
    data: students.map((s) => ({ sessionId, userId: s.id })),
    skipDuplicates: true,
  })
  revalidatePath(`/admin/attendance/${courseId}/${sessionId}`)
}
