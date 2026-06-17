'use client'

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center bg-white p-8 text-center">
        <span className="text-5xl">😵</span>
        <h2 className="mt-4 text-xl font-bold text-zinc-800">เกิดข้อผิดพลาด</h2>
        <p className="mt-2 text-sm text-zinc-500">
          {error.digest ? `รหัส: ${error.digest}` : 'กรุณาลองใหม่อีกครั้ง'}
        </p>
        <button
          onClick={unstable_retry}
          className="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
        >
          ลองอีกครั้ง
        </button>
      </body>
    </html>
  )
}
