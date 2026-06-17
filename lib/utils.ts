import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format an HH:MM range into Thai "10.00-12.00 น." Returns null unless BOTH ends are present. */
export function fmtTimeRange(start?: string | null, end?: string | null): string | null {
  if (!start || !end) return null
  return `${start.replace(':', '.')}-${end.replace(':', '.')} น.`
}

/** Hours between two HH:MM times (supports halves). Returns null if either is missing/invalid. */
export function hoursBetween(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  if ([sh, sm, eh, em].some(Number.isNaN)) return null
  const mins = eh * 60 + em - (sh * 60 + sm)
  return mins > 0 ? mins / 60 : null
}
