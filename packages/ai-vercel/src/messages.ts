import { type JSONValue, type ModelMessage } from 'ai'
import { Option, Predicate, Schema } from 'effect'

import type { Attachment, Message, ToolCall } from '@looms/agent'
import type { JsonValue } from '@looms/core'

const decodeJson = Schema.decodeOption(Schema.fromJsonString(Schema.Json))

function toAiJson(value: Schema.Json): JSONValue {
  if (
    value === null ||
    Predicate.isString(value) ||
    Predicate.isNumber(value) ||
    Predicate.isBoolean(value)
  ) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(toAiJson)
  }

  const converted: Record<string, JSONValue> = {}

  for (const [key, nested] of Object.entries(value)) {
    converted[key] = toAiJson(nested)
  }

  return converted
}

/** An attachment's bytes (or base64 text), or a URL the model provider can fetch. */
export type AttachmentData = Uint8Array | ArrayBuffer | string | URL

/**
 * Reads an attachment for a model call. Return `null` for a file the model should not be sent:
 * one that is gone, too large, or of a type the model cannot read. The message then names the
 * file in its text so the model knows it exists.
 */
export type AttachmentResolver = (
  attachment: Attachment,
) => AttachmentData | null | Promise<AttachmentData | null>

export interface ToModelMessagesOptions {
  /**
   * Attachment contents by attachment id, from `resolveAttachments`. An attachment missing here
   * is sent by its `url` when it has one and named in the text otherwise.
   */
  readonly attachments?: ReadonlyMap<string, AttachmentData>
}

/** Resolves every attachment in `messages` once, for `toModelMessages`. */
export function resolveAttachments(
  messages: readonly Message[],
  resolve: AttachmentResolver,
): Promise<Map<string, AttachmentData>> {
  const pending = new Map<string, Promise<AttachmentData | null>>()

  for (const message of messages) {
    for (const attachment of message.attachments ?? []) {
      if (!pending.has(attachment.id)) {
        // Called inside a promise so a resolver that throws rejects instead of throwing here.
        pending.set(
          attachment.id,
          Promise.resolve().then(() => resolve(attachment)),
        )
      }
    }
  }

  return Promise.all([...pending].map(([id, data]) => data.then((value) => ({ id, value })))).then(
    (entries) => {
      const resolved = new Map<string, AttachmentData>()

      for (const { id, value } of entries) {
        if (value !== null) {
          resolved.set(id, value)
        }
      }

      return resolved
    },
  )
}

type UserPart =
  | { type: 'text'; text: string }
  | { type: 'image'; image: AttachmentData; mediaType: string }
  | { type: 'file'; data: AttachmentData; mediaType: string; filename?: string }

function describeAttachment(attachment: Attachment): string {
  return `${attachment.name ?? attachment.id} (${attachment.mediaType})`
}

function userContent(
  message: Message,
  attachments: ReadonlyMap<string, AttachmentData> | undefined,
): string | UserPart[] {
  const files = message.attachments ?? []

  if (files.length === 0) {
    return message.content
  }

  const parts: UserPart[] = []
  const unsent: string[] = []

  for (const attachment of files) {
    const data =
      attachments?.get(attachment.id) ?? (attachment.url ? new URL(attachment.url) : null)

    if (data === null) {
      unsent.push(describeAttachment(attachment))
    } else if (attachment.mediaType.startsWith('image/')) {
      parts.push({ type: 'image', image: data, mediaType: attachment.mediaType })
    } else if (attachment.name) {
      parts.push({
        type: 'file',
        data,
        mediaType: attachment.mediaType,
        filename: attachment.name,
      })
    } else {
      parts.push({ type: 'file', data, mediaType: attachment.mediaType })
    }
  }

  const note = unsent.length > 0 ? `[Attached, not shown to the model: ${unsent.join(', ')}]` : ''

  const text = [message.content, note].filter(Boolean).join('\n\n')

  if (parts.length === 0) {
    return text
  }

  return text ? [{ type: 'text', text }, ...parts] : parts
}

export function toModelMessages(
  messages: readonly Message[],
  options: ToModelMessagesOptions = {},
): ModelMessage[] {
  const converted: ModelMessage[] = []

  for (const message of messages) {
    switch (message.role) {
      case 'system':
        break
      case 'user':
        converted.push({ role: 'user', content: userContent(message, options.attachments) })
        break

      case 'assistant': {
        const toolCalls = message.toolCalls ?? []

        if (toolCalls.length === 0) {
          converted.push({ role: 'assistant', content: message.content })
          break
        }

        const content: Array<
          | { type: 'text'; text: string }
          | { type: 'tool-call'; toolCallId: string; toolName: string; input: JsonValue }
        > = []

        if (message.content) {
          content.push({ type: 'text', text: message.content })
        }

        for (const toolCall of toolCalls) {
          content.push({
            type: 'tool-call',
            toolCallId: toolCall.id,
            toolName: toolCall.name,
            input: toolCall.arguments,
          })
        }

        converted.push({ role: 'assistant', content })
        break
      }

      case 'tool':
        converted.push({
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: message.toolCallId ?? message.name ?? 'unknown',
              toolName: message.name ?? 'unknown',
              output: parseToolOutput(message.content),
            },
          ],
        })

        break

      default: {
        const exhaustiveCheck: never = message.role
        return exhaustiveCheck
      }
    }
  }

  return converted
}

function parseToolOutput(
  content: string,
): { type: 'json'; value: JSONValue } | { type: 'text'; value: string } {
  return Option.match(decodeJson(content), {
    onNone: () => ({ type: 'text', value: content }),
    onSome: (value) => ({ type: 'json', value: toAiJson(value) }),
  })
}

export function toLoomsToolCalls(
  calls: ReadonlyArray<{ toolCallId: string; toolName: string; input: JsonValue }>,
): ToolCall[] {
  return calls.map((call) => ({
    id: call.toolCallId,
    name: call.toolName,
    arguments: call.input,
  }))
}
