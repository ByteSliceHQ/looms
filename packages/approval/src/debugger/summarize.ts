import { jsonFields, jsonText, type DebuggerEvent, type EventSummary } from '@looms/debugger'

export function summarizeApprovalEvent(event: DebuggerEvent): EventSummary | undefined {
  const payload = jsonFields(event.payload)

  switch (event.type) {
    case 'approval.requested':
      return { title: 'approval requested', detail: jsonText(payload.title) }
    case 'approval.decided':
      return {
        title: `approval ${jsonText(payload.outcome) ?? 'decided'}`,
        detail: jsonText(payload.approvalId),
      }
    case 'approval.timed_out':
      return { title: 'approval timed out', detail: jsonText(payload.approvalId) }
    default:
      return undefined
  }
}
