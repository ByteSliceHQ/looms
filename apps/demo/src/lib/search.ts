import { z } from 'zod'

export type DemoSearch = {
  run?: string
  thread?: string
  seq?: number
}

export const emptySearch: DemoSearch = {}

const optionalId = z.string().min(1)

function readSeq(value: number | string | undefined): number | undefined {
  const asNumber = z.number().int().safeParse(value)

  if (asNumber.success) {
    return asNumber.data
  }

  const asString = z.string().safeParse(value)

  if (!asString.success) {
    return undefined
  }

  const parsed = z.number().int().safeParse(Number.parseInt(asString.data, 10))
  return parsed.success ? parsed.data : undefined
}

export function parseSearch(search: {
  run?: string
  thread?: string
  seq?: number | string
}): DemoSearch {
  const run = optionalId.safeParse(search.run)
  const thread = optionalId.safeParse(search.thread)
  const seq = readSeq(search.seq)
  const next: DemoSearch = {}

  if (run.success) {
    next.run = run.data
  }

  if (thread.success) {
    next.thread = thread.data
  }

  if (seq !== undefined) {
    next.seq = seq
  }

  return next.run || next.thread || next.seq !== undefined ? next : emptySearch
}
