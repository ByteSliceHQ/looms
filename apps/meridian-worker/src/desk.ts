import { DurableObject } from 'cloudflare:workers'
import { Effect, Schema } from 'effect'
import { z } from 'zod'

import {
  admitVenue,
  analyst,
  DeskOverview,
  END_OF_DAY_RUN_ID,
  eodRecon,
  MARKET_OPEN_RUN_ID,
  openBook,
  sessionLot,
  SIM_LIMITS,
  StartSessionInput,
  tickAt,
  tradeSession,
  type ApprovalRecord,
  type OrderRecord,
  type SessionRecord,
} from '@looms/meridian'
import {
  SessionRecord as SessionRow,
  OrderRecord as OrderRow,
  ApprovalRecord as ApprovalRow,
} from '@looms/meridian/http'
import { userMessage } from '@swirls/looms/agent'
import { decision } from '@swirls/looms/approval'
import {
  asJson,
  composeModules,
  createRunId,
  EventEnvelopeSchema,
  isJsonNumber,
  isJsonObject,
  isJsonString,
  planFork,
  type JsonValue,
} from '@swirls/looms/core'

import { liveCap, liveConfigured, liveEnabled, type Env } from './env'
import { modulesFor } from './host'
import { replicaView, writeKilled } from './replica'
import { applyDeskMutations, projectDesk } from './status'

const ANALYST = 'analyst'
const KillInput = z.object({ killed: z.boolean() })

const ApproveInput = z.object({
  approvalId: z.string(),
  outcome: z.enum(['approve', 'reject']),
})

const AnalystMessage = z.object({ text: z.string().trim().min(1) })
const EventsPage = Schema.Struct({ events: Schema.Array(EventEnvelopeSchema) })
const RunView = z.object({ state: z.object({ status: z.string() }) })

