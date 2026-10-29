import { Data } from 'effect'

import {
  CaseList,
  CaseResponse,
  DeskMessageResult,
  DeskSession,
  OpenCaseInput,
  ShipmentList,
  SweepInfo,
  type CaseRecord,
  type DeskMessageInput,
  type DigestRunInput,
} from '@looms/northline/http'
import { asJson, isJsonObject, isJsonString, type JsonValue } from '@swirls/looms/core'

export class DeskRequestError extends Data.TaggedError('DeskRequestError')<{
  readonly status: number
  readonly message: string
}> {}

export function fetchShipments() {
  return read(ShipmentList, '/api/shipments')
}

export function fetchCases() {
  return read(CaseList, '/api/cases')
}

export function fetchCase(id: string) {
  return read(CaseResponse, `/api/cases/${encodeURIComponent(id)}`)
}

export function fetchDesk() {
  return read(DeskSession, '/api/desk')
}

export function fetchSweep() {
  return read(SweepInfo, '/api/sweep')
}

export function openCase(input: OpenCaseInput): Promise<CaseRecord> {
  return write(CaseResponse, '/api/cases', asJson(OpenCaseInput.parse(input))).then(
    (body) => body.case,
  )
}

export function postMessage(input: DeskMessageInput) {
  return write(DeskMessageResult, '/api/desk/messages', asJson({ text: input.text }))
}

export function startDigest(input: DigestRunInput) {
  return write(SweepInfo, '/api/digests', asJson({ at: input.at }))
}

interface Parser<T> {
  parse(value: JsonValue | undefined): T
}

function read<T>(schema: Parser<T>, path: string): Promise<T> {
  return fetch(path).then((response) => decode(schema, response))
}

function write<T>(schema: Parser<T>, path: string, body: JsonValue): Promise<T> {
  return fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then((response) => decode(schema, response))
}

function decode<T>(schema: Parser<T>, response: Response): Promise<T> {
  return response.text().then((text) => {
    if (!response.ok) {
      throw new DeskRequestError({
        status: response.status,
        message: messageFrom(text, response.status),
      })
    }

    return schema.parse(parseJson(text))
  })
}

function parseJson(text: string): JsonValue | undefined {
  if (!text) {
    return undefined
  }

  try {
    return asJson(JSON.parse(text))
  } catch {
    return undefined
  }
}

function messageFrom(text: string, status: number): string {
  const decoded = parseJson(text)

  if (isJsonObject(decoded) && isJsonString(decoded.error) && decoded.error.length > 0) {
    return decoded.error
  }

  const trimmed = text.trim()
  return trimmed || `Request failed (${status})`
}
