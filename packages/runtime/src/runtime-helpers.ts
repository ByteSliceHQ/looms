import { Effect, Layer, Predicate } from 'effect'

import {
  asJson,
  createEvent,
  makeMemorySnapshotStore,
  matchingWaits,
  snapshotStoreOf,
  validateEventInput,
  validateEventsEffect,
  validateInput,
  withSnapshotStore,
  type AnyRuntimeModule,
  type AppendableEvent,
  type EventCatalog,
  type EventEnvelope,
  type EventInput,
  type EventOrigin,
  type EventStore,
  type InvalidEventError,
  type JsonValue,
  type RegisteredDefinition,
  type RunCursor,
  type RunState,
  type SnapshotStore,
} from '@looms/core'

export function resolveSnapshotStore(
  explicit: SnapshotStore | undefined,
  store: EventStore | undefined,
): SnapshotStore {
  if (explicit) {
    if (store) {
      withSnapshotStore(store, explicit)
    }

    return explicit
  }

  const attached = store ? snapshotStoreOf(store) : undefined

  if (attached) {
    return attached
  }

  const memory = Effect.runSync(makeMemorySnapshotStore)

  if (store) {
    withSnapshotStore(store, memory)
  }

  return memory
}

export class RunCursorCache {
  private readonly map = new Map<string, RunCursor>()

  constructor(private readonly max: number) {}

  get(runId: string): RunCursor | undefined {
    const value = this.map.get(runId)

    if (value) {
      this.map.delete(runId)
      this.map.set(runId, value)
    }

    return value
  }

  set(runId: string, cursor: RunCursor): void {
    if (this.max <= 0) {
      return
    }

    this.map.delete(runId)
    this.map.set(runId, cursor)

    while (this.map.size > this.max) {
      const oldest = this.map.keys().next().value

      if (oldest === undefined) {
        break
      }

      this.map.delete(oldest)
    }
  }

  delete(runId: string): void {
    this.map.delete(runId)
  }
}

export function stripSeq(events: ReadonlyArray<EventEnvelope>): AppendableEvent[] {
  return events.map(({ seq: _seq, ...rest }) => rest)
}

export function moduleServices(
  modules: readonly AnyRuntimeModule[],
  definitions: ReadonlyArray<RegisteredDefinition>,
): Layer.Layer<any> {
  // SAFETY: Empty layer serves as seed; module service layers are merged in.
  let merged: Layer.Layer<any> = Layer.empty as Layer.Layer<any>

  for (const module of modules) {
    if (module.services) {
      merged = Layer.merge(merged, module.services({ definitions }))
    }
  }

  return merged
}

export function groupOutstanding(
  items: readonly { threadId: string; causingSeq: number }[],
): string[] {
  const keys: string[] = []
  const seen = new Set<string>()

  for (const item of items) {
    const key = `${item.threadId}:${item.causingSeq}`

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    keys.push(key)
  }

  return keys
}

/**
 * Every `runtime.thread.started` in the log goes through this helper so
 * definition input is validated and Standard Schema defaults are applied.
 * A future third producer of thread.started must call this; do not emit the
 * event with raw input.
 */
export function threadStartedEvents(
  definitions: ReadonlyMap<string, RegisteredDefinition>,
  args: {
    kind: string
    definitionName: string
    input: JsonValue
    threadId: string
    parentThreadId: string | null
  },
): Effect.Effect<ReadonlyArray<EventInput>, Error> {
  return Effect.gen(function* () {
    const def = definitions.get(`${args.kind}:${args.definitionName}`)
    const raw = args.input ?? null
    let startedInput = raw
    let validationError: string | undefined

    if (def?.input) {
      const validated = yield* Effect.tryPromise({
        try: () => {
          // SAFETY: RegisteredDefinition.input is a Standard Schema when present.
          return validateInput(def.input as never, raw)
        },
        catch: (err) => (err instanceof Error ? err : new Error(String(err))),
      }).pipe(
        Effect.map((value) => ({ ok: true as const, value })),
        Effect.catch((err) => Effect.succeed({ ok: false as const, error: err.message })),
      )

      if (validated.ok) {
        startedInput = validated.value
      } else {
        validationError = validated.error
      }
    }

    const started: EventInput = {
      type: 'runtime.thread.started',
      payload: {
        threadId: args.threadId,
        kind: args.kind,
        definitionName: args.definitionName,
        input: startedInput,
        parentThreadId: args.parentThreadId,
      },
      threadId: args.threadId,
      parentThreadId: args.parentThreadId,
    }

    if (!validationError) {
      return [started]
    }

    return [
      started,
      {
        type: 'runtime.thread.failed',
        payload: { threadId: args.threadId, error: validationError },
        threadId: args.threadId,
      },
    ]
  })
}

