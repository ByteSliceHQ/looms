import {
  compactJson,
  jsonFields,
  jsonText,
  type DebuggerEvent,
  type EventSummary,
} from '@looms/debugger'

export function summarizeWorkflowEvent(event: DebuggerEvent): EventSummary | undefined {
  const payload = jsonFields(event.payload)

  switch (event.type) {
    case 'workflow.node.started':
      return { title: 'node started', detail: jsonText(payload.nodeId) }
    case 'workflow.node.finished':
      return {
        title: jsonText(payload.error) ? 'node failed' : 'node finished',
        detail:
          jsonText(payload.error) ??
          `${jsonText(payload.nodeId) ?? ''} ${compactJson(payload.result ?? null)}`,
      }
    case 'workflow.node.skipped':
      return {
        title: 'node skipped',
        detail: `${jsonText(payload.nodeId) ?? ''} · ${jsonText(payload.reason) ?? ''}`,
      }
    case 'workflow.spawn.requested':
      return {
        title: 'workflow spawn',
        detail: `${jsonText(payload.definitionName) ?? 'unknown'} from ${jsonText(payload.nodeId) ?? ''}`,
      }
    case 'workflow.sleep.requested':
      return { title: 'sleep', detail: jsonText(payload.nodeId) }
    case 'workflow.effects.requested':
      return { title: 'workflow effects', detail: jsonText(payload.nodeId) }
    default:
      return undefined
  }
}
