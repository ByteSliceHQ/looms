import type { Message, ToolCall } from '@looms/agent'
import type { JsonValue } from '@looms/core'
import { type ModelMessage } from 'ai'

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
          { type: 'text'; text: string } | { type: 'tool-call'; toolCallId: string; toolName: string; input: JsonValue }
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
        const _exhaustive: never = message.role
        return _exhaustive
      }
    }
  }

  return converted
}

function parseToolOutput(
  content: string,
): { type: 'json'; value: JsonValue } | { type: 'text'; value: string } {
  try {
    // SAFETY: tool message content is JSON from Looms tool.result payloads.
    return { type: 'json', value: JSON.parse(content) as JsonValue }
  } catch {
    return { type: 'text', value: content }
  }
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
