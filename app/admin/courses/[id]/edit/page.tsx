import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { updateCourse } from '@/app/admin/actions'
import { CourseForm } from '@/components/admin/forms'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [course, used] = await Promise.all([
    prisma.course.findUnique({ where: { id: Number(id) } }),
    prisma.course.findMany({ distinct: ['category'], select: { category: true }, orderBy: { category: 'asc' } }),
  ])
  if (!course) notFound()

  const action = updateCourse.bind(null, course.id)

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/courses" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> กลับ
      </Link>
      <h1 className="text-2xl font-black">แก้ไขคอร์ส</h1>
      <CourseForm action={action} course={course} existingCategories={used.map((u) => u.category)} />
    </div>
  )
}
