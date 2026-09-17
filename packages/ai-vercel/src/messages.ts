import { type JSONValue, type ModelMessage } from 'ai'
import { Option, Predicate, Schema } from 'effect'

import type { Message, ToolCall } from '@looms/agent'
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

export function toModelMessages(messages: Message[]): ModelMessage[] {
  const converted: ModelMessage[] = []

  for (const message of messages) {
    switch (message.role) {
      case 'system':
        break
      case 'user':
        converted.push({ role: 'user', content: message.content })
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
