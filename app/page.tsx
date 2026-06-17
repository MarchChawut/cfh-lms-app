import Link from 'next/link'
import type { Course } from '@prisma/client'
import { getCourses } from '@/lib/data'
import { CourseCardFun, getCategoryTheme } from '@/components/CourseCardFun'
import { getSession, type SessionPayload } from '@/lib/session'
import { logout } from '@/app/actions/auth'

export const dynamic = 'force-dynamic'

const CATEGORY_ORDER = ['Frontend', 'Backend', 'DevOps']

const FAQ = [
  {
    q: '🤔 ต้องเขียนโค้ดเป็นมาก่อนไหม?',
    a: 'ไม่ต้องเลย! ทุกคอร์สเริ่มจากศูนย์ อธิบายทีละขั้นแบบเข้าใจง่าย ขอแค่อ่านออกเขียนได้ก็เรียนได้',
  },
  {
    q: '💻 ต้องใช้คอมพิวเตอร์แรงๆ ไหม?',
    a: 'ไม่ต้อง! เขียนโค้ดในเบราว์เซอร์ได้เลยผ่าน Lab ในตัว ไม่ต้องลงโปรแกรมอะไรให้ยุ่งยาก',
  },
  {
    q: '💰 เสียเงินไหม?',
    a: 'ฟรีทั้งหมด 100% ทุกคอร์ส ทุกบทเรียน ไม่มีค่าใช้จ่ายแอบแฝง',
  },
  {
    q: '🎂 อายุเท่าไหร่ถึงเรียนได้?',
    a: 'เหมาะสำหรับน้องๆ อายุ 10 ปีขึ้นไป และทุกคนที่อยากเริ่มเขียนเว็บ ไม่จำกัดอายุสูงสุด!',
  },
]

function NavBar({ session }: { session: SessionPayload | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/70 backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/70">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-1.5 text-lg font-extrabold">
          <span className="text-2xl">🖥️</span>
          <span className="bg-linear-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
            Code&Fun House
          </span>
        </Link>
        <div className="flex items-center gap-1 text-sm font-bold">
          <Link
            href="/#courses"
            className="rounded-full px-3 py-1.5 text-zinc-600 transition-colors hover:bg-violet-100 hover:text-violet-700 dark:text-zinc-300"
          >
            เรามีคอร์สอะไรบ้าง?
          </Link>
          {session?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="rounded-full px-3 py-1.5 text-zinc-600 transition-colors hover:bg-violet-100 hover:text-violet-700 dark:text-zinc-300"
            >
              🛠️ Admin
            </Link>
          )}
          {session ? (
            <>
              <span className="hidden px-3 py-1.5 text-zinc-700 sm:inline dark:text-zinc-200">
                สวัสดี, {session.name} 👋
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-full bg-linear-to-r from-violet-600 to-pink-600 px-4 py-1.5 text-white shadow-md transition-transform hover:scale-105"
                >
                  ออกจากระบบ
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-linear-to-r from-violet-600 to-pink-600 px-4 py-1.5 text-white shadow-md transition-transform hover:scale-105"
            >
              🔑Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-violet-500 via-fuchsia-500 to-pink-500 px-6 py-24 text-center text-white">
      {/* blurred blobs */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-yellow-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-cyan-300/30 blur-3xl" />

      {/* floating emojis */}
      <span className="pointer-events-none absolute left-[8%] top-[18%] hidden text-5xl animate-bounce sm:block" style={{ animationDelay: '0ms' }}>
        🎨
      </span>
      <span className="pointer-events-none absolute right-[10%] top-[24%] hidden text-5xl animate-bounce sm:block" style={{ animationDelay: '300ms' }}>
        🚀
      </span>
      <span className="pointer-events-none absolute bottom-[16%] left-[14%] hidden text-4xl animate-pulse sm:block" style={{ animationDelay: '150ms' }}>
        ⚙️
      </span>
      <span className="pointer-events-none absolute bottom-[20%] right-[16%] hidden text-4xl animate-bounce sm:block" style={{ animationDelay: '500ms' }}>
        ✨
      </span>

      <div className="relative mx-auto max-w-2xl">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold backdrop-blur">
          🎮 เรียนเขียนโค้ดสนุกๆ สำหรับน้องๆ อายุ 8 ปี ขึ้นไป
        </span>
        <h1 className="text-4xl font-black leading-tight drop-shadow-md sm:text-6xl">
          💻พื้นฐานที่แข็งแกร่ง🖥️
          <br />
          💕คือ หัวใจสำคัญ ❤️
          <br />
          📖ในการเรียนรู้ 🌈
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-lg font-medium text-white/90">
          เราจึงปูพื้นฐานแน่น🧱 เข้าใจง่าย ไม่งงแน่นอน! 💡✨<br />เปลี่ยนทุกความฝัน💭 ให้เป็นผลงานสุด cool!🤖🎯
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/#courses"
            className="rounded-2xl bg-white px-8 py-4 text-lg font-black text-fuchsia-600 shadow-xl transition-transform hover:scale-105"
          >
            🎮 เริ่มเลย!
          </Link>
          <a
            href="#courses"
            className="rounded-2xl bg-white/20 px-8 py-4 text-lg font-bold text-white backdrop-blur transition-transform hover:scale-105"
          >
            ดูคอร์สก่อน 👀
          </a>
        </div>
      </div>
    </section>
  )
}

function FunStats({ courseCount }: { courseCount: number }) {
  const stats = [
    { emoji: '📚', value: `${courseCount}`, label: 'คอร์สสนุกๆ', grad: 'from-violet-500 to-purple-500' },
    { emoji: '🧪', value: '∞', label: 'แล็บให้ลองเขียน', grad: 'from-pink-500 to-rose-500' },
    { emoji: '💯', value: '100%', label: 'ไม่มีกั๊ก', grad: 'from-sky-500 to-cyan-500' },
    { emoji: '🎉', value: '∞', label: 'ความสนุก', grad: 'from-amber-500 to-orange-500' },
  ]
  return (
    <section className="relative z-10 mx-auto -mt-10 grid max-w-5xl grid-cols-2 gap-4 px-4 sm:grid-cols-4 sm:px-6">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex flex-col items-center gap-1 rounded-3xl bg-white p-5 text-center shadow-lg dark:bg-zinc-900"
        >
          <span className="text-3xl">{s.emoji}</span>
          <span
            className={`bg-linear-to-r ${s.grad} bg-clip-text text-3xl font-black text-transparent`}
          >
            {s.value}
          </span>
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
            {s.label}
          </span>
        </div>
      ))}
    </section>
  )
}