export class DeskBoard extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)

    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL UNIQUE,
        symbol TEXT NOT NULL,
        strategy TEXT NOT NULL,
        venue TEXT NOT NULL,
        status TEXT NOT NULL,
        opened_at INTEGER NOT NULL,
        position REAL NOT NULL,
        realized_pnl REAL NOT NULL,
        parent_run_id TEXT
      )`,
    )

    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL,
        qty REAL NOT NULL,
        price REAL NOT NULL,
        status TEXT NOT NULL,
        slippage_bps REAL NOT NULL,
        venue TEXT NOT NULL,
        ts INTEGER NOT NULL
      )`,
    )

    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS approvals (
        approval_id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL
      )`,
    )

    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS flags (name TEXT PRIMARY KEY, value TEXT NOT NULL)`,
    )

    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS analyst (id TEXT PRIMARY KEY, run_id TEXT NOT NULL)`,
    )

    this.ctx.storage.sql.exec(`INSERT OR IGNORE INTO flags (name, value) VALUES ('killed', '0')`)
  }

  override fetch(request: Request): Promise<Response> {
    return route(this.ctx.storage.sql, this.env, request).catch((cause) =>
      problem(cause instanceof Error ? cause.message : 'The desk failed', 500),
    )
  }
}

function route(sql: SqlStorage, env: Env, request: Request): Promise<Response> {
  const { pathname } = new URL(request.url)

  if (request.method === 'GET' && pathname === '/api/desk') {
    return Promise.resolve(Response.json(overview(sql, env)))
  }

  if (request.method === 'POST' && pathname === '/api/sessions') {
    return startSession(sql, env, request)
  }

  if (request.method === 'POST' && pathname === '/api/kill') {
    return setKill(sql, env, request)
  }

  if (request.method === 'POST' && pathname === '/api/analyst/messages') {
    return postAnalyst(sql, env, request)
  }

  if (request.method === 'POST' && pathname === '/api/open') {
    return startFixed(env, openBook, { at: tickAt(Date.now()) })
  }

  if (request.method === 'POST' && pathname === '/api/eod') {
    return startFixed(env, eodRecon, { at: Date.now() })
  }

  if (request.method === 'POST' && pathname === '/internal/project') {
    return project(sql, request)
  }

  const match = /^\/api\/sessions\/([^/]+)(?:\/(halt|resume|approve))?$/.exec(pathname)
  const sessionId = match?.[1] ? decodeURIComponent(match[1]) : undefined
  const action = match?.[2]

  if (!sessionId) {
    return Promise.resolve(problem('Not found', 404))
  }

  if (request.method === 'GET' && !action) {
    return readSession(sql, env, sessionId)
  }

  if (request.method === 'POST' && action === 'halt') {
    return haltSession(sql, env, sessionId)
  }

  if (request.method === 'POST' && action === 'resume') {
    return resumeSession(sql, env, sessionId)
  }

  if (request.method === 'POST' && action === 'approve') {
    return approveSession(env, sessionId, request)
  }

  return Promise.resolve(problem('Not found', 404))
}

function overview(sql: SqlStorage, env: Env) {
  const sessions = listSessions(sql)
  const orders = listOrders(sql)
  const approvals = listApprovals(sql)
  const position = sessions.reduce((sum, session) => sum + session.position, 0)
  const realizedPnl = sessions.reduce((sum, session) => sum + session.realizedPnl, 0)
  const latest = orders[0]

  return DeskOverview.parse({
    killed: flag(sql, 'killed') === '1',
    live: liveEnabled(env) && liveConfigured(env),
    maxOrderUsd: liveCap(env.MERIDIAN_LIVE_MAX_ORDER_USD, SIM_LIMITS.maxOrderUsd),
    maxDayUsd: liveCap(env.MERIDIAN_LIVE_MAX_DAY_USD, SIM_LIMITS.maxDayUsd),
    sessions,
    orders,
    approvals,
    analystRunId: analystRunId(sql),
    openRunId: MARKET_OPEN_RUN_ID,
    eodRunId: END_OF_DAY_RUN_ID,
    position,
    realizedPnl,
    openOrders: orders.filter((order) => order.status === 'working').length,
    lastOrder: latest
      ? `${latest.side} ${latest.qty} ${latest.symbol} @ ${latest.price} (${latest.status})`
      : 'none',
  })
}

function startSession(sql: SqlStorage, env: Env, request: Request): Promise<Response> {
  return readJson(request).then((value) => {
    const parsed = StartSessionInput.safeParse(value)

    if (!parsed.success) {
      return problem('Name a symbol, strategy, venue, and how many cycles.', 400)
    }

    if (flag(sql, 'killed') === '1') {
      return problem('The kill switch is on.', 409)
    }

    const admission = admitVenue({
      symbol: parsed.data.symbol,
      venue: parsed.data.venue,
      intervalMs: parsed.data.intervalMs,
      liveEnabled: liveEnabled(env),
      configured: liveConfigured(env),
    })

    if (!admission.ok) {
      return problem(admission.reason, 409)
    }

    const baseLimits = parsed.data.limits ?? SIM_LIMITS

    const limits =
      parsed.data.venue === 'robinhood'
        ? {
            ...baseLimits,
            maxOrderUsd: liveCap(env.MERIDIAN_LIVE_MAX_ORDER_USD, 25),
            maxDayUsd: liveCap(env.MERIDIAN_LIVE_MAX_DAY_USD, 100),
          }
        : baseLimits

    const runId = createRunId()

    insertSession(sql, {
      id: runId,
      runId,
      symbol: parsed.data.symbol,
      strategy: parsed.data.strategy,
      venue: parsed.data.venue,
      status: 'running',
      openedAt: Date.now(),
      position: 0,
      realizedPnl: 0,
      parentRunId: null,
    })

    return callRun(env, runId, 'POST', '/runs', {
      runId,
      kind: tradeSession.kind,
      definitionName: tradeSession.name,
      definitionVersion: tradeSession.version,
      input: {
        symbol: parsed.data.symbol,
        strategy: parsed.data.strategy,
        venue: parsed.data.venue,
        cycles: parsed.data.cycles,
        intervalMs: parsed.data.intervalMs,
        seedTick: tickAt(Date.now()),
        limits,
        lot: sessionLot(parsed.data.symbol),
      },
      attributes: { desk: 'meridian' },
      idempotencyKey: runId,
    }).then((response) => {
      if (!response.ok) {
        sql.exec('DELETE FROM sessions WHERE id = ?', runId)
        return errorResponse(response)
      }

      const record = findSession(sql, runId)
      return record
        ? Response.json({ runId, session: record })
        : problem('The session was not saved.', 500)
    })
  })
}

function haltSession(sql: SqlStorage, env: Env, runId: string): Promise<Response> {
  const record = findSession(sql, runId)

  if (!record) {
    return Promise.resolve(problem('That session is not on the desk.', 404))
  }

  return callRun(env, runId, 'POST', `/runs/${encodeURIComponent(runId)}/cancel`, {}).then(
    (response) => {
      if (!response.ok) {
        return errorResponse(response)
      }

      sql.exec(
        `UPDATE sessions SET status = 'cancelled' WHERE run_id = ? AND status IN ('running', 'waiting')`,
        runId,
      )

      return Response.json({ halted: true, reason: 'cancelled', runId })
    },
  )
}

function resumeSession(sql: SqlStorage, env: Env, sourceId: string): Promise<Response> {
  const source = findSession(sql, sourceId)

  if (!source) {
    return Promise.resolve(problem('That session is not on the desk.', 404))
  }

  if (flag(sql, 'killed') === '1') {
    return Promise.resolve(problem('The kill switch is on.', 409))
  }

  return haltIfRunning(sql, env, source).then(() =>
    readEvents(env, source.runId).then((events) => {
      const runId = createRunId()

      return Effect.runPromise(
        planFork({
          sourceRunId: source.runId,
          runId,
          events,
          registry: composeModules([...modulesFor(env)]),
        }),
      ).then((plan) => {
        insertSession(sql, {
          ...source,
          id: runId,
          runId,
          status: 'running',
          openedAt: Date.now(),
          parentRunId: source.runId,
        })

        return callRun(env, runId, 'POST', '/internal/fork-seed', { events: plan.events }).then(
          (seeded) => {
            if (!seeded.ok) {
              sql.exec('DELETE FROM sessions WHERE id = ?', runId)
              return errorResponse(seeded)
            }

            return callRun(env, runId, 'POST', `/runs/${encodeURIComponent(runId)}/wake`, {}).then(
              (woke) => {
                if (!woke.ok) {
                  return errorResponse(woke)
                }

                const record = findSession(sql, runId)
                return record
                  ? Response.json({ runId, session: record })
                  : problem('The resumed session was not saved.', 500)
              },
            )
          },
        )
      })
    }),
  )
}

function approveSession(env: Env, runId: string, request: Request): Promise<Response> {
  return readJson(request).then((value) => {
    const parsed = ApproveInput.safeParse(value)

    if (!parsed.success) {
      return problem('Name the approval and the decision.', 400)
    }

    return callRun(env, runId, 'POST', `/runs/${encodeURIComponent(runId)}/events`, {
      events: [decision(parsed.data.approvalId, parsed.data.outcome)],
    }).then((response) => (response.ok ? Response.json({ ok: true }) : errorResponse(response)))
  })
}

function setKill(sql: SqlStorage, env: Env, request: Request): Promise<Response> {
  return readJson(request).then((value) => {
    const parsed = KillInput.safeParse(value)

    if (!parsed.success) {
      return problem('Say whether the kill switch is on.', 400)
    }

    return writeKilled(env, parsed.data.killed).then(() => {
      sql.exec(
        `INSERT INTO flags (name, value) VALUES ('killed', ?)
         ON CONFLICT(name) DO UPDATE SET value = excluded.value`,
        parsed.data.killed ? '1' : '0',
      )

      return Response.json({ killed: parsed.data.killed })
    })
  })
}

function postAnalyst(sql: SqlStorage, env: Env, request: Request): Promise<Response> {
  return readJson(request).then((value) => {
    const parsed = AnalystMessage.safeParse(value)

    if (!parsed.success) {
      return problem('Write a message first.', 400)
    }

    const existing = analystRunId(sql)

    if (existing) {
      return callRun(env, existing, 'POST', `/runs/${encodeURIComponent(existing)}/events`, {
        events: [userMessage(parsed.data.text)],
      }).then((response) =>
        response.ok ? Response.json({ runId: existing }) : errorResponse(response),
      )
    }

    const runId = createRunId()

    return callRun(env, runId, 'POST', '/runs', {
      runId,
      kind: analyst.kind,
      definitionName: analyst.name,
      definitionVersion: analyst.version,
      input: parsed.data.text,
      attributes: { desk: 'meridian' },
      idempotencyKey: runId,
    }).then((response) => {
      if (!response.ok) {
        return errorResponse(response)
      }

      sql.exec('INSERT INTO analyst (id, run_id) VALUES (?, ?)', ANALYST, runId)
      return Response.json({ runId })
    })
  })
}

function startFixed(
  env: Env,
  definition: { kind: string; name: string; version: string },
  input: JsonValue,
): Promise<Response> {
  const runId = createRunId()

  return callRun(env, runId, 'POST', '/runs', {
    runId,
    kind: definition.kind,
    definitionName: definition.name,
    definitionVersion: definition.version,
    input,
    attributes: { desk: 'meridian' },
    idempotencyKey: runId,
  }).then((response) => (response.ok ? Response.json({ runId }) : errorResponse(response)))
}

function project(sql: SqlStorage, request: Request): Promise<Response> {
  return readJson(request).then((value) => {
    if (
      !isJsonObject(value) ||
      !isJsonString(value.runId) ||
      !isJsonString(value.type) ||
      !isJsonNumber(value.ts)
    ) {
      return problem('The desk update was unreadable.', 400)
    }

    applyDeskMutations(
      sql,
      projectDesk({
        runId: value.runId,
        type: value.type,
        ts: value.ts,
        payload: value.payload ?? null,
      }),
    )

    return Response.json({ ok: true })
  })
}

function readSession(sql: SqlStorage, env: Env, id: string): Promise<Response> {
  const record = findSession(sql, id)

  if (!record) {
    return Promise.resolve(problem('That session is not on the desk.', 404))
  }

  return replicaView(env, record.runId).then((replica) =>
    Response.json({ session: record, replica }),
  )
}

function haltIfRunning(sql: SqlStorage, env: Env, source: SessionRecord): Promise<void> {
  if (source.status !== 'running' && source.status !== 'waiting') {
    return Promise.resolve()
  }

  return haltSession(sql, env, source.runId).then(() => waitUntilTerminal(env, source.runId))
}

function waitUntilTerminal(env: Env, runId: string, left = 20): Promise<void> {
  return callRun(env, runId, 'GET', `/runs/${encodeURIComponent(runId)}`).then((response) =>
    response.text().then((text) => {
      const parsed = RunView.safeParse(decodeJson(text))
      const status = parsed.success ? parsed.data.state.status : ''

      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        return undefined
      }

      if (left <= 0) {
        throw new Error('The session did not stop')
      }

      return Effect.runPromise(Effect.sleep(50)).then(() => waitUntilTerminal(env, runId, left - 1))
    }),
  )
}

function readEvents(env: Env, runId: string) {
  return callRun(env, runId, 'GET', `/runs/${encodeURIComponent(runId)}/events`).then((response) =>
    response.text().then((text) => {
      if (!response.ok) {
        throw new Error('The session log could not be read')
      }

      return Schema.decodeSync(Schema.fromJsonString(EventsPage))(text).events
    }),
  )
}

function callRun(
  env: Env,
  runId: string,
  method: string,
  path: string,
  body?: JsonValue,
): Promise<Response> {
  return env.LOOMS_RUN.getByName(runId).fetch(
    new Request(`https://meridian.internal${path}`, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  )
}

