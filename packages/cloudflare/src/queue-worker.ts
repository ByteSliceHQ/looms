import { DateTime, Predicate, Schema } from 'effect'

import { stringifyJson, type EventInput, type JsonValue } from '@looms/core'
import type { EffectWorker, EffectWorkerTask } from '@looms/runtime'

const CallbackResponseSchema = Schema.Struct({
  status: Schema.Union([
    Schema.Literal('accepted'),
    Schema.Literal('stale'),
    Schema.Literal('cancelled'),
  ]),
  cancelRequested: Schema.optional(Schema.Boolean),
})

const decodeCallbackResponse = Schema.decodeUnknownOption(CallbackResponseSchema)

function utcNow(): Date {
  return DateTime.toDateUtc(DateTime.nowUnsafe())
}

export interface QueueEffectMessage {
  readonly v: 1
  readonly runId: string
  readonly effectId: string
  readonly attempt: number
  readonly type: string
  readonly input: JsonValue
  readonly traceparent?: string
  readonly deadlines: {
    readonly scheduleToStartTimeoutMs?: number
    readonly startToCloseTimeoutMs?: number
    readonly heartbeatTimeoutMs?: number
  }
}

export interface QueueSendOptions {
  readonly contentType?: 'json' | 'text' | 'bytes' | 'v8'
}

export interface QueueLike<Body = unknown> {
  send(message: Body, options?: QueueSendOptions): Promise<void>
}

export interface QueueRoute {
  readonly handles: ReadonlyArray<string> | ((type: string) => boolean)
  readonly queue: QueueLike<QueueEffectMessage>
}

export interface CloudflareQueueWorkerOptions {
  readonly routes: readonly QueueRoute[]
  /** Optional offload hook when input exceeds ~100 KB (Cloudflare Queues cap is 128 KB). */
  readonly offloadInput?: (input: JsonValue) => Promise<JsonValue>
}

export function cloudflareQueueWorker(options: CloudflareQueueWorkerOptions): EffectWorker {
  const isHandled = (type: string) =>
    options.routes.some((route) =>
      Predicate.isFunction(route.handles) ? route.handles(type) : route.handles.includes(type),
    )

  return {
    dispatchSemantics: 'acknowledged',
    handles: isHandled,
    dispatch: (task: EffectWorkerTask): Promise<void> => {
      const route = options.routes.find((candidate) =>
        Predicate.isFunction(candidate.handles)
          ? candidate.handles(task.type)
          : candidate.handles.includes(task.type),
      )

      if (!route) {
        return Promise.reject(
          new Error(`No Cloudflare Queue route handles effect type "${task.type}"`),
        )
      }

      const input = task.input
      const estimatedBytes = stringifyJson(input).length

      const offloadPromise =
        estimatedBytes > 100_000 && options.offloadInput
          ? options.offloadInput(task.input)
          : Promise.resolve(input)

      return offloadPromise.then((resolvedInput) => {
        const message: QueueEffectMessage = {
          v: 1,
          runId: task.runId,
          effectId: task.effectId,
          attempt: task.attempt,
          type: task.type,
          input: resolvedInput,
          deadlines: {},
        }

        return route.queue.send(message, { contentType: 'json' })
      })
    },
    cancel: () => undefined,
  }
}

export interface QueueTaskContext {
  readonly signal: AbortSignal
  readonly heartbeat: (details?: JsonValue) => Promise<void>
  readonly secrets: () => Promise<Record<string, string>>
}

export type QueueTaskHandler = (
  task: QueueEffectMessage,
  ctx: QueueTaskContext,
) => Promise<readonly EventInput[]> | readonly EventInput[]

export interface QueueMessageLike<Body = unknown> {
  readonly id: string
  readonly timestamp: Date
  readonly body: Body
  readonly attempts?: number
  ack(): void
  retry(options?: { delaySeconds?: number }): void
}

export interface MessageBatchLike<Body = unknown> {
  readonly queue: string
  readonly messages: readonly QueueMessageLike<Body>[]
  ackAll(): void
  retryAll(options?: { delaySeconds?: number }): void
}

export interface QueueConsumerOptions {
  readonly handlers: Record<string, QueueTaskHandler>
  readonly callbackUrl: string
  readonly workerToken?: string
  readonly fetch?: typeof fetch
}

const emptySecrets = (): Promise<Record<string, string>> => Promise.resolve({})

