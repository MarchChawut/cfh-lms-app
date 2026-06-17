import Link from 'next/link'
import prisma from '@/lib/prisma'
import { createCourse } from '@/app/admin/actions'
import { CourseForm } from '@/components/admin/forms'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NewCoursePage() {
  const used = await prisma.course.findMany({
    distinct: ['category'],
    select: { category: true },
    orderBy: { category: 'asc' },
  })

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/courses" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> กลับ
      </Link>
      <h1 className="text-2xl font-black">เพิ่มคอร์สใหม่</h1>
      <CourseForm action={createCourse} existingCategories={used.map((u) => u.category)} />
    </div>
  )
}
