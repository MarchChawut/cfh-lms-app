'use client'

import { useActionState, useState } from 'react'
import type { ActionState } from '@/app/admin/actions'
import type { Course } from '@prisma/client'
import { CATEGORY_THEME } from '@/components/CourseCardFun'
import { Loader2 } from 'lucide-react'

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>

const input =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-800'
const label = 'mb-1 block text-sm font-semibold text-zinc-700 dark:text-zinc-200'

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-xs font-medium text-rose-500">{msg}</p> : null
}

function SubmitBtn({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}

function OkMsg({ show, text }: { show?: boolean; text: string }) {
  return show ? (
    <p className="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
      ✓ {text}
    </p>
  ) : null
}

// ─────────────── Course ───────────────
export function CourseForm({
  action,
  course,
  existingCategories = [],
}: {
  action: Action
  course?: Course
  existingCategories?: string[]
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)
  const fe = state?.fieldErrors ?? {}

  // Category options = known themes ∪ categories already used ∪ this course's value.
  const categoryOptions = Array.from(
    new Set([...Object.keys(CATEGORY_THEME), ...existingCategories, ...(course?.category ? [course.category] : [])]),
  )
  const [category, setCategory] = useState(course?.category ?? 'Frontend')
  const [addingCategory, setAddingCategory] = useState(false)

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      {state?.error && <p className="text-sm font-bold text-rose-500">{state.error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Slug</label>
          <input name="slug" defaultValue={course?.slug} placeholder="html-css-fundamentals" className={input} />
          <Err msg={fe.slug} />
        </div>
        <div>
          <label className={label}>หมวดหมู่</label>
          <select
            value={addingCategory ? '__new__' : category}
            onChange={(e) => {
              if (e.target.value === '__new__') {
                setAddingCategory(true)
                setCategory('')
              } else {
                setAddingCategory(false)
                setCategory(e.target.value)
              }
            }}
            className={input}
          >
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_THEME[c]?.emoji ?? '✨'} {c}
              </option>
            ))}
            <option value="__new__">➕ เพิ่มหมวดใหม่…</option>
          </select>
          {addingCategory && (
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="ชื่อหมวดใหม่ เช่น Robotics"
              autoFocus
              className={`${input} mt-2`}
            />
          )}
          {/* The actual submitted value */}
          <input type="hidden" name="category" value={category} />
          <Err msg={fe.category} />
        </div>
      </div>
      <div>
        <label className={label}>ชื่อคอร์ส</label>
        <input name="title" defaultValue={course?.title} className={input} />
        <Err msg={fe.title} />
      </div>
      <div>
        <label className={label}>คำอธิบาย</label>
        <textarea name="description" defaultValue={course?.description} rows={3} className={input} />
        <Err msg={fe.description} />
      </div>
      <div>
        <label className={label}>รูปหน้าปก (อัปโหลด .png / .jpg)</label>
        {course?.thumbnailUrl && (
          <div className="mb-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={course.thumbnailUrl} alt="ปกปัจจุบัน" className="h-16 w-28 rounded border object-cover" />
            <span className="text-xs text-muted-foreground">ปกปัจจุบัน — เลือกไฟล์ใหม่เพื่อเปลี่ยน</span>
          </div>
        )}
        <input
          name="thumbnail"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-violet-600 file:px-3 file:py-1.5 file:text-white dark:border-zinc-700 dark:bg-zinc-800"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {course ? 'ไม่เลือก = ใช้รูปเดิม' : 'แนะนำขนาด 640×360'}
        </p>
        <Err msg={fe.thumbnail} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={label}>ระยะเวลา</label>
          <input name="duration" defaultValue={course?.duration} placeholder="4:30:00" className={input} />
          <Err msg={fe.duration} />
        </div>
        <div>
          <label className={label}>ระดับ</label>
          <select name="difficulty" defaultValue={course?.difficulty ?? 'BEGINNER'} className={input}>
            <option value="BEGINNER">เริ่มต้น</option>
            <option value="INTERMEDIATE">ปานกลาง</option>
            <option value="ADVANCED">ขั้นสูง</option>
          </select>
        </div>
        <div>
          <label className={label}>ลำดับ</label>
          <input name="order" type="number" defaultValue={course?.order ?? 0} className={input} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>เวลาเรียน (เริ่ม)</label>
          <input name="defaultStartTime" type="time" defaultValue={course?.defaultStartTime ?? ''} className={input} />
        </div>
        <div>
          <label className={label}>เวลาเรียน (เลิก)</label>
          <input name="defaultEndTime" type="time" defaultValue={course?.defaultEndTime ?? ''} className={input} />
          <Err msg={fe.defaultEndTime} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="isPublished" defaultChecked={course?.isPublished ?? true} className="size-4" />
        เผยแพร่ (แสดงในหน้าคอร์ส)
      </label>
      <SubmitBtn pending={pending}>{course ? 'บันทึกการแก้ไข' : 'สร้างคอร์ส'}</SubmitBtn>
    </form>
  )
}

