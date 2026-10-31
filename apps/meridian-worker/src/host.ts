import { Effect, Schema } from 'effect'

import {
  bindDailyFills,
  bindKillReader,
  bindLiveCredentials,
  bindSessionControl,
  END_OF_DAY_RUN_ID,
  endOfDay,
  MARKET_OPEN_RUN_ID,
  marketOpen,
  meridianModules,
  submitOrder,
} from '@looms/meridian'
import {
  cloudflareQueueWorker,
  durableObjectLauncher,
  durableObjectScheduleHost,
  LoomsDurableObject,
  type LoomsDurableObjectConfig,
  type QueueProducer,
} from '@swirls/looms/cloudflare'
import {
  asJson,
  EventEnvelopeSchema,
  isJsonNumber,
  isJsonObject,
  isJsonString,
  type JsonValue,
} from '@swirls/looms/core'
import { sqliteEventStore, sqlStorageExec } from '@swirls/looms/core/sqlite-store'
import type { Projector } from '@swirls/looms/projectors'
import { bearerAuth } from '@swirls/looms/runtime'
import { ensureSchedule } from '@swirls/looms/schedule'

import { liveConfigured, liveEnabled, resolveEvaluator, resolveLlm, type Env } from './env'
import { eventReplica, readFillsSince, readKilled } from './replica'
import { deskStatusProjector } from './status'

let cached: ReturnType<typeof meridianModules> | undefined
let cachedKey = ''

export function modulesFor(env: Env) {
  bindLiveCredentials(
    liveEnabled(env) && liveConfigured(env)
      ? { apiKey: env.ROBINHOOD_API_KEY ?? '', privateKey: env.ROBINHOOD_PRIVATE_KEY ?? '' }
      : undefined,
  )

  bindKillReader(() => readKilled(env))
  bindDailyFills((at) => readFillsSince(env, at))

  bindSessionControl({
    start: (input) =>
      postDesk(env, '/api/sessions', {
        symbol: input.symbol,
        strategy: input.strategy,
        venue: input.venue,
        cycles: input.cycles,
        intervalMs: input.intervalMs,
      }).then((value) => {
        const runId = runIdOf(value)
        return runId ? { runId } : { reason: reasonOf(value) || 'the desk did not open a session' }
      }),
    halt: (runId) =>
      postDesk(env, `/api/sessions/${encodeURIComponent(runId)}/halt`, {}).then((value) => ({
        halted: isJsonObject(value) && value.halted === true,
        reason: reasonOf(value) || 'halt failed',
      })),
    book: () =>
      getDesk(env, '/api/desk').then((value) => ({
        killed: isJsonObject(value) && value.killed === true,
        position: numberField(value, 'position'),
        realizedPnl: numberField(value, 'realizedPnl'),
        openOrders: numberField(value, 'openOrders'),
        lastOrder: textField(value, 'lastOrder') || 'none',
      })),
  })

  const key = [
    env.OPENROUTER_API_KEY ?? '',
    env.LOOMS_MODEL ?? '',
    env.TYPESAFE_AI_API_KEY ?? '',
    env.LOOMS_EVALUATOR_MODEL ?? '',
    env.MERIDIAN_LIVE ?? '',
  ].join('|')

  if (cached && cachedKey === key) {
    return cached
  }

  const llm = resolveLlm(env)
  const evaluator = resolveEvaluator(env)
  cachedKey = key
  cached = evaluator ? meridianModules({ llm, evaluator }) : meridianModules({ llm })
  return cached
}

function attachedReplica(env: Env): readonly Projector[] {
  const replica = eventReplica(env)
  return replica ? [replica] : []
}

function ordersQueue(queue: Queue): QueueProducer {
  return {
    send: (message) => queue.send(message, { contentType: 'json' }).then(() => undefined),
  }
}

let armed: Promise<void> | undefined

