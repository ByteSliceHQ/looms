#!/usr/bin/env bun
/**
 * Shared helpers for Looms demo playbooks.
 *
 * Usage (with demo running on :8787):
 *   bun run scripts/playbooks/01-agents.ts
 */

import { Predicate, Schema } from 'effect'

export const LOOMS_URL = (process.env.LOOMS_URL ?? 'http://127.0.0.1:8787').replace(/\/$/, '')

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

const JsonValueSchema = Schema.MutableJson

export function log(step: string, detail?: JsonValue) {
  const prefix = `\n▸ ${step}`
  if (detail === undefined) {
    console.log(prefix)
    return
  }
  console.log(prefix)
  console.log(Predicate.isString(detail) ? detail : JSON.stringify(detail, null, 2))
}

export type StartResult = {
  actorId: string
  state: {
    status: string
    output?: JsonValue
    error?: string
    reviews?: Record<string, { reviewId: string; status: string; title?: string }>
    children?: Record<string, { status: string; definitionName?: string }>
    messages?: Array<{ role: string; content: string }>
  }
}

const StartResultSchema = Schema.Struct({
  actorId: Schema.String,
  state: Schema.Struct({
    status: Schema.String,
    output: Schema.optional(JsonValueSchema),
    error: Schema.optional(Schema.String),
    reviews: Schema.optional(
      Schema.Record(Schema.String, Schema.Struct({
          reviewId: Schema.String,
          status: Schema.String,
          title: Schema.optional(Schema.String),
        }),),
    ),
    children: Schema.optional(
      Schema.Record(Schema.String, Schema.Struct({
          status: Schema.String,
          definitionName: Schema.optional(Schema.String),
        }),),
    ),
    messages: Schema.optional(
      Schema.Array(
        Schema.Struct({
          role: Schema.String,
          content: Schema.String,
        }),
      ),
    ),
  }),
})

async function readResponseBody(res: Response): Promise<JsonValue> {
  const text = await res.text()
  if (!text) return null
  try {
    return Schema.decodeUnknownSync(JsonValueSchema)(JSON.parse(text))
  } catch {
    return text
  }
}

export async function request(path: string, init?: RequestInit): Promise<JsonValue> {
  const headers = new Headers(init?.headers)
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  const res = await fetch(`${LOOMS_URL}${path}`, {
    ...init,
    headers,
  })
  const body = await readResponseBody(res)
  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status} ${path}: ${Predicate.isString(body) ? body : JSON.stringify(body)}`,
    )
  }
  return body
}

function decodeStartResult(body: JsonValue): StartResult {
  return Schema.decodeUnknownSync(StartResultSchema)(body)
}

export async function ensureHost() {
  try {
    const health = Schema.decodeUnknownSync(
      Schema.Struct({ ok: Schema.optional(Schema.Boolean) }),
    )(await request('/health'))
    if (!health.ok) throw new Error('health not ok')
  } catch (err) {
    console.error(`Looms host not reachable at ${LOOMS_URL}`)
    console.error('Start it with: bun run demo')
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

export async function startAgent(name: string, input: JsonValue): Promise<StartResult> {
  return decodeStartResult(
    await request('/actors/agent', {
      method: 'POST',
      body: JSON.stringify({ definitionName: name, input }),
    }),
  )
}

export async function startWorkflow(name: string, input: JsonValue): Promise<StartResult> {
  return decodeStartResult(
    await request('/actors/workflow', {
      method: 'POST',
      body: JSON.stringify({ definitionName: name, input }),
    }),
  )
}

export async function decideReview(
  actorId: string,
  reviewId: string,
  outcome: 'approve' | 'reject',
): Promise<StartResult> {
  return decodeStartResult(
    await request(
      `/actors/${encodeURIComponent(actorId)}/reviews/${encodeURIComponent(reviewId)}/decide`,
      {
        method: 'POST',
        body: JSON.stringify({ actionId: outcome, outcome }),
      },
    ),
  )
}

export async function getEvents(actorId: string) {
  return Schema.decodeUnknownSync(
    Schema.Struct({
      events: Schema.Array(Schema.Struct({ seq: Schema.Number, type: Schema.String })),
    }),
  )(await request(`/actors/${encodeURIComponent(actorId)}/events`))
}

export async function pullLivestore(actorId: string, cursor = 0) {
  return Schema.decodeUnknownSync(
    Schema.Struct({
      cursor: Schema.Number,
      batch: Schema.Array(JsonValueSchema),
    }),
  )(
    await request(
      `/api/livestore?storeId=${encodeURIComponent(actorId)}&cursor=${cursor}`,
    ),
  )
}

export async function requestStartResult(path: string, init?: RequestInit): Promise<StartResult> {
  return decodeStartResult(await request(path, init))
}

export function firstPendingReview(state: StartResult['state']): string | undefined {
  return Object.values(state.reviews ?? {}).find((r) => r.status === 'pending')?.reviewId
}
