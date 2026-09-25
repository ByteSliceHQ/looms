import { isJsonObject, isJsonString, type JsonValue } from '@looms/core'
import type { DebuggerEvent, EventSummary } from '@looms/debugger'

function obj(value: JsonValue | null): { [key: string]: JsonValue } {
  return isJsonObject(value) ? value : {}
}

function text(value: JsonValue | undefined): string | undefined {
  return isJsonString(value) ? value : undefined
}

export function summarizeApprovalEvent(event: DebuggerEvent): EventSummary | undefined {
  const payload = obj(event.payload)

  switch (event.type) {
    case 'approval.requested':
      return { title: 'approval requested', detail: text(payload.title) }
    case 'approval.decided':
      return {
        title: `approval ${text(payload.outcome) ?? 'decided'}`,
        detail: text(payload.approvalId),
      }
    case 'approval.timed_out':
      return { title: 'approval timed out', detail: text(payload.approvalId) }
    default:
      return undefined
  }
}