export function processQueueMessage(
  message: QueueMessageLike<QueueEffectMessage>,
  options: QueueConsumerOptions,
): Promise<void> {
  const fetchImpl = options.fetch ?? fetch
  const task = message.body
  const handler = options.handlers[task.type]

  if (!handler) {
    message.retry()
    return Promise.resolve()
  }

  const baseUrl = options.callbackUrl.replace(/\/$/, '')

  const headers = new Headers({
    'content-type': 'application/json',
  })

  if (options.workerToken) {
    headers.set('authorization', `Bearer ${options.workerToken}`)
  }

  const startedUrl = `${baseUrl}/runs/${encodeURIComponent(task.runId)}/effects/${encodeURIComponent(task.effectId)}/${task.attempt}/started`

  return fetchImpl(startedUrl, {
    method: 'POST',
    headers,
    body: stringifyJson({}),
  })
    .then((startedRes) => {
      if (!startedRes.ok) {
        message.retry()
        return undefined
      }

      return startedRes.json().then((startedJson) => {
        const startedData = decodeCallbackResponse(startedJson)

        if (startedData._tag === 'None') {
          message.retry()
          return undefined
        }

        const { status, cancelRequested } = startedData.value

        if (status === 'stale' || status === 'cancelled') {
          message.ack()
          return undefined
        }

        message.ack()

        const controller = new AbortController()

        if (cancelRequested) {
          controller.abort()
        }

        const heartbeatUrl = `${baseUrl}/runs/${encodeURIComponent(task.runId)}/effects/${encodeURIComponent(task.effectId)}/${task.attempt}/heartbeat`

        const heartbeat = (details?: JsonValue): Promise<void> =>
          fetchImpl(heartbeatUrl, {
            method: 'POST',
            headers,
            body: stringifyJson(details === undefined ? {} : { details }),
          }).then((res) => {
            if (res.ok) {
              return res.json().then((dataJson) => {
                const data = decodeCallbackResponse(dataJson)

                if (data._tag === 'Some' && data.value.cancelRequested) {
                  controller.abort()
                }
              })
            }

            return undefined
          })

        const handlerPromise = Promise.resolve(
          handler(task, {
            signal: controller.signal,
            heartbeat,
            secrets: emptySecrets,
          }),
        )

        return handlerPromise
          .then((events) => {
            const completeUrl = `${baseUrl}/runs/${encodeURIComponent(task.runId)}/effects/${encodeURIComponent(task.effectId)}/${task.attempt}/complete`

            return fetchImpl(completeUrl, {
              method: 'POST',
              headers,
              body: stringifyJson({ events: [...events] }),
            }).then(() => undefined)
          })
          .catch((cause: unknown) => {
            const error = cause instanceof Error ? cause.message : String(cause)
            const failUrl = `${baseUrl}/runs/${encodeURIComponent(task.runId)}/effects/${encodeURIComponent(task.effectId)}/${task.attempt}/fail`

            return fetchImpl(failUrl, {
              method: 'POST',
              headers,
              body: stringifyJson({ error }),
            }).then(() => undefined)
          })
      })
    })
    .catch(() => {
      message.retry()
    })
}

export function queuePushConsumer(options: QueueConsumerOptions) {
  return {
    consumeBatch: (batch: MessageBatchLike<QueueEffectMessage>): Promise<void> =>
      batch.messages.reduce(
        (prev, msg) => prev.then(() => processQueueMessage(msg, options)),
        Promise.resolve(),
      ),
  }
}

export interface MemoryQueueSimulation {
  duplicateDelivery?: boolean
  crashBeforeStarted?: boolean
  crashAfterStarted?: boolean
  rateLimit429?: boolean
}

export interface MemoryQueue extends QueueLike<QueueEffectMessage> {
  readonly messages: readonly QueueEffectMessage[]
  readonly enqueued: readonly QueueEffectMessage[]
  readonly acknowledged: readonly string[]
  readonly retried: readonly string[]
  receiveBatch(count?: number): MessageBatchLike<QueueEffectMessage>
  setSimulation(sim: MemoryQueueSimulation): void
}

export function createMemoryQueue(): MemoryQueue {
  const enqueuedList: QueueEffectMessage[] = []
  const acknowledgedList: string[] = []
  const retriedList: string[] = []
  let simulation: MemoryQueueSimulation = {}

  return {
    get messages() {
      return [...enqueuedList]
    },
    get enqueued() {
      return [...enqueuedList]
    },
    get acknowledged() {
      return [...acknowledgedList]
    },
    get retried() {
      return [...retriedList]
    },
    setSimulation(sim: MemoryQueueSimulation) {
      simulation = { ...simulation, ...sim }
    },
    send: (message: QueueEffectMessage): Promise<void> => {
      if (simulation.rateLimit429) {
        return Promise.reject(new Error('429 Too Many Requests: Queue rate limit exceeded'))
      }

      enqueuedList.push(message)
      return Promise.resolve()
    },
    receiveBatch: (count = 10): MessageBatchLike<QueueEffectMessage> => {
      const selected = enqueuedList.slice(0, count)

      const queueMessages: QueueMessageLike<QueueEffectMessage>[] = selected.map((msg, idx) => {
        const id = `msg_${idx}_${msg.effectId}`

        return {
          id,
          timestamp: utcNow(),
          body: msg,
          ack: () => {
            acknowledgedList.push(id)
          },
          retry: () => {
            retriedList.push(id)
          },
        }
      })

      if (simulation.duplicateDelivery && queueMessages.length > 0) {
        const first = queueMessages[0]

        if (first) {
          queueMessages.push({
            id: `${first.id}_dup`,
            timestamp: utcNow(),
            body: first.body,
            ack: () => {
              acknowledgedList.push(`${first.id}_dup`)
            },
            retry: () => {
              retriedList.push(`${first.id}_dup`)
            },
          })
        }
      }

      return {
        queue: 'looms-effects-queue',
        messages: queueMessages,
        ackAll: () => {
          for (const m of queueMessages) {
            m.ack()
          }
        },
        retryAll: () => {
          for (const m of queueMessages) {
            m.retry()
          }
        },
      }
    },
  }
}
