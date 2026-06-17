import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/AuthForm'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ | CFH Kids Code',
}

export default async function LoginPage() {
  const session = await getSession()
  if (session) redirect('/')

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-linear-to-br from-violet-500 via-fuchsia-500 to-pink-500 px-4 py-12">
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-yellow-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-cyan-300/30 blur-3xl" />

      <Link
        href="/"
        className="relative mb-6 flex items-center gap-1.5 text-xl font-extrabold text-white drop-shadow"
      >
        <span className="text-2xl">💻</span> Code&Fun House
      </Link>

      <AuthForm />
    </main>
  )
}
