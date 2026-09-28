import { Data, Effect, Schema } from 'effect'

import { AxOutcomeSchema, AxSubmissionSchema } from '../../../packages/ax/src/protocol'

export class BridgeError extends Data.TaggedError('BridgeError')<{
  readonly message: string
  readonly status: number
}> {}

export const io = <A>(work: () => Promise<A>) =>
  Effect.tryPromise({
    try: work,
    catch: (cause) =>
      cause instanceof BridgeError
        ? cause
        : new BridgeError({
            message: cause instanceof Error ? cause.message : 'Bridge operation failed',
            status: 503,
          }),
  })

export const ProfileSchema = Schema.Struct({
  id: Schema.String,
  effectType: Schema.String,
  image: Schema.String,
  command: Schema.Array(Schema.String),
  gateway: Schema.String,
  allowedEvents: Schema.Array(Schema.String),
  maxDurationMs: Schema.Finite,
})

export type Profile = Schema.Schema.Type<typeof ProfileSchema>

export const JobSchema = Schema.Struct({
  id: Schema.String,
  logicalKey: Schema.String,
  requestHash: Schema.String,
  submission: AxSubmissionSchema,
  profile: ProfileSchema,
  cancelled: Schema.Boolean,
  launched: Schema.Boolean,
  stopped: Schema.Boolean,
  instance: Schema.NullOr(Schema.String),
  outcome: Schema.NullOr(AxOutcomeSchema),
  outcomeDigest: Schema.NullOr(Schema.String),
  delivery: Schema.Literals(['pending', 'applied', 'obsolete', 'uncertain']),
  createdAt: Schema.Finite,
  expiresAt: Schema.Finite,
  lastError: Schema.NullOr(Schema.String),
})

export type Job = Schema.Schema.Type<typeof JobSchema>

export interface JobStore {
  accept(job: Job): Promise<Job>
  get(id: string): Promise<Job | null>
  update(id: string, change: (job: Job) => Job): Promise<Job>
  pending(): Promise<readonly Job[]>
  siblings(logicalKey: string): Promise<readonly Job[]>
}

export interface AxControl {
  ensure(job: Job, token: string): Promise<void>
  ready(job: Job): Promise<boolean>
  /** True only after BOTH the AX task and Substrate actor are absent. */
  stop(job: Job): Promise<boolean>
}

export interface CallbackTarget {
  readonly id: string
  readonly endpoint: string
  readonly readToken: string
  readonly workerToken: string
}

export interface BridgeConfig {
  readonly scope: string
  readonly hostToken: string
  readonly capabilitySecret: string
  readonly profiles: readonly Profile[]
  readonly target: CallbackTarget
}

export function conflict(message: string): never {
  throw new BridgeError({ message, status: 409 })
}