function CategorySection({
  category,
  courses,
}: {
  category: string
  courses: Course[]
}) {
  const theme = getCategoryTheme(category)
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span
          className={`flex size-12 items-center justify-center rounded-2xl bg-linear-to-br ${theme.grad} text-2xl shadow-md`}
        >
          {theme.emoji}
        </span>
        <div>
          <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-50">
            {category}
          </h3>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {theme.label}
          </p>
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCardFun key={course.id} course={course} />
        ))}
      </div>
    </div>
  )
}

export default async function Home() {
  const [courses, session] = await Promise.all([getCourses(), getSession()])

  // group by category, keep known order first then any extras
  const byCategory = new Map<string, Course[]>()
  for (const c of courses) {
    if (!byCategory.has(c.category)) byCategory.set(c.category, [])
    byCategory.get(c.category)!.push(c)
  }
  const categories = [
    ...CATEGORY_ORDER.filter((c) => byCategory.has(c)),
    ...[...byCategory.keys()].filter((c) => !CATEGORY_ORDER.includes(c)),
  ]

  return (
    <div className="flex flex-1 flex-col bg-linear-to-b from-violet-50 via-white to-pink-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      <NavBar session={session} />
      <main className="flex flex-1 flex-col">
        <Hero />
        <FunStats courseCount={courses.length} />

        {/* Courses by category */}
        <section id="courses" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-zinc-800 sm:text-4xl dark:text-zinc-50">
              เลือกคอร์สที่อยากเรียน 🎯
            </h2>
            <p className="mt-2 font-medium text-zinc-500 dark:text-zinc-400">
              เริ่มจากเลข 1 ไล่ไปเรื่อยๆ หรือเลือกเรื่องที่ชอบก็ได้นะ!
            </p>
          </div>
          <div className="flex flex-col gap-14">
            {categories.map((category) => (
              <CategorySection
                key={category}
                category={category}
                courses={byCategory.get(category)!}
              />
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
          <h2 className="mb-8 text-center text-3xl font-black text-zinc-800 sm:text-4xl dark:text-zinc-50">
            คำถามที่เจอบ่อย 💬
          </h2>
          <div className="flex flex-col gap-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group/faq rounded-3xl bg-white p-5 shadow-md transition-shadow hover:shadow-lg dark:bg-zinc-900"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-extrabold text-zinc-800 dark:text-zinc-50">
                  {item.q}
                  <span className="text-xl text-violet-500 transition-transform group-open/faq:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-6 py-12">
          <div className="mx-auto max-w-3xl rounded-[2rem] bg-linear-to-br from-violet-500 via-fuchsia-500 to-pink-500 px-8 py-12 text-center text-white shadow-xl">
            <p className="text-2xl font-black sm:text-3xl">พร้อมเริ่มผจญภัยรึยัง? 🚀</p>
            <p className="mt-2 font-medium text-white/90">
              เลือกคอร์สแรกของหนู แล้วมาสนุกกับการเขียนโค้ดกันเลย!
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-2xl bg-white px-8 py-4 text-lg font-black text-fuchsia-600 shadow-lg transition-transform hover:scale-105"
            >
              🎮 เริ่มเรียนได้เลย
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/40 bg-white/60 px-6 py-8 text-center backdrop-blur dark:border-white/10 dark:bg-zinc-950/60">
        <div className="flex items-center justify-center gap-1.5 text-lg font-extrabold">
          <span className="text-2xl">🦊</span>
          <span className="bg-linear-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
            Code&Fun House
          </span>
        </div>
        <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          เรียนเขียนโค้ดสนุกๆ สำหรับน้องๆ อายุ 8 ปี ขึ้นไป 💜
        </p>
        <div className="mt-4 flex justify-center gap-4 text-sm font-bold text-zinc-600 dark:text-zinc-300">
          <Link href="/" className="hover:text-violet-600">หน้าแรก</Link>
          <Link href="/#courses" className="hover:text-violet-600">คอร์สทั้งหมด</Link>
        </div>
      </footer>
    </div>
  )
}
