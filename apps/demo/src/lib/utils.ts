import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { JsonValue } from '@looms/core'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortId(id: string): string {
  const cut = id.lastIndexOf('_')
  const tail = cut >= 0 ? id.slice(cut + 1) : id
  return tail.length > 8 ? tail.slice(0, 8) : tail
}

export function compactJson(value: JsonValue): string {
  const text = JSON.stringify(value)
  if (text === undefined) return ''
  return text.length > 96 ? `${text.slice(0, 93)}…` : text
}
