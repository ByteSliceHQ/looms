import { Data, Predicate, Schema } from 'effect'

import type { JsonValue } from '@looms/core'
import type { EffectWorkerTask } from '@looms/runtime'

export const AX_PROTOCOL_VERSION = 1

export const AxTaskSchema = Schema.Struct({
  runId: Schema.String,
  effectId: Schema.String,
  attempt: Schema.Finite,
  type: Schema.String,
  input: Schema.Json,
})

export const AxSubmissionSchema = Schema.Struct({
  protocol: Schema.Literal(AX_PROTOCOL_VERSION),
  scope: Schema.String,
  callbackTarget: Schema.String,
  profile: Schema.String,
  task: AxTaskSchema,
})

export type AxSubmission = Schema.Schema.Type<typeof AxSubmissionSchema>

export const AxOutcomeSchema = Schema.Union([
  Schema.Struct({
    kind: Schema.Literal('complete'),
    events: Schema.Array(Schema.Struct({ type: Schema.String, payload: Schema.Json })),
  }),
  Schema.Struct({ kind: Schema.Literal('fail'), error: Schema.String }),
])

export type AxOutcome = Schema.Schema.Type<typeof AxOutcomeSchema>

export const AxAssignmentSchema = Schema.Struct({
  task: AxTaskSchema,
  idempotencyKey: Schema.String,
})

export type AxAssignment = Schema.Schema.Type<typeof AxAssignmentSchema>

export class AxError extends Data.TaggedError('AxError')<{
  readonly message: string
  readonly status: number
}> {
  constructor(message: string, status = 0) {
    super({ message, status })
    this.name = 'AxError'
  }
}

function isJsonArray(value: JsonValue): value is readonly JsonValue[] {
  return Array.isArray(value)
}

/** A canonical JSON encoding makes retries independent of object insertion order. */
export function canonicalJson(value: JsonValue): string {
  if (value === null || !Predicate.isReadonlyObject(value)) {
    return JSON.stringify(value)
  }

  if (isJsonArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`
  }

  const keys = Object.keys(value)
  // This fresh array can be sorted in place on the package's ES2022 target.
  // oxlint-disable-next-line unicorn/no-array-sort
  keys.sort()

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key] ?? null)}`)
    .join(',')}}`
}

export function digest(value: string): Promise<string> {
  return crypto.subtle
    .digest('SHA-256', new TextEncoder().encode(value))
    .then((buffer) =>
      Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join(''),
    )
}

export function logicalEffectKey(
  scope: string,
  task: Pick<EffectWorkerTask, 'runId' | 'effectId'>,
): Promise<string> {
  return digest(canonicalJson([scope, task.runId, task.effectId]))
}

export function axJobId(scope: string, task: EffectWorkerTask): Promise<string> {
  return digest(
    canonicalJson([AX_PROTOCOL_VERSION, scope, task.runId, task.effectId, task.attempt]),
  ).then((hash) => `looms-${hash.slice(0, 40)}`)
}
