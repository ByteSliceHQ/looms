import { Option, Predicate, Schema } from 'effect'

import type { DebuggerSelection } from '@looms/debugger'

const optionalId = Schema.decodeUnknownOption(Schema.NonEmptyString)
const integer = Schema.decodeUnknownOption(Schema.Int)

function readId(value: string | undefined): string | undefined {
  const decoded = optionalId(value ?? '')
  return Option.isSome(decoded) ? decoded.value : undefined
}

function readSeq(value: number | string | undefined): number | undefined {
  if (value === undefined) {
    return undefined
  }

  const direct = integer(value)

  if (Option.isSome(direct) && direct.value > 0) {
    return direct.value
  }

  if (!Predicate.isString(value)) {
    return undefined
  }

  const parsed = integer(Number.parseInt(value, 10))
  return Option.isSome(parsed) && parsed.value > 0 ? parsed.value : undefined
}

export function parseSearch(search: {
  kind?: string
  name?: string
  run?: string
  thread?: string
  seq?: number | string
}): DebuggerSelection {
  return {
    kind: readId(search.kind),
    name: readId(search.name),
    run: readId(search.run),
    thread: readId(search.thread),
    seq: readSeq(search.seq),
  }
}
