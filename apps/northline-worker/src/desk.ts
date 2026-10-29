import { DurableObject } from 'cloudflare:workers'

import {
  board,
  dispatcher,
  findShipment,
  laneDigest,
  MORNING_SWEEP_RUN_ID,
  recoverShipment,
} from '@looms/northline'
import {
  CaseList,
  CaseRecord,
  CaseResponse,
  CaseStatusUpdate,
  DeskMessageInput,
  DeskMessageResult,
  DeskSession,
  DigestRunInput,
  OpenCaseInput,
  ShipmentList,
  SweepInfo,
  type CaseRecord as CaseRecordValue,
} from '@looms/northline/http'
import { userMessage } from '@swirls/looms/agent'
import {
  asJson,
  createRunId,
  isJsonNumber,
  isJsonObject,
  isJsonString,
  type JsonValue,
} from '@swirls/looms/core'

import type { Env } from './env'

const DESK_SESSION = 'desk'

export class DeskBoard extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)

    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        shipment_id TEXT NOT NULL,
        pro TEXT NOT NULL,
        consignee TEXT NOT NULL,
        destination TEXT NOT NULL,
        kind TEXT NOT NULL,
        opened_by TEXT NOT NULL,
        run_id TEXT NOT NULL UNIQUE,
        opened_at INTEGER NOT NULL,
        status TEXT NOT NULL
      )`,
    )

    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS desk_session (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL
      )`,
    )
  }

  override fetch(request: Request): Promise<Response> {
    return route(this.ctx.storage.sql, this.env, request).catch((cause) =>
      problem(cause instanceof Error ? cause.message : 'The desk failed', 500),
    )
  }
}

function route(sql: SqlStorage, env: Env, request: Request): Promise<Response> {
  const { pathname } = new URL(request.url)

  if (request.method === 'GET' && pathname === '/api/shipments') {
    return Promise.resolve(Response.json(ShipmentList.parse({ shipments: board })))
  }

  if (request.method === 'GET' && pathname === '/api/cases') {
    return Promise.resolve(Response.json(CaseList.parse({ cases: listCases(sql) })))
  }

  if (request.method === 'POST' && pathname === '/api/cases') {
    return openCase(sql, env, request)
  }

  if (request.method === 'GET' && pathname.startsWith('/api/cases/')) {
    return Promise.resolve(readCaseResponse(sql, pathname.slice('/api/cases/'.length)))
  }

  if (request.method === 'GET' && pathname === '/api/desk') {
    return Promise.resolve(Response.json(DeskSession.parse({ runId: sessionRunId(sql) })))
  }

  if (request.method === 'POST' && pathname === '/api/desk/messages') {
    return postMessage(sql, env, request)
  }

  if (request.method === 'GET' && pathname === '/api/sweep') {
    return Promise.resolve(Response.json(SweepInfo.parse({ runId: MORNING_SWEEP_RUN_ID })))
  }

  if (request.method === 'POST' && pathname === '/api/digests') {
    return startDigest(env, request)
  }

  if (request.method === 'POST' && pathname === '/internal/cases/status') {
    return updateStatus(sql, request)
  }

  return Promise.resolve(problem('Not found', 404))
}

function openCase(sql: SqlStorage, env: Env, request: Request): Promise<Response> {
  return readJson(request).then((value) => {
    const parsed = OpenCaseInput.safeParse(trimFields(value, ['shipmentId', 'openedBy']))

    if (!parsed.success) {
      return problem('Name the shipment and who is opening it.', 400)
    }

    const shipment = findShipment(parsed.data.shipmentId)

    if (!shipment) {
      return problem("That shipment is not on today's board.", 404)
    }

    if (shipment.status === 'delivered') {
      return problem('That shipment is already delivered, so it cannot be booked.', 409)
    }

    const runId = createRunId()

    // The status projector can run before start() returns. The row has to exist
    // first, and the follow-up write must not put status back to "running".
    insertCase(sql, {
      id: runId,
      shipmentId: shipment.shipmentId,
      pro: shipment.pro,
      consignee: shipment.consignee,
      destination: shipment.destination,
      kind: shipment.kind,
      openedBy: parsed.data.openedBy,
      runId,
      openedAt: 0,
      status: 'running',
    })

    return callRun(env, runId, '/runs', {
      runId,
      kind: recoverShipment.kind,
      definitionName: recoverShipment.name,
      definitionVersion: recoverShipment.version,
      input: { shipmentId: shipment.shipmentId, openedBy: parsed.data.openedBy },
      attributes: { tenant: 'northline' },
      idempotencyKey: runId,
    }).then((response) => {
      if (!response.ok) {
        deleteCase(sql, runId)
        return errorResponse(response)
      }

      return response.text().then(() =>
        openedAtFor(env, runId).then((at) => {
          if (at !== undefined) {
            sql.exec('UPDATE cases SET opened_at = ? WHERE id = ?', at, runId)
          }

          const record = findCase(sql, runId)

          if (!record) {
            return problem('The case was not saved.', 500)
          }

          return Response.json(CaseResponse.parse({ case: record }))
        }),
      )
    })
  })
}