export function synthesizedThreadFailed(
  before: RunState,
  after: RunState,
  written: readonly EventEnvelope[],
): EventInput[] {
  const out: EventInput[] = []

  for (const [threadId, thread] of Object.entries(after.threads)) {
    if (thread.status !== 'failed') {
      continue
    }

    const prev = before.threads[threadId]

    if (prev?.status === 'failed') {
      continue
    }

    const already = written.some((event) => {
      if (event.type !== 'runtime.thread.failed') {
        return false
      }

      if (event.threadId === threadId) {
        return true
      }

      return Predicate.isObject(event.payload) && event.payload.threadId === threadId
    })

    if (already) {
      continue
    }

    out.push({
      type: 'runtime.thread.failed',
      payload: { threadId, error: thread.error ?? 'failed' },
      threadId,
    })
  }

  return out
}

export function waitSatisfiedEvents(
  state: RunState,
  events: readonly EventEnvelope[],
): EventInput[] {
  const produced: EventInput[] = []
  const remaining = { ...state.waits }

  for (const event of events) {
    if (event.ephemeral || event.type === 'runtime.wait.satisfied') {
      continue
    }

    const matches = matchingWaits(event, Object.values(remaining))

    for (const record of matches) {
      produced.push({
        type: 'runtime.wait.satisfied',
        payload: asJson({
          waitId: record.waitId,
          tag: record.tag ?? null,
          event: { id: event.id, type: event.type, payload: event.payload },
        }),
        threadId: record.threadId,
        causationId: event.id,
      })

      delete remaining[record.waitId]
    }
  }

  return produced
}

export function createEffectFailedEvent(
  runId: string,
  item: { effectId: string; causingEventId: string; threadId: string },
  error: string,
): EventEnvelope {
  return createEvent(runId, {
    type: 'runtime.effect.failed',
    payload: {
      effectId: item.effectId,
      error,
    },
    threadId: item.threadId,
    effectId: item.effectId,
    causationId: item.causingEventId,
    origin: { type: 'system' },
  })
}

export function materializeEffectOutcome(
  catalogs: readonly EventCatalog[],
  runId: string,
  item: { effectId: string; causingEventId: string; threadId: string },
  input: EventInput,
): Effect.Effect<EventEnvelope> {
  return validateEventInput(catalogs, input).pipe(
    Effect.map((validated) =>
      createEvent(runId, {
        ...validated,
        effectId: validated.effectId ?? item.effectId,
        causationId: validated.causationId ?? item.causingEventId,
        threadId: validated.threadId ?? item.threadId,
        origin: validated.origin ?? { type: 'thread', threadId: item.threadId },
        id: validated.id,
        ts: validated.ts,
      }),
    ),
    Effect.catchTag('InvalidEventError', (err) =>
      Effect.succeed(createEffectFailedEvent(runId, item, err.message)),
    ),
  )
}

export function createLiveEvent(
  runId: string,
  item: { effectId: string; causingEventId: string; threadId: string },
  validated: EventInput,
): AppendableEvent | undefined {
  const targetThreadId = validated.threadId ?? item.threadId

  const ephemeral = createEvent(runId, {
    ...validated,
    effectId: item.effectId,
    causationId: item.causingEventId,
    threadId: targetThreadId,
    ephemeral: validated.ephemeral ?? true,
    origin: validated.origin ?? { type: 'thread', threadId: item.threadId },
  })

  const [liveEvent] = stripSeq([ephemeral])
  return liveEvent
}

export function validateAndCreateEvents(
  catalogs: readonly EventCatalog[],
  runId: string,
  events: readonly EventInput[],
  defaults: { origin: EventOrigin; threadId?: string | null },
): Effect.Effect<EventEnvelope[], InvalidEventError> {
  return validateEventsEffect(catalogs, events).pipe(
    Effect.map((validated) =>
      validated.map((input) =>
        createEvent(runId, {
          ...input,
          threadId: input.threadId !== undefined ? input.threadId : (defaults.threadId ?? null),
          origin: input.origin ?? defaults.origin,
        }),
      ),
    ),
  )
}
