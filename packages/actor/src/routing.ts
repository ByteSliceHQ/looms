import { Option, Schema } from 'effect'

import { createRunId, isJsonObject, type JsonValue } from '@looms/core'

const RunTargetBodySchema = Schema.Struct({
  runId: Schema.optional(Schema.NonEmptyString),
})

const decodeRunTargetBody = Schema.decodeUnknownOption(Schema.fromJsonString(RunTargetBodySchema))

const decodePayloadRecord = Schema.decodeUnknownOption(
  Schema.fromJsonString(Schema.Record(Schema.String, Schema.Json)),
)

/**
 * Extracts the target `runId` from a Looms HTTP request.
 * Inspects `x-looms-run-id`, `/runs/:runId/*`, and `/api/livestore?storeId=*`.
 */
export function runIdFromRequest(req: Request): string | null {
  const header = req.headers.get('x-looms-run-id')

  if (header) {
    return header
  }

  const url = new URL(req.url)
  const path = url.pathname

  const runsMatch = path.match(/^\/runs\/([^/]+)(?:\/.*)?$/)

  if (runsMatch && runsMatch[1]) {
    return decodeURIComponent(runsMatch[1])
  }

  if (path.startsWith('/api/livestore')) {
    const storeId = url.searchParams.get('storeId') ?? url.searchParams.get('runId')

    if (storeId) {
      return storeId
    }
  }

  return null
}

export interface ResolvedRunTarget {
  readonly runId: string
  readonly request: Request
}

/**
 * Resolves the destination `runId` for routing to an actor cell.
 * For `POST /runs` without a `runId`, creates a fresh `runId`, injects it
 * into the body, and sets `x-looms-run-id`.
 */
export async function resolveRunTarget(req: Request): Promise<ResolvedRunTarget> {
  const existing = runIdFromRequest(req)

  if (existing) {
    if (req.headers.get('x-looms-run-id') === existing) {
      return { runId: existing, request: req }
    }

    const headers = new Headers(req.headers)
    headers.set('x-looms-run-id', existing)

    const request = new Request(req.url, {
      method: req.method,
      headers,
      body: req.body,
      // SAFETY: duplex 'half' is required when streaming request body in standard Fetch.
      // @ts-expect-error duplex is supported in modern runtimes
      duplex: req.body ? 'half' : undefined,
    })

    return { runId: existing, request }
  }

  const url = new URL(req.url)

  if (req.method === 'POST' && url.pathname === '/runs') {
    const text = await req.clone().text()
    const decoded = decodeRunTargetBody(text)

    let runId: string

    if (Option.isSome(decoded) && decoded.value.runId) {
      runId = decoded.value.runId
    } else {
      runId = createRunId()
    }

    const decodedRecord = decodePayloadRecord(text)

    const payloadObj: Record<string, JsonValue> =
      Option.isSome(decodedRecord) && isJsonObject(decodedRecord.value)
        ? { ...decodedRecord.value, runId }
        : { runId }

    const headers = new Headers(req.headers)
    headers.set('x-looms-run-id', runId)
    headers.set('content-type', 'application/json')

    const request = new Request(req.url, {
      method: req.method,
      headers,
      body: JSON.stringify(payloadObj),
    })

    return { runId, request }
  }

  throw new Error(`Cannot resolve runId from request: ${req.method} ${url.pathname}`)
}
