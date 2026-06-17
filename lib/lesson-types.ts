/** Shapes used by the student-facing lesson viewer (serializable from DB LessonItem). */

export type LabData = {
  title: string
  goal: string
  steps: string[]
  files: Record<string, string>
  openFile?: string
}

export type LessonItemView =
  | { id: number; type: 'SLIDE'; order: number; imageUrl: string; caption: string | null }
  | ({ id: number; type: 'LAB'; order: number } & LabData)
