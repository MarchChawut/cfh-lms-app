# CFH LMS — Code & Fun House

ระบบ LMS สำหรับสอนเขียนโค้ด: คอร์ส/บทเรียนแบบสไลด์ (Canva) + แล็บเขียนโค้ดสด (StackBlitz), ระบบแอดมินจัดการคอร์ส/นักเรียน/การเข้าเรียน/การชำระเงิน และระบบ login แบบ session เอง

## Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) · React 19 |
| Styling | Tailwind CSS v4 · shadcn/ui (`@base-ui`) |
| Database | MariaDB ผ่าน Prisma v7 + `@prisma/adapter-mariadb` |
| Auth | jose (JWT session) + bcryptjs — ไม่ใช้ NextAuth |
| Labs / Slides | `@stackblitz/sdk` · Canva embed |
| Package manager | pnpm |

## Prerequisites

- Node.js 20+
- pnpm
- MariaDB/MySQL ที่เข้าถึงได้ (เช่น บน Synology) — เก็บ `DATABASE_URL` ไว้

## Environment Variables

สร้างไฟล์ `.env` ที่ root (ไม่ถูก commit ขึ้น git):

```env
# การเชื่อมต่อฐานข้อมูล MariaDB/MySQL
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DBNAME"

# คีย์เซ็น JWT session — ต้องตั้งเสมอ (แอปจะไม่ start ถ้าไม่มี)
# สร้างใหม่: openssl rand -base64 32
SESSION_SECRET="<random-32-byte-base64>"

# บัญชีแอดมินเดี่ยว (ใช้ตอน seed และ guard)
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD="<รหัสผ่านที่แข็งแรง>"

# (ไม่บังคับ) นาที idle ก่อน logout อัตโนมัติ — ดีฟอลต์ 10
SESSION_IDLE_MINUTES="10"
```

> ⚠️ **ก่อนขึ้น production**: ตั้ง `SESSION_SECRET` และ `ADMIN_PASSWORD` ใหม่ที่แข็งแรง อย่าใช้ค่าตัวอย่าง และรันหลัง HTTPS

## Setup

```bash
# 1) ติดตั้ง dependencies
pnpm install

# 2) สร้าง/อัปเดตตารางในฐานข้อมูล จาก migrations
pnpm prisma migrate deploy        # สำหรับ DB ที่มีอยู่แล้ว / production
# หรือระหว่างพัฒนา:
pnpm prisma migrate dev

# 3) สร้างบัญชีแอดมินเริ่มต้น (อ่าน ADMIN_EMAIL / ADMIN_PASSWORD จาก .env)
pnpm prisma db seed

# 4) รัน dev server
pnpm dev
```

เปิด http://localhost:3000 — เข้าระบบที่ `/login` ด้วยบัญชีแอดมินที่ seed ไว้ แล้วจัดการได้ที่ `/admin`

## Scripts

| คำสั่ง | หน้าที่ |
|---|---|
| `pnpm dev` | รัน development server |
| `pnpm build` | สร้าง production build |
| `pnpm start` | รัน production server (ต้อง build ก่อน) |
| `pnpm lint` | ตรวจ ESLint |
| `pnpm prisma migrate dev` | สร้าง/รัน migration ระหว่างพัฒนา |
| `pnpm prisma db seed` | seed บัญชีแอดมิน |

## โครงสร้างโปรเจกต์

```
app/
  page.tsx                       # หน้าแรก + แคตตาล็อกคอร์ส
  login/                         # หน้าเข้าสู่ระบบ
  courses/[slug]/                # หน้าคอร์ส + ตัวเล่นบทเรียน (สไลด์/แล็บ)
  admin/                         # แดชบอร์ดแอดมิน (คอร์ส/นักเรียน/เช็คชื่อ)
  actions/                       # server actions (auth, progress)
  admin/actions.ts               # server actions ฝั่งแอดมิน
components/                      # UI (SlideViewer, StackBlitzEmbed, forms, ui/)
lib/
  prisma.ts  session.ts  guard.ts  rate-limit.ts  canva.ts  data.ts
prisma/
  schema.prisma  migrations/  seed.ts
```

## หมายเหตุด้านความปลอดภัย

- ทุก action ฝั่งแอดมินผ่าน `requireAdmin()` (ตรวจทั้ง role และอีเมลตรงกับ `ADMIN_EMAIL`)
- Login มี rate limiting กัน brute-force; cookie เป็น httpOnly + secure (prod) + sameSite lax
- ตั้ง security headers (CSP, X-Frame-Options, nosniff, Referrer-Policy, HSTS) ที่ `next.config.ts`
- ไฟล์อัปโหลดใน `public/uploads/` เป็น runtime data — ไม่ถูก commit ขึ้น git