// ─────────────── Lesson ───────────────
export function LessonForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)
  const fe = state?.fieldErrors ?? {}
  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <OkMsg show={state?.ok} text="เพิ่มบทเรียนแล้ว" />
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_80px_80px]">
        <div>
          <label className={label}>ชื่อบทเรียน</label>
          <input name="title" placeholder="ชื่อบทเรียน" className={input} />
          <Err msg={fe.title} />
        </div>
        <div>
          <label className={label}>คำอธิบาย</label>
          <input name="description" placeholder="คำอธิบายสั้นๆ" className={input} />
          <Err msg={fe.description} />
        </div>
        <div>
          <label className={label} title="ลำดับการแสดงบทเรียนในคอร์ส (น้อย→มาก)">ลำดับ</label>
          <input name="order" type="number" placeholder="ลำดับ" defaultValue={0} className={input} />
        </div>
        <div>
          <label className={label} title="ด่าน/ระดับใน Roadmap ของคอร์ส">เลเวล (ด่าน)</label>
          <input name="level" type="number" placeholder="เลเวล" defaultValue={1} min={1} className={input} />
        </div>
      </div>
      <SubmitBtn pending={pending}>+ เพิ่มบทเรียน</SubmitBtn>
    </form>
  )
}

// ─────────────── Slide upload (หลายไฟล์) ───────────────
export function SlideUploadForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)
  const fe = state?.fieldErrors ?? {}
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <OkMsg show={state?.ok} text="อัปโหลดสไลด์แล้ว — เรียงตามชื่อไฟล์" />
      <div>
        <label className={label}>เลือกรูป PNG หลายไฟล์พร้อมกัน</label>
        <input
          name="files"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-violet-600 file:px-3 file:py-1.5 file:text-white dark:border-zinc-700 dark:bg-zinc-800"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          เลือกได้ทีละหลายไฟล์ (Canva → Download → PNG). ระบบเรียงตามชื่อไฟล์ให้ (Slide 1, 2, …)
        </p>
        <Err msg={fe.files} />
      </div>
      <SubmitBtn pending={pending}>⬆️ อัปโหลดสไลด์ทั้งหมด</SubmitBtn>
    </form>
  )
}

// ─────────────── Slide (URL เดี่ยว) ───────────────
export function SlideForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)
  const fe = state?.fieldErrors ?? {}
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <OkMsg show={state?.ok} text="เพิ่มสไลด์แล้ว" />
      <div>
        <label className={label}>ลิงก์ Canva / HTML embed code / URL รูป</label>
        <textarea
          name="imageUrl"
          rows={3}
          placeholder={'วางลิงก์ Canva หรือ HTML embed code ทั้งก้อน (Share → Embed)\nหรือ URL รูป .png'}
          className={`${input} font-mono text-xs`}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          แนะนำ: ใช้ Embed code จาก Canva และตั้ง design เป็น &quot;ใครมีลิงก์ก็ดูได้&quot;
        </p>
        <Err msg={fe.imageUrl} />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
        <input name="caption" placeholder="คำบรรยาย (ไม่บังคับ)" className={input} />
        <input name="order" type="number" placeholder="ลำดับ" defaultValue={0} className={input} />
      </div>
      <SubmitBtn pending={pending}>+ เพิ่มสไลด์รูป</SubmitBtn>
    </form>
  )
}

// ─────────────── Lab ───────────────
export function LabForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)
  const fe = state?.fieldErrors ?? {}
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <OkMsg show={state?.ok} text="เพิ่ม Lab แล้ว" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <input name="title" placeholder="ชื่อ Lab เช่น 🧪 Lab 1" className={input} />
          <Err msg={fe.title} />
        </div>
        <div>
          <input name="goal" placeholder="เป้าหมาย" className={input} />
          <Err msg={fe.goal} />
        </div>
      </div>
      <div>
        <label className={label}>ขั้นตอน (บรรทัดละ 1 ข้อ)</label>
        <textarea name="steps" rows={3} placeholder={'เปลี่ยน title\nเพิ่ม h1'} className={input} />
        <Err msg={fe.steps} />
      </div>
      <div>
        <label className={label}>{'ไฟล์เริ่มต้น (JSON: {"index.html":"<code>"})'}</label>
        <textarea name="files" rows={4} placeholder={'{"index.html":"<!DOCTYPE html>..."}'} className={`${input} font-mono text-xs`} />
        <Err msg={fe.files} />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
        <input name="openFile" placeholder="ไฟล์ที่เปิดก่อน (เช่น index.html)" className={input} />
        <input name="order" type="number" placeholder="ลำดับ" defaultValue={0} className={input} />
      </div>
      <SubmitBtn pending={pending}>+ เพิ่ม Lab</SubmitBtn>
    </form>
  )
}

