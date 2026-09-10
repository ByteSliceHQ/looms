import { Predicate } from 'effect'

import { decodeLoomsEvent, type EventEnvelope } from '@looms/core'

export interface SseFrame {
  id?: string
  event?: string
  data: string
}

export function parseSseFrame(raw: string): SseFrame | undefined {
  let id: string | undefined
  let event: string | undefined
  const dataLines: string[] = []
  for (const line of raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')) {
    if (line.startsWith(':')) continue
    if (line.startsWith('id:')) {
      id = line.slice(3).trim()
      continue
    }
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
      continue
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart())
    }
  }
  if (dataLines.length === 0) return undefined
  return { id, event, data: dataLines.join('\n') }
}

export async function consumeSseStream(
  body: ReadableStream<Uint8Array>,
  onFrame: (frame: SseFrame) => void,
  signal?: AbortSignal,
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const abort = () => {
    void reader.cancel()
  }
  signal?.addEventListener('abort', abort)

  try {
    while (true) {
      if (signal?.aborted) break
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const chunks = buffer.split('\n\n')
      buffer = chunks.pop() ?? ''
      for (const chunk of chunks) {
        const frame = parseSseFrame(chunk)
        if (frame) onFrame(frame)
      }
    }
  } finally {
    signal?.removeEventListener('abort', abort)
    try {
      reader.releaseLock()
    } catch {
      // reader already cancelled
    }
  }
}

export function eventsFromSseData(data: string, storeId: string): EventEnvelope[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(data)
  } catch {
    return []
  }
  if (!Predicate.isReadonlyObject(parsed)) return []
  const batch = 'batch' in parsed && Array.isArray(parsed.batch) ? parsed.batch : []
  const events: EventEnvelope[] = []
  for (const item of batch) {
    try {
      events.push(
        decodeLoomsEvent(
          // SAFETY: host SSE batch items are EventEnvelope | LiveStoreGlobalEncoded.
          item as Parameters<typeof decodeLoomsEvent>[0],
          storeId,
        ),
      )
    } catch {
      // skip a malformed item and keep the rest of the batch
    }
  }
  return events
}

export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve()
      return
    }
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
  })
}
