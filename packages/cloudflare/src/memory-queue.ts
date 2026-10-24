import { Clock, Effect } from 'effect'

import type { QueueBatchLike } from './queue-consumer'
import type { QueueEffectMessage } from './queue-message'
import type { PulledQueueMessage, QueuePullSource } from './queue-pull'
import type { QueueProducer } from './queue-worker'

export interface MemoryQueueOptions {
  /** Redeliveries before a message moves to the dead-letter list. Default 3, as on Cloudflare. */
  readonly maxRetries?: number
}

/** A queue in process memory with Cloudflare's lease, retry, and dead-letter behavior. */
export interface MemoryQueue extends QueueProducer, QueuePullSource {
  /** Messages still held, leased or not. */
  size(): number
  deadLetters(): ReadonlyArray<QueueEffectMessage>
  /** Lease visible messages as a push batch, the way a Worker's `queue` handler receives them. */
  batch(size?: number): Effect.Effect<QueueBatchLike>
}

interface Entry {
  readonly body: QueueEffectMessage
  deliveries: number
  visibleAt: number
  leaseId: string | undefined
}

export function createMemoryQueue(options: MemoryQueueOptions = {}): MemoryQueue {
  const maxRetries = options.maxRetries ?? 3
  let entries: Entry[] = []
  const dead: QueueEffectMessage[] = []
  let nextLease = 0

  const settleAt = (
    now: number,
    acks: ReadonlyArray<string>,
    retries: ReadonlyArray<{ readonly leaseId: string; readonly delaySeconds: number }>,
  ) => {
    entries = entries.filter(
      (entry) => entry.leaseId === undefined || !acks.includes(entry.leaseId),
    )

    for (const retry of retries) {
      const entry = entries.find((candidate) => candidate.leaseId === retry.leaseId)

      if (entry) {
        entry.leaseId = undefined
        entry.visibleAt = now + retry.delaySeconds * 1_000
      }
    }
  }

  const pull = (batchSize: number, visibilityTimeoutMs: number) =>
    Effect.map(Clock.currentTimeMillis, (now) => {
      const visible = entries.filter((entry) => entry.visibleAt <= now)
      const exhausted = visible.filter((entry) => entry.deliveries > maxRetries)

      dead.push(...exhausted.map((entry) => entry.body))
      entries = entries.filter((entry) => !exhausted.includes(entry))

      const leased = visible
        .filter((entry) => entry.deliveries <= maxRetries)
        .slice(0, batchSize)
        .map((entry): PulledQueueMessage => {
          nextLease += 1
          entry.deliveries += 1
          entry.visibleAt = now + visibilityTimeoutMs
          entry.leaseId = `lease_${nextLease}`

          return { leaseId: entry.leaseId, body: entry.body, attempts: entry.deliveries }
        })

      return { messages: leased, backlog: entries.length }
    })

  const settle: QueuePullSource['settle'] = (acks, retries) =>
    Effect.map(Clock.currentTimeMillis, (now) => settleAt(now, acks, retries))

  return {
    send: (message) => {
      entries.push({ body: message, deliveries: 0, visibleAt: 0, leaseId: undefined })

      return Promise.resolve()
    },
    pull,
    settle,
    size: () => entries.length,
    deadLetters: () => [...dead],
    batch: (size = 100) =>
      pull(size, 30_000).pipe(
        Effect.map(({ messages }) => ({
          messages: messages.map((message) => ({
            body: message.body,
            attempts: message.attempts,
            ack: () => Effect.runSync(settle([message.leaseId], [])),
            retry: (retry) =>
              Effect.runSync(
                settle([], [{ leaseId: message.leaseId, delaySeconds: retry?.delaySeconds ?? 0 }]),
              ),
          })),
        })),
      ),
  }
}