// ─────────────── User ───────────────
export function UserForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)
  const fe = state?.fieldErrors ?? {}
  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <OkMsg show={state?.ok} text="เพิ่มผู้ใช้แล้ว" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <input name="name" placeholder="ชื่อ" className={input} />
          <Err msg={fe.name} />
        </div>
        <div>
          <input name="email" type="email" placeholder="email@example.com" className={input} />
          <Err msg={fe.email} />
        </div>
      </div>
      <div>
        <input name="password" type="password" placeholder="รหัสผ่าน (≥6 ตัว)" className={input} />
        <Err msg={fe.password} />
      </div>
      <SubmitBtn pending={pending}>+ เพิ่มนักเรียน</SubmitBtn>
    </form>
  )
}

// ─────────────── Payment ───────────────
export function PaymentForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)
  const fe = state?.fieldErrors ?? {}
  const thisMonth = new Date().toISOString().slice(0, 7)
  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <OkMsg show={state?.ok} text="บันทึกการจ่ายเงินแล้ว" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={label}>เดือน</label>
          <input name="period" defaultValue={thisMonth} placeholder="2026-06" className={input} />
          <Err msg={fe.period} />
        </div>
        <div>
          <label className={label}>จำนวนเงิน</label>
          <input name="amount" type="number" step="0.01" defaultValue={0} className={input} />
          <Err msg={fe.amount} />
        </div>
        <div>
          <label className={label}>สถานะ</label>
          <select name="status" defaultValue="PAID" className={input}>
            <option value="PAID">จ่ายแล้ว</option>
            <option value="UNPAID">ยังไม่จ่าย</option>
          </select>
        </div>
      </div>
      <SubmitBtn pending={pending}>บันทึก</SubmitBtn>
    </form>
  )
}

// ─────────────── Attendance ───────────────
export function GenerateMonthForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)
  const fe = state?.fieldErrors ?? {}
  const thisMonth = new Date().toISOString().slice(0, 7)
  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <OkMsg show={state?.ok} text="สร้างตารางวันเสาร์แล้ว" />
      <div className="flex flex-col gap-1">
        <label className={label}>สร้างตารางอัตโนมัติ (เสาร์ 4 ครั้งของเดือน)</label>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <input name="month" type="month" defaultValue={thisMonth} className={input} />
            <Err msg={fe.month} />
          </div>
          <SubmitBtn pending={pending}>สร้างตารางเสาร์ 4 ครั้ง</SubmitBtn>
        </div>
        <p className="text-xs text-muted-foreground">ใช้เวลาเรียนของคอร์สเป็นค่าเริ่มต้น</p>
      </div>
    </form>
  )
}

export type SessionWarning = {
  courseTitle: string
  timeLabel: string | null
  topic: string | null
  type: 'REGULAR' | 'MAKEUP'
}

export function SessionForm({
  action,
  defaultStart,
  defaultEnd,
  sessionsByDate = {},
}: {
  action: Action
  defaultStart?: string | null
  defaultEnd?: string | null
  sessionsByDate?: Record<string, SessionWarning[]>
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)
  const fe = state?.fieldErrors ?? {}
  const [date, setDate] = useState('')
  const sameDay = date ? sessionsByDate[date] ?? [] : []
  const inheritHint =
    defaultStart && defaultEnd ? `ว่าง = ใช้เวลาคอร์ส ${defaultStart}-${defaultEnd}` : 'ว่าง = ใช้เวลาคอร์ส'
  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <OkMsg show={state?.ok} text="เพิ่มคาบเรียนแล้ว" />
      <label className={label}>เพิ่มคาบเรียนเอง (เช่น วันอาทิตย์ชดเชย)</label>
      <div className="grid gap-3 sm:grid-cols-[150px_120px_1fr]">
        <div>
          <input
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={input}
          />
          <Err msg={fe.date} />
        </div>
        <div>
          <select name="type" defaultValue="REGULAR" className={input}>
            <option value="REGULAR">เสาร์ (ปกติ)</option>
            <option value="MAKEUP">ชดเชย</option>
          </select>
        </div>
        <div>
          <input name="topic" placeholder="หัวข้อ (ไม่บังคับ)" className={input} />
          <Err msg={fe.topic} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[150px_120px_1fr] sm:items-end">
        <div>
          <input name="startTime" type="time" className={input} />
        </div>
        <div>
          <input name="endTime" type="time" className={input} />
          <Err msg={fe.endTime} />
        </div>
        <p className="text-xs text-muted-foreground sm:pb-2">{inheritHint}</p>
      </div>
      {sameDay.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-bold">⚠️ วันนี้มีคาบเรียนลงไว้แล้ว {sameDay.length} คาบ — เพิ่มได้ แต่ดูเวลาให้ไม่ชนกัน</p>
          <ul className="mt-1 space-y-0.5">
            {sameDay.map((s, i) => (
              <li key={i}>
                • {s.courseTitle}
                {s.timeLabel ? ` · ${s.timeLabel}` : ''}
                {s.type === 'MAKEUP' ? ' · (ชดเชย)' : ''}
                {s.topic ? ` · ${s.topic}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      <SubmitBtn pending={pending}>เพิ่มคาบเรียน</SubmitBtn>
    </form>
  )
}
