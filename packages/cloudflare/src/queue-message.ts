import { Option, Schema } from 'effect'

import {
  isBlobRef,
  RunAttributesSchema,
  TraceContextSchema,
  type BlobRef,
  type JsonValue,
  type RunAttributes,
  type TraceContext,
} from '@looms/core'
import type { EffectWorkerDeadlines } from '@looms/runtime'

const QueueEffectMessageSchema = Schema.Struct({
  v: Schema.Literal(1),
  runId: Schema.String,
  effectId: Schema.String,
  attempt: Schema.Finite,
  type: Schema.String,
  input: Schema.optional(Schema.Json),
  inputRef: Schema.optional(Schema.Json),
  threadId: Schema.optional(Schema.String),
  causingEventId: Schema.optional(Schema.String),
  attributes: Schema.optional(RunAttributesSchema),
  details: Schema.optional(Schema.Json),
  trace: Schema.optional(TraceContextSchema),
  deadlines: Schema.optional(
    Schema.Struct({
      scheduleToStartAt: Schema.optional(Schema.Finite),
      startToCloseTimeoutMs: Schema.optional(Schema.Finite),
      heartbeatTimeoutMs: Schema.optional(Schema.Finite),
    }),
  ),
})

const decodeMessage = Schema.decodeUnknownOption(QueueEffectMessageSchema)

/**
 * One effect attempt on a Cloudflare Queue. It never carries the run's secrets; the consumer reads
 * them through the worker callback API. Exactly one of `input` and `inputRef` is set.
 */
export interface QueueEffectMessage {
  readonly v: 1
  readonly runId: string
  readonly effectId: string
  readonly attempt: number
  readonly type: string
  readonly input?: JsonValue
  /** Set instead of `input` when the input would push the message over the queue's size limit. */
  readonly inputRef?: BlobRef
  readonly threadId?: string
  readonly causingEventId?: string
  readonly attributes?: RunAttributes
  /** Progress from the previous attempt's last heartbeat. */
  readonly details?: JsonValue
  readonly trace?: TraceContext
  readonly deadlines?: EffectWorkerDeadlines
}

/** A delivered message, shaped like a Cloudflare `Message`. */
export interface QueueMessageLike {
  readonly body: unknown
  readonly attempts: number
  ack(): void
  retry(options?: { readonly delaySeconds?: number }): void
}

/** `undefined` unless the body is a version 1 message with exactly one of `input` and `inputRef`. */
export function readQueueEffectMessage(message: QueueMessageLike): QueueEffectMessage | undefined {
  return Option.match(decodeMessage(message.body), {
    onNone: () => undefined,
    onSome: ({ inputRef, ...decoded }) => {
      if (inputRef === undefined) {
        return decoded.input === undefined ? undefined : decoded
      }

      return decoded.input === undefined && isBlobRef(inputRef)
        ? { ...decoded, inputRef }
        : undefined
    },
  })
}
