import { DeskOverview, RunRef, SessionDetail, type StartSessionInput } from '@looms/meridian/http'
import { asJson, isJsonObject, isJsonString, type JsonValue } from '@swirls/looms/core'

function request(path: string, init?: RequestInit): Promise<Response> {
  return fetch(path, init).then((response) => {
    if (response.ok) {
      return response
    }

    return response.text().then((text) => {
      let message = text.trim() || `Request failed (${response.status})`

      try {
        const body = asJson(JSON.parse(text))

        if (isJsonObject(body) && isJsonString(body.error) && body.error.length > 0) {
          message = body.error
        }
      } catch {
        message = text.trim() || message
      }

      throw new Error(message)
    })
  })
}

function jsonInit(body: { readonly [key: string]: JsonValue | undefined }): RequestInit {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }
}

function readBody(response: Response): Promise<JsonValue> {
  return response.text().then((text) => {
    if (!text) {
      return null
    }

    return asJson(JSON.parse(text))
  })
}

export function fetchDesk() {
  return request('/api/desk').then((response) =>
    readBody(response).then((body) => DeskOverview.parse(body)),
  )
}

export function fetchSession(runId: string) {
  return request(`/api/sessions/${encodeURIComponent(runId)}`).then((response) =>
    readBody(response).then((body) => SessionDetail.parse(body)),
  )
}

export function startSession(input: StartSessionInput) {
  return request('/api/sessions', jsonInit(input)).then((response) =>
    readBody(response).then((body) => RunRef.parse(body)),
  )
}

export function haltSession(runId: string) {
  return request(`/api/sessions/${encodeURIComponent(runId)}/halt`, jsonInit({}))
}

export function resumeSession(runId: string) {
  return request(`/api/sessions/${encodeURIComponent(runId)}/resume`, jsonInit({})).then(
    (response) => readBody(response).then((body) => RunRef.parse(body)),
  )
}

export function decideApproval(runId: string, approvalId: string, outcome: 'approve' | 'reject') {
  return request(
    `/api/sessions/${encodeURIComponent(runId)}/approve`,
    jsonInit({ approvalId, outcome }),
  )
}

export function setKill(killed: boolean) {
  return request('/api/kill', jsonInit({ killed }))
}

export function postAnalyst(text: string) {
  return request('/api/analyst/messages', jsonInit({ text })).then((response) =>
    readBody(response).then((body) => RunRef.parse(body)),
  )
}

export function startOpen() {
  return request('/api/open', jsonInit({})).then((response) =>
    readBody(response).then((body) => RunRef.parse(body)),
  )
}

export function startEod() {
  return request('/api/eod', jsonInit({})).then((response) =>
    readBody(response).then((body) => RunRef.parse(body)),
  )
}

export function replayTo(runId: string, seq: number) {
  return request(`/runs/${encodeURIComponent(runId)}/replay?seq=${seq}`).then((response) =>
    response.text(),
  )
}
