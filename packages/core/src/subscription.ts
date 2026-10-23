import { Option, Predicate, Schema } from 'effect'

import type { EventEnvelope } from './envelope'
import { decodeLoomsEvent, encodeLoomsEvent } from './event-codec'
import { stringifyJson, type JsonValue } from './types'

/** A socket is closed with this code when the client must resume from `head`. */
export const SUBSCRIPTION_RESYNC_CODE = 4000

/** Close a socket that has fallen this far behind instead of buffering without bound. */
export const SUBSCRIPTION_BACKPRESSURE_BYTES = 1024 * 1024

export type SubscriptionTransport = 'websocket' | 'sse' | 'auto'

export type SubscriptionResyncReason = 'trimmed' | 'backpressure'

export interface SubscriptionHello {
  readonly type: 'hello'
  readonly head: number
  readonly tail: number
}

export interface SubscriptionBatch {
  readonly type: 'batch'
  readonly batch: readonly JsonValue[]
}

export interface SubscriptionResync {
  readonly type: 'resync'
  readonly head: number
  readonly reason: SubscriptionResyncReason
}

export type SubscriptionFrame = SubscriptionHello | SubscriptionBatch | SubscriptionResync

export interface SubscriptionFilter {
  readonly threadId: string | null
  readonly includeEphemeral: boolean
}

/** State hibernated with a Durable Object WebSocket. Writes stay on HTTP. */
export interface SubscriptionAttachment {
  readonly principal: string | null
  readonly cursor: number
  readonly threadId: string | null
  readonly includeEphemeral: boolean
}

export interface SubscriptionSender {
  send(data: string): void
  close(code: number, reason: string): void
  readonly bufferedAmount: number
}

export interface AttachedSubscriptionSocket extends SubscriptionSender {
  attachment(): SubscriptionAttachment | undefined
  setAttachment(attachment: SubscriptionAttachment): void
}

export interface SubscriptionPushOptions {
  readonly bufferLimitBytes?: number
  readonly head?: number
}

export type SubscriptionOpening =
  | { readonly kind: 'resync'; readonly head: number }
  | {
      readonly kind: 'open'
      readonly hello: SubscriptionHello
      readonly events: readonly EventEnvelope[]
    }

export type SubscriptionRead =
  | { readonly kind: 'events'; readonly events: readonly EventEnvelope[] }
  | { readonly kind: 'hello'; readonly head: number; readonly tail: number }
  | { readonly kind: 'resync'; readonly head: number; readonly reason: SubscriptionResyncReason }
  | { readonly kind: 'ignore' }

const decodeJsonArray = Schema.decodeUnknownOption(Schema.Array(Schema.Json))
const asJson = Schema.decodeUnknownOption(Schema.Json)

export function encodeSubscriptionFrame(frame: SubscriptionFrame): string {
  switch (frame.type) {
    case 'hello':
      return stringifyJson({ type: 'hello', head: frame.head, tail: frame.tail })
    case 'resync':
      return stringifyJson({ type: 'resync', head: frame.head, reason: frame.reason })
    case 'batch':
      return stringifyJson({ batch: frame.batch })

    default: {
      const unexpected: never = frame
      return unexpected
    }
  }
}

export function decodeSubscriptionFrame(data: string): SubscriptionFrame | undefined {
  let parsed: unknown

  try {
    parsed = JSON.parse(data)
  } catch {
    return undefined
  }

  if (!Predicate.isObject(parsed)) {
    return undefined
  }

  if ('type' in parsed && parsed.type === 'hello') {
    const head =
      'head' in parsed && Predicate.isNumber(parsed.head) && Number.isFinite(parsed.head)
        ? parsed.head
        : undefined

    const tail =
      'tail' in parsed && Predicate.isNumber(parsed.tail) && Number.isFinite(parsed.tail)
        ? parsed.tail
        : undefined

    if (head === undefined || tail === undefined || head < 1 || tail < 0) {
      return undefined
    }

    return { type: 'hello', head, tail }
  }

  if ('type' in parsed && parsed.type === 'resync') {
    const head =
      'head' in parsed && Predicate.isNumber(parsed.head) && Number.isFinite(parsed.head)
        ? parsed.head
        : undefined

    const reason =
      'reason' in parsed && (parsed.reason === 'trimmed' || parsed.reason === 'backpressure')
        ? parsed.reason
        : undefined

    if (head === undefined || reason === undefined || head < 1) {
      return undefined
    }

    return { type: 'resync', head, reason }
  }

  if (!('batch' in parsed)) {
    return undefined
  }

  const batch = decodeJsonArray(parsed.batch)

  if (Option.isNone(batch)) {
    return undefined
  }

  return { type: 'batch', batch: batch.value }
}

/** One cursor for SSE and WebSocket. `Last-Event-ID` is the last seen seq. */
export function subscriptionFromSeq(
  url: URL,
  lastEventId: string | null,
):
  | { readonly ok: true; readonly fromSeq: number }
  | { readonly ok: false; readonly message: string } {
  if (lastEventId !== null && lastEventId.trim() !== '') {
    const value = Number(lastEventId)

    if (!Number.isSafeInteger(value) || value < 0) {
      return { ok: false, message: 'Last-Event-ID must be a non-negative integer' }
    }

    return { ok: true, fromSeq: value + 1 }
  }

  const raw = url.searchParams.get('fromSeq')

  if (raw === null) {
    return { ok: true, fromSeq: 1 }
  }

  const fromSeq = Number(raw)

  if (!Number.isSafeInteger(fromSeq) || fromSeq < 1) {
    return { ok: false, message: 'fromSeq must be an integer greater than or equal to 1' }
  }

  return { ok: true, fromSeq }
}

