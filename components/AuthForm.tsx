'use client'

import { useActionState, useState } from 'react'
import { login, type AuthState } from '@/app/actions/auth'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-xs font-bold text-rose-500">⚠️ {msg}</p>
}

export function AuthForm() {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    login,
    null,
  )
  const [showPw, setShowPw] = useState(false)
  const fe = state?.fieldErrors ?? {}

  const inputClass =
    'w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3 text-base font-medium text-zinc-800 outline-none transition-colors focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100'

  return (
    <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-xl dark:bg-zinc-900">
      <div className="mb-6 text-center">
        <div className="text-5xl">🔑</div>
        <h1 className="mt-2 text-2xl font-black text-zinc-800 dark:text-zinc-50">
          ยินดีต้อนรับกลับมา!
        </h1>
        <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          เข้าสู่ระบบเพื่อเรียนต่อกันเลย
        </p>
      </div>

      {state?.error && (
        <div className="mb-4 rounded-2xl bg-rose-100 px-4 py-3 text-sm font-bold text-rose-600 dark:bg-rose-900/40 dark:text-rose-300">
          ⚠️ {state.error}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-bold text-zinc-700 dark:text-zinc-300">
            อีเมล
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className={inputClass}
          />
          <FieldError msg={fe.email} />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-bold text-zinc-700 dark:text-zinc-300">
            รหัสผ่าน
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              aria-label={showPw ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            >
              {showPw ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
          <FieldError msg={fe.password} />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 to-pink-600 px-6 py-3.5 text-base font-black text-white shadow-md transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending && <Loader2 className="size-5 animate-spin" />}
          {isPending ? 'กำลังดำเนินการ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
        ยังไม่มีบัญชี? ติดต่อแอดมินเพื่อขอเปิดบัญชีเรียน 🦊
      </p>
    </div>
  )
}
