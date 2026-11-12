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

/**
 * Add a tool result directly after the assistant line that made the call, behind any results
 * already there. A user message can arrive while the call is open (a non-interrupt steer); model
 * APIs reject a transcript where that message sits between a tool call and its result, so the
 * result goes ahead of it. A result with no open call (unknown or already answered) is appended.
 */
export function insertToolResult(lines: readonly Message[], result: Message): Message[] {
  const callId = result.toolCallId
  const answered = lines.some((line) => line.role === 'tool' && line.toolCallId === callId)

  const callIndex = answered
    ? -1
    : lines.findLastIndex(
        (line) => line.role === 'assistant' && line.toolCalls?.some((call) => call.id === callId),
      )

  if (callIndex === -1) {
    return [...lines, result]
  }

  let index = callIndex + 1

  while (lines[index]?.role === 'tool') {
    index += 1
  }

  return [...lines.slice(0, index), result, ...lines.slice(index)]
}
