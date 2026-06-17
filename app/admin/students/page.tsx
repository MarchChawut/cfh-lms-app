import Link from 'next/link'
import prisma from '@/lib/prisma'
import { createUser, deleteUser } from '@/app/admin/actions'
import { UserForm } from '@/components/admin/forms'
import { Trash2, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function StudentsPage() {
  const period = new Date().toISOString().slice(0, 7)
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { enrollments: true } },
      payments: { where: { period } },
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black">นักเรียน &amp; ผู้ใช้</h1>

      <UserForm action={createUser} />

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[680px] text-sm whitespace-nowrap">
          <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3">ชื่อ</th>
              <th className="px-4 py-3">อีเมล</th>
              <th className="px-4 py-3">บทบาท</th>
              <th className="px-4 py-3">คอร์สที่เรียนได้</th>
              <th className="px-4 py-3">จ่ายเดือน {period}</th>
              <th className="px-4 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => {
              const pay = u.payments[0]
              const paid = pay?.status === 'PAID'
              return (
                <tr key={u.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-semibold">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.role === 'ADMIN' ? (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">แอดมิน</span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">นักเรียน</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{u._count.enrollments}</td>
                  <td className="px-4 py-3">
                    {paid ? (
                      <span className="font-semibold text-emerald-600">✓ จ่ายแล้ว</span>
                    ) : u.role === 'STUDENT' ? (
                      <span className="font-semibold text-rose-500">ยังไม่จ่าย</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/students/${u.id}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-violet-600 hover:bg-violet-50"
                      >
                        จัดการ <ChevronRight className="size-3.5" />
                      </Link>
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                          <Trash2 className="size-3.5" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