function postMessage(sql: SqlStorage, env: Env, request: Request): Promise<Response> {
  return readJson(request).then((value) => {
    const parsed = DeskMessageInput.safeParse(trimFields(value, ['text']))

    if (!parsed.success) {
      return problem('Write a message first.', 400)
    }

    const existing = sessionRunId(sql)

    if (existing) {
      return callRun(env, existing, `/runs/${encodeURIComponent(existing)}/events`, {
        events: [userMessage(parsed.data.text)],
      }).then((response) => {
        if (!response.ok) {
          return errorResponse(response)
        }

        return Response.json(DeskMessageResult.parse({ runId: existing }))
      })
    }

    const runId = createRunId()

    return callRun(env, runId, '/runs', {
      runId,
      kind: dispatcher.kind,
      definitionName: dispatcher.name,
      definitionVersion: dispatcher.version,
      input: parsed.data.text,
      attributes: { tenant: 'northline' },
      idempotencyKey: runId,
    }).then((response) => {
      if (!response.ok) {
        return errorResponse(response)
      }

      sql.exec('INSERT INTO desk_session (id, run_id) VALUES (?, ?)', DESK_SESSION, runId)
      return Response.json(DeskMessageResult.parse({ runId }))
    })
  })
}

function startDigest(env: Env, request: Request): Promise<Response> {
  return readJson(request).then((value) => {
    const parsed = DigestRunInput.safeParse(value)

    if (!parsed.success) {
      return problem('A digest needs a timestamp.', 400)
    }

    const runId = createRunId()

    return callRun(env, runId, '/runs', {
      runId,
      kind: laneDigest.kind,
      definitionName: laneDigest.name,
      definitionVersion: laneDigest.version,
      input: { at: parsed.data.at },
      attributes: { tenant: 'northline' },
      idempotencyKey: runId,
    }).then((response) => {
      if (!response.ok) {
        return errorResponse(response)
      }

      return Response.json(SweepInfo.parse({ runId }))
    })
  })
}

function updateStatus(sql: SqlStorage, request: Request): Promise<Response> {
  return readJson(request).then((value) => {
    const parsed = CaseStatusUpdate.safeParse(value)

    if (!parsed.success) {
      return problem('The status update was unreadable.', 400)
    }

    sql.exec('UPDATE cases SET status = ? WHERE run_id = ?', parsed.data.status, parsed.data.runId)
    return Response.json({ ok: true })
  })
}

function callRun(env: Env, runId: string, path: string, body: JsonValue): Promise<Response> {
  return env.LOOMS_RUN.getByName(runId).fetch(
    new Request(`https://northline.internal${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}

function insertCase(sql: SqlStorage, record: CaseRecordValue): void {
  const parsed = CaseRecord.parse(record)

  sql.exec(
    `INSERT INTO cases (
      id, shipment_id, pro, consignee, destination, kind, opened_by, run_id, opened_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    parsed.id,
    parsed.shipmentId,
    parsed.pro,
    parsed.consignee,
    parsed.destination,
    parsed.kind,
    parsed.openedBy,
    parsed.runId,
    parsed.openedAt,
    parsed.status,
  )
}

function deleteCase(sql: SqlStorage, id: string): void {
  sql.exec('DELETE FROM cases WHERE id = ?', id)
}

function listCases(sql: SqlStorage): CaseRecordValue[] {
  return sql
    .exec(
      `SELECT id, shipment_id, pro, consignee, destination, kind, opened_by, run_id, opened_at, status
       FROM cases ORDER BY opened_at DESC`,
    )
    .toArray()
    .map(toCase)
}

function findCase(sql: SqlStorage, id: string): CaseRecordValue | undefined {
  const row = sql
    .exec(
      `SELECT id, shipment_id, pro, consignee, destination, kind, opened_by, run_id, opened_at, status
       FROM cases WHERE id = ?`,
      id,
    )
    .toArray()[0]

  return row ? toCase(row) : undefined
}

function readCaseResponse(sql: SqlStorage, rawId: string): Response {
  const id = decodeURIComponent(rawId)

  if (!id || id.includes('/')) {
    return problem('Not found', 404)
  }

  const record = findCase(sql, id)
  return record
    ? Response.json(CaseResponse.parse({ case: record }))
    : problem('That case is not on the board.', 404)
}

function sessionRunId(sql: SqlStorage): string | null {
  const row = sql.exec('SELECT run_id FROM desk_session WHERE id = ?', DESK_SESSION).toArray()[0]

  if (!row || !isJsonString(row.run_id)) {
    return null
  }

  return row.run_id
}

function toCase(row: Record<string, SqlStorageValue>): CaseRecordValue {
  const parsed = CaseRecord.safeParse({
    id: row.id,
    shipmentId: row.shipment_id,
    pro: row.pro,
    consignee: row.consignee,
    destination: row.destination,
    kind: row.kind,
    openedBy: row.opened_by,
    runId: row.run_id,
    openedAt: row.opened_at,
    status: row.status,
  })

  if (!parsed.success) {
    throw new Error('A case on the board could not be read')
  }

  return parsed.data
}

function readJson(request: Request): Promise<JsonValue | undefined> {
  return request.text().then(decodeJson)
}

function openedAtFor(env: Env, runId: string): Promise<number | undefined> {
  return env.LOOMS_RUN.getByName(runId)
    .fetch(
      new Request(`https://northline.internal/runs/${encodeURIComponent(runId)}/events?limit=1`),
    )
    .then((response) => response.text())
    .then((text) => {
      const body = decodeJson(text)

      if (!isJsonObject(body) || !Array.isArray(body.events)) {
        return undefined
      }

      const first = body.events[0]
      return isJsonObject(first) && isJsonNumber(first.ts) ? first.ts : undefined
    })
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

function trimFields(value: JsonValue | undefined, keys: readonly string[]): JsonValue | undefined {
  if (!isJsonObject(value)) {
    return value
  }

  const next = { ...value }

  for (const key of keys) {
    const field = next[key]

    if (isJsonString(field)) {
      next[key] = field.trim()
    }
  }

  return next
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
