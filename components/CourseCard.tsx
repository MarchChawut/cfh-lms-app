import Image from 'next/image'
import Link from 'next/link'
import type { Course, Difficulty } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'

const difficultyLabel: Record<Difficulty, string> = {
  BEGINNER: 'ระดับเริ่มต้น',
  INTERMEDIATE: 'ระดับปานกลาง',
  ADVANCED: 'ระดับขั้นสูง',
}

const difficultyColor: Record<Difficulty, string> = {
  BEGINNER:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  INTERMEDIATE:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  ADVANCED:
    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
}

export function CourseCard({ course }: { course: Course }) {
  return (
    <Card className="group/card overflow-hidden transition-shadow hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <Image
          src={course.thumbnailUrl}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-300 group-hover/card:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Duration overlay */}
        <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
          <Clock className="size-3" />
          {course.duration}
        </div>
      </div>

      <CardContent className="flex flex-col gap-3 pt-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              difficultyColor[course.difficulty]
            )}
          >
            {difficultyLabel[course.difficulty]}
          </span>
          <Badge variant="outline">{course.category}</Badge>
        </div>

        {/* Title */}
        <div>
          <span className="mr-1.5 text-xs font-bold text-muted-foreground">
            #{course.order}
          </span>
          <span className="text-sm font-semibold leading-snug line-clamp-2">
            {course.title}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {course.description}
        </p>
      </CardContent>

      <CardFooter className="pt-0">
        <Link
          href={`/courses/${course.slug}`}
          className={cn(buttonVariants({ size: 'sm' }), 'w-full')}
        >
          ดูคอร์สเรียน
        </Link>
      </CardFooter>
    </Card>
  )
}