export function armSchedules(env: Env): Promise<void> {
  if (armed) {
    return armed
  }

  const host = durableObjectScheduleHost(env.LOOMS_RUN)

  armed = Promise.all([
    ensureSchedule(host, marketOpen, MARKET_OPEN_RUN_ID),
    ensureSchedule(host, endOfDay, END_OF_DAY_RUN_ID),
  ]).then(
    () => undefined,
    (cause) => {
      armed = undefined

      if (cause instanceof Error) {
        throw cause
      }

      throw new Error('Could not arm the desk schedules')
    },
  )

  return armed
}

export class LoomsRun extends LoomsDurableObject<Env> {
  override configure(env: Env): LoomsDurableObjectConfig {
    return {
      modules: modulesFor(env),
      launcher: durableObjectLauncher(env.LOOMS_RUN),
      projectors: [deskStatusProjector(env.DESK), ...attachedReplica(env)],
      authorize: bearerAuth({ worker: env.LOOMS_WORKER_TOKEN }),
      worker: cloudflareQueueWorker({
        routes: [{ effects: [submitOrder], queue: ordersQueue(env.ORDERS_QUEUE) }],
      }),
    }
  }

  override fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'POST' && url.pathname === '/internal/fork-seed') {
      return seedFork(this.ctx, request)
    }

    return super.fetch(request)
  }
}

const SeedBody = Schema.Struct({
  events: Schema.Array(EventEnvelopeSchema),
})

function decodeSeed(text: string) {
  try {
    return Schema.decodeSync(Schema.fromJsonString(SeedBody))(text)
  } catch {
    return undefined
  }
}

function seedFork(ctx: DurableObjectState, request: Request): Promise<Response> {
  const runId = ctx.id.name

  if (!runId) {
    return Promise.resolve(Response.json({ error: 'The run has no name' }, { status: 400 }))
  }

  return request.text().then((text) => {
    const decoded = decodeSeed(text)

    if (!decoded) {
      return Response.json({ error: 'The fork body was unreadable' }, { status: 400 })
    }

    const events = decoded.events

    const store = sqliteEventStore({
      exec: sqlStorageExec(ctx.storage.sql, {
        transaction: (fn) => ctx.storage.transactionSync(fn),
      }),
    })

    return Effect.runPromise(store.read(runId)).then((existing) => {
      if (existing.length > 0) {
        return Response.json({ runId, seeded: false })
      }

      return Effect.runPromise(store.append(runId, events)).then(() =>
        Response.json({ runId, seeded: true, events: events.length }),
      )
    })
  })
}

function postDesk(env: Env, path: string, body: JsonValue): Promise<JsonValue> {
  return env.DESK.getByName('board')
    .fetch(
      new Request(`https://meridian.internal${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    )
    .then((response) => response.text())
    .then(decodeJson)
}

function getDesk(env: Env, path: string): Promise<JsonValue> {
  return env.DESK.getByName('board')
    .fetch(new Request(`https://meridian.internal${path}`))
    .then((response) => response.text())
    .then(decodeJson)
}

function decodeJson(text: string): JsonValue {
  if (!text) {
    return null
  }

  try {
    return asJson(JSON.parse(text))
  } catch {
    return null
  }
}

function runIdOf(value: JsonValue): string | undefined {
  if (!isJsonObject(value)) {
    return undefined
  }

  if (isJsonString(value.runId)) {
    return value.runId
  }

  if (isJsonObject(value.session) && isJsonString(value.session.runId)) {
    return value.session.runId
  }

  return undefined
}

function reasonOf(value: JsonValue): string {
  if (!isJsonObject(value)) {
    return ''
  }

  if (isJsonString(value.reason)) {
    return value.reason
  }

  if (isJsonString(value.error)) {
    return value.error
  }

  return ''
}

function textField(value: JsonValue, key: string): string {
  if (!isJsonObject(value)) {
    return ''
  }

  const field = value[key]
  return isJsonString(field) ? field : ''
}

function numberField(value: JsonValue, key: string): number {
  if (!isJsonObject(value)) {
    return 0
  }

  const field = value[key]
  return isJsonNumber(field) ? field : 0
}
