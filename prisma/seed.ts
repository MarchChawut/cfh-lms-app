import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient, Difficulty } from '@prisma/client'
import bcrypt from 'bcryptjs'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

/**
 * Bootstrap the single admin account. This is the ONLY way the admin exists
 * (self-registration is disabled), so it must be idempotent and independent of
 * the course seeding below — re-running must never wipe data nor duplicate the admin.
 */
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL และ ADMIN_PASSWORD ต้องตั้งใน .env ก่อน seed')
  }
  const hashed = await bcrypt.hash(password, 10)
  // Ensure the admin role on every run, but DON'T clobber an existing chosen password.
  await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: { email, name: 'Admin', password: hashed, role: 'ADMIN' },
  })
  console.log(`Seed completed: admin account ${email}`)
}

async function main() {
  await seedAdmin()

  // Non-destructive: only seed demo courses on a fresh DB. Never wipe an existing
  // DB — that would cascade-delete real courses, enrollments (access grants) and progress.
  const existingCourses = await prisma.course.count()
  if (existingCourses > 0) {
    console.log(`Skipped course seed — ${existingCourses} courses already exist (admin ensured, data preserved)`)
    return
  }

  await prisma.course.createMany({
    data: [
      {
        order: 1,
        slug: 'html-css-fundamentals',
        title: 'HTML & CSS พื้นฐาน สำหรับผู้เริ่มต้น',
        description: 'เรียนรู้โครงสร้าง HTML และการตกแต่งด้วย CSS ตั้งแต่ศูนย์ จนสร้างเว็บเพจได้จริง',
        thumbnailUrl: 'https://placehold.co/640x360/3b82f6/ffffff?text=HTML+%26+CSS',
        duration: '4:30:00',
        difficulty: Difficulty.BEGINNER,
        category: 'Frontend',
      },
      {
        order: 2,
        slug: 'javascript-essentials',
        title: 'JavaScript Essentials ฉบับครบจบ',
        description: 'ทำความเข้าใจ JavaScript ตั้งแต่ syntax พื้นฐาน ไปจนถึง ES2024 และ async/await',
        thumbnailUrl: 'https://placehold.co/640x360/f59e0b/ffffff?text=JavaScript',
        duration: '7:15:00',
        difficulty: Difficulty.BEGINNER,
        category: 'Frontend',
      },
      {
        order: 3,
        slug: 'react-complete-guide',
        title: 'React.js ครบจบใน 1 คอร์ส',
        description: 'สร้าง Web Application ด้วย React 19 ครอบคลุม Hooks, State Management และ React Router',
        thumbnailUrl: 'https://placehold.co/640x360/06b6d4/ffffff?text=React.js',
        duration: '9:45:00',
        difficulty: Difficulty.INTERMEDIATE,
        category: 'Frontend',
      },
      {
        order: 4,
        slug: 'nodejs-express-backend',
        title: 'Node.js & Express สร้าง REST API',
        description: 'เขียน Backend ด้วย Node.js และ Express พร้อม authentication, middleware และ database',
        thumbnailUrl: 'https://placehold.co/640x360/22c55e/ffffff?text=Node.js',
        duration: '6:00:00',
        difficulty: Difficulty.INTERMEDIATE,
        category: 'Backend',
      },
      {
        order: 5,
        slug: 'nextjs-fullstack',
        title: 'Next.js Full-Stack Development',
        description: 'สร้างแอปพลิเคชัน Full-Stack ด้วย Next.js App Router, Server Actions และ Prisma ORM',
        thumbnailUrl: 'https://placehold.co/640x360/6366f1/ffffff?text=Next.js',
        duration: '8:20:00',
        difficulty: Difficulty.INTERMEDIATE,
        category: 'Frontend',
      },
      {
        order: 6,
        slug: 'docker-devops-basics',
        title: 'Docker & DevOps สำหรับ Developer',
        description: 'เรียนรู้ Docker, Docker Compose, CI/CD pipeline และการ deploy แอปบน Linux server',
        thumbnailUrl: 'https://placehold.co/640x360/0ea5e9/ffffff?text=Docker+%26+DevOps',
        duration: '5:52:44',
        difficulty: Difficulty.ADVANCED,
        category: 'DevOps',
      },
    ],
  })

  console.log('Seed completed: 6 courses inserted')

  // Demo lesson with image slides + labs for the HTML course
  const htmlCourse = await prisma.course.findUnique({
    where: { slug: 'html-css-fundamentals' },
  })
  if (htmlCourse) {
    await prisma.lesson.create({
      data: {
        courseId: htmlCourse.id,
        title: 'HTML Tags พื้นฐาน',
        description: 'เรียนรู้โครงสร้าง HTML และ Tags ที่ใช้บ่อย ตั้งแต่ศูนย์',
        order: 1,
        items: {
          create: [
            {
              type: 'SLIDE',
              order: 1,
              imageUrl: 'https://placehold.co/1280x720/8b5cf6/ffffff?text=HTML+Tags+%E0%B8%9E%E0%B8%B7%E0%B9%89%E0%B8%99%E0%B8%90%E0%B8%B2%E0%B8%99',
              caption: 'สไลด์แนะนำ HTML (ตัวอย่าง — แทนที่ด้วย Canva link จริงได้ในหน้า admin)',
            },
            {
              type: 'SLIDE',
              order: 2,
              imageUrl: 'https://placehold.co/1280x720/ec4899/ffffff?text=%E0%B9%82%E0%B8%84%E0%B8%A3%E0%B8%87%E0%B8%AA%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%87+HTML',
              caption: 'โครงสร้าง HTML Document',
            },
            {
              type: 'LAB',
              order: 3,
              title: '🧪 Lab 1 — เว็บเพจแรกของฉัน',
              goal: 'สร้าง HTML page แนะนำตัวเองอย่างง่าย',
              steps: [
                'เปลี่ยน <title> เป็นชื่อของคุณ',
                'เปลี่ยน <h1> เป็น "สวัสดี ฉันชื่อ [ชื่อคุณ]"',
                'เพิ่ม <p> บอกว่าคุณชอบอะไร',
                'กด Save แล้วดูผลลัพธ์ฝั่งขวา!',
              ],
              openFile: 'index.html',
              files: {
                'index.html': `<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="UTF-8">
    <title>หน้าเว็บของฉัน</title>
  </head>
  <body>
    <h1>สวัสดี! ฉันชื่อ ...</h1>
    <p>ฉันชอบ ...</p>
  </body>
</html>`,
              },
            },
            {
              type: 'LAB',
              order: 4,
              title: '🧪 Lab 2 — Profile Page',
              goal: 'สร้างหน้า Profile ของตัวเองด้วย HTML + CSS',
              steps: [
                'ใส่ชื่อของคุณใน <h1>',
                'เพิ่มรูปโปรไฟล์ด้วย <img>',
                'เพิ่มรายการสิ่งที่ชอบด้วย <ul>',
                'เพิ่ม link ไปยังเว็บโปรด',
              ],
              openFile: 'index.html',
              files: {
                'index.html': `<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="UTF-8">
    <title>Profile ของฉัน</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <div class="profile">
      <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Felix" alt="รูปโปรไฟล์" class="avatar">
      <h1>ชื่อของฉัน</h1>
      <p class="bio">คำอธิบายตัวเองสั้นๆ...</p>
      <h2>สิ่งที่ฉันชอบ ❤️</h2>
      <ul><li>...</li><li>...</li></ul>
    </div>
  </body>
</html>`,
                'style.css': `body { font-family: sans-serif; background: #f0f4ff; display: flex; justify-content: center; padding: 40px; }
.profile { background: white; border-radius: 16px; padding: 32px; max-width: 400px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
.avatar { width: 100px; height: 100px; border-radius: 50%; }
h1 { color: #1e3a8a; }`,
              },
            },
          ],
        },
      },
    })
    console.log('Seed completed: 1 lesson + 4 items for html-css-fundamentals')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
