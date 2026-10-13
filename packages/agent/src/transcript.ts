import type { Message } from './types'

export const STOPPED_TOOL_RESULT = 'Stopped before the tool returned a result.'

/**
 * Answer every assistant tool call that has no tool result yet. Model APIs reject a transcript
 * whose tool calls are left unanswered, so a stopped turn closes them before the next turn.
 */
export function closeOpenToolCalls(lines: readonly Message[]): Message[] {
  const answered = new Set(lines.flatMap((line) => (line.toolCallId ? [line.toolCallId] : [])))

  const closing = lines.flatMap((line) =>
    line.role === 'assistant'
      ? (line.toolCalls ?? [])
          .filter((call) => !answered.has(call.id))
          .map((call): Message => ({
            role: 'tool',
            content: STOPPED_TOOL_RESULT,
            toolCallId: call.id,
            name: call.name,
          }))
      : [],
  )

  return closing.length === 0 ? [...lines] : [...lines, ...closing]
}
