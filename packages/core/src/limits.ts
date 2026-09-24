import { Data } from 'effect'

import type { AppendableEvent } from './envelope'
import type { RunSnapshot } from './snapshot-store'
import type { JsonValue } from './types'

export const DEFAULT_MAX_EVENT_BYTES = 1024 * 1024
export const DEFAULT_MAX_SNAPSHOT_BYTES = 8 * 1024 * 1024

const utf8 = new TextEncoder()

export class EventPayloadTooLargeError extends Data.TaggedError('EventPayloadTooLargeError')<{
  readonly runId: string
  readonly eventType: string
  readonly bytes: number
  readonly maxBytes: number
  readonly message: string
}> {
  constructor(runId: string, eventType: string, bytes: number, maxBytes: number) {
    super({
      runId,
      eventType,
      bytes,
      maxBytes,
      message: `EventPayloadTooLarge: event "${eventType}" for run "${runId}" is ${bytes} UTF-8 bytes; limit is ${maxBytes}`,
    })

    this.name = 'EventPayloadTooLargeError'
  }
}

export class SnapshotPayloadTooLargeError extends Data.TaggedError('SnapshotPayloadTooLargeError')<{
  readonly runId: string
  readonly bytes: number
  readonly maxBytes: number
  readonly message: string
}> {
  constructor(runId: string, bytes: number, maxBytes: number) {
    super({
      runId,
      bytes,
      maxBytes,
      message: `SnapshotPayloadTooLarge: snapshot for run "${runId}" is ${bytes} UTF-8 bytes; limit is ${maxBytes}`,
    })

    this.name = 'SnapshotPayloadTooLargeError'
  }
}

/** Size of `value` as serialized JSON, in UTF-8 bytes. */
export function utf8JsonBytes(value: JsonValue | Readonly<object>): number {
  return utf8.encode(JSON.stringify(value)).byteLength
}

/** Validate every event before any storage mutation begins. */
export function assertEventByteLimits(
  runId: string,
  events: ReadonlyArray<AppendableEvent>,
  maxBytes = DEFAULT_MAX_EVENT_BYTES,
): void {
  for (const event of events) {
    const bytes = utf8JsonBytes({ ...event, runId, seq: event.seq ?? 0 })

    if (bytes > maxBytes) {
      throw new EventPayloadTooLargeError(runId, event.type, bytes, maxBytes)
    }
  }
}

export function assertSnapshotByteLimit(
  snapshot: RunSnapshot,
  maxBytes = DEFAULT_MAX_SNAPSHOT_BYTES,
): void {
  const bytes = utf8JsonBytes(snapshot)

  if (bytes > maxBytes) {
    throw new SnapshotPayloadTooLargeError(snapshot.runId, bytes, maxBytes)
  }
}