export function subscriptionFilter(url: URL): SubscriptionFilter {
  const threadId = url.searchParams.get('threadId')
  const includeEphemeral = url.searchParams.get('includeEphemeral')

  return {
    threadId: threadId && threadId.length > 0 ? threadId : null,
    includeEphemeral: includeEphemeral !== 'false' && includeEphemeral !== '0',
  }
}

export function subscriptionReplay(
  head: number,
  fromSeq: number,
):
  | { readonly kind: 'resync'; readonly head: number }
  | { readonly kind: 'play'; readonly fromSeq: number } {
  if (fromSeq < head) {
    return { kind: 'resync', head }
  }

  return { kind: 'play', fromSeq }
}

export function eventMatchesSubscription(
  event: EventEnvelope,
  filter: SubscriptionFilter,
): boolean {
  if (!filter.includeEphemeral && event.ephemeral) {
    return false
  }

  if (filter.threadId !== null && event.threadId !== filter.threadId) {
    return false
  }

  return true
}

export function attachmentFromFilter(
  filter: SubscriptionFilter,
  fromSeq: number,
  principal: string | null,
): SubscriptionAttachment {
  return {
    principal,
    cursor: fromSeq - 1,
    threadId: filter.threadId,
    includeEphemeral: filter.includeEphemeral,
  }
}

export function readSubscriptionData(data: string, runId: string): SubscriptionRead {
  const frame = decodeSubscriptionFrame(data)

  if (!frame) {
    return { kind: 'ignore' }
  }

  switch (frame.type) {
    case 'hello':
      return { kind: 'hello', head: frame.head, tail: frame.tail }
    case 'resync':
      return { kind: 'resync', head: frame.head, reason: frame.reason }

    case 'batch': {
      const events: EventEnvelope[] = []

      for (const item of frame.batch) {
        try {
          events.push(decodeLoomsEvent(item, runId))
        } catch {
          // A bad item does not drop the rest of the batch.
        }
      }

      return { kind: 'events', events }
    }

    default: {
      const unexpected: never = frame
      return unexpected
    }
  }
}

/**
 * Sends the events this attachment still needs. Returns the advanced attachment,
 * or `undefined` after the socket is closed for resync.
 */
export function pushSubscriptionEvents(
  socket: SubscriptionSender,
  events: readonly EventEnvelope[],
  attachment: SubscriptionAttachment,
  options?: SubscriptionPushOptions,
): SubscriptionAttachment | undefined {
  const limit = options?.bufferLimitBytes ?? SUBSCRIPTION_BACKPRESSURE_BYTES

  if (socket.bufferedAmount > limit) {
    closeForResync(socket, options?.head ?? 1, 'backpressure')
    return undefined
  }

  const filter: SubscriptionFilter = {
    threadId: attachment.threadId,
    includeEphemeral: attachment.includeEphemeral,
  }

  let cursor = attachment.cursor
  const batch: JsonValue[] = []

  for (const event of events) {
    if (event.seq <= cursor) {
      continue
    }

    cursor = event.seq

    if (eventMatchesSubscription(event, filter)) {
      const parsed: unknown = JSON.parse(stringifyJson(encodeLoomsEvent(event)))
      const encoded = asJson(parsed)

      if (Option.isSome(encoded)) {
        batch.push(encoded.value)
      }
    }
  }

  if (batch.length > 0 && !sendFrame(socket, { type: 'batch', batch })) {
    closeForResync(socket, options?.head ?? 1, 'backpressure')
    return undefined
  }

  return { ...attachment, cursor }
}

export function openSubscription(
  socket: SubscriptionSender,
  attachment: SubscriptionAttachment,
  opening: SubscriptionOpening,
  options?: SubscriptionPushOptions,
): SubscriptionAttachment | undefined {
  if (opening.kind === 'resync') {
    closeForResync(socket, opening.head, 'trimmed')
    return undefined
  }

  if (!sendFrame(socket, opening.hello)) {
    closeForResync(socket, opening.hello.head, 'backpressure')
    return undefined
  }

  return pushSubscriptionEvents(socket, opening.events, attachment, {
    ...options,
    head: opening.hello.head,
  })
}

export function fanoutSubscription(
  sockets: readonly AttachedSubscriptionSocket[],
  events: readonly EventEnvelope[],
  options?: SubscriptionPushOptions,
): void {
  for (const socket of sockets) {
    const current = socket.attachment()

    if (!current) {
      continue
    }

    const next = pushSubscriptionEvents(socket, events, current, options)

    if (next) {
      socket.setAttachment(next)
    }
  }
}

function closeForResync(
  socket: SubscriptionSender,
  head: number,
  reason: SubscriptionResyncReason,
): void {
  sendFrame(socket, { type: 'resync', head, reason })

  try {
    socket.close(SUBSCRIPTION_RESYNC_CODE, reason)
  } catch {
    // The platform may already have dropped the socket.
  }
}

function sendFrame(socket: SubscriptionSender, frame: SubscriptionFrame): boolean {
  try {
    socket.send(encodeSubscriptionFrame(frame))
    return true
  } catch {
    return false
  }
}