function insertSession(sql: SqlStorage, record: SessionRecord): void {
  const parsed = SessionRow.parse(record)

  sql.exec(
    `INSERT INTO sessions (
      id, run_id, symbol, strategy, venue, status, opened_at, position, realized_pnl, parent_run_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    parsed.id,
    parsed.runId,
    parsed.symbol,
    parsed.strategy,
    parsed.venue,
    parsed.status,
    parsed.openedAt,
    parsed.position,
    parsed.realizedPnl,
    parsed.parentRunId,
  )
}

function listSessions(sql: SqlStorage): SessionRecord[] {
  return sql
    .exec(
      `SELECT id, run_id, symbol, strategy, venue, status, opened_at, position, realized_pnl, parent_run_id
       FROM sessions ORDER BY opened_at DESC`,
    )
    .toArray()
    .map(toSession)
}

function findSession(sql: SqlStorage, id: string): SessionRecord | undefined {
  const row = sql
    .exec(
      `SELECT id, run_id, symbol, strategy, venue, status, opened_at, position, realized_pnl, parent_run_id
       FROM sessions WHERE id = ?`,
      id,
    )
    .toArray()[0]

  return row ? toSession(row) : undefined
}

function listOrders(sql: SqlStorage): OrderRecord[] {
  return sql
    .exec(
      `SELECT id, run_id, symbol, side, qty, price, status, slippage_bps, venue, ts
       FROM orders ORDER BY ts DESC`,
    )
    .toArray()
    .map(toOrder)
}

function listApprovals(sql: SqlStorage): ApprovalRecord[] {
  return sql
    .exec(
      'SELECT approval_id, run_id, title, description, status FROM approvals ORDER BY rowid DESC',
    )
    .toArray()
    .map(toApproval)
}

function toSession(row: Record<string, SqlStorageValue>): SessionRecord {
  const parsed = SessionRow.safeParse({
    id: row.id,
    runId: row.run_id,
    symbol: row.symbol,
    strategy: row.strategy,
    venue: row.venue,
    status: row.status,
    openedAt: row.opened_at,
    position: row.position,
    realizedPnl: row.realized_pnl,
    parentRunId: row.parent_run_id,
  })

  if (!parsed.success) {
    throw new Error('A session on the desk could not be read')
  }

  return parsed.data
}

function toOrder(row: Record<string, SqlStorageValue>): OrderRecord {
  const parsed = OrderRow.safeParse({
    id: row.id,
    runId: row.run_id,
    symbol: row.symbol,
    side: row.side,
    qty: row.qty,
    price: row.price,
    status: row.status,
    slippageBps: row.slippage_bps,
    venue: row.venue,
    ts: row.ts,
  })

  if (!parsed.success) {
    throw new Error('An order on the desk could not be read')
  }

  return parsed.data
}

function toApproval(row: Record<string, SqlStorageValue>): ApprovalRecord {
  const parsed = ApprovalRow.safeParse({
    approvalId: row.approval_id,
    runId: row.run_id,
    title: row.title,
    description: row.description,
    status: row.status,
  })

  if (!parsed.success) {
    throw new Error('An approval on the desk could not be read')
  }

  return parsed.data
}

function flag(sql: SqlStorage, name: string): string {
  const row = sql.exec('SELECT value FROM flags WHERE name = ?', name).toArray()[0]
  return row && isJsonString(row.value) ? row.value : '0'
}

function analystRunId(sql: SqlStorage): string | null {
  const row = sql.exec('SELECT run_id FROM analyst WHERE id = ?', ANALYST).toArray()[0]
  return row && isJsonString(row.run_id) ? row.run_id : null
}

function readJson(request: Request): Promise<JsonValue | undefined> {
  return request.text().then((text) => decodeJson(text))
}

function decodeJson(text: string): JsonValue | undefined {
  if (!text) {
    return undefined
  }

  try {
    return asJson(JSON.parse(text))
  } catch {
    return undefined
  }
}

function errorResponse(response: Response): Promise<Response> {
  return response.text().then((text) => {
    const decoded = decodeJson(text)

    const message =
      isJsonObject(decoded) && isJsonString(decoded.error) && decoded.error.length > 0
        ? decoded.error
        : text.trim() || `Request failed (${response.status})`

    const status = response.status >= 400 && response.status < 500 ? response.status : 502
    return problem(message, status)
  })
}

function problem(error: string, status: number): Response {
  return Response.json({ error }, { status })
}
