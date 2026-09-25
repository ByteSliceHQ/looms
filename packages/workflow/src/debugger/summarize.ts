import { isJsonObject, isJsonString, type JsonValue } from '@looms/core'
import { compactJson, type DebuggerEvent, type EventSummary } from '@looms/debugger'

function obj(value: JsonValue | null): { [key: string]: JsonValue } {
  return isJsonObject(value) ? value : {}
}

function text(value: JsonValue | undefined): string | undefined {
  return isJsonString(value) ? value : undefined
}

export function summarizeWorkflowEvent(event: DebuggerEvent): EventSummary | undefined {
  const payload = obj(event.payload)

  switch (event.type) {
    case 'workflow.node.started':
      return { title: 'node started', detail: text(payload.nodeId) }
    case 'workflow.node.finished':
      return {
        title: text(payload.error) ? 'node failed' : 'node finished',
        detail:
          text(payload.error) ??
          `${text(payload.nodeId) ?? ''} ${compactJson(payload.result ?? null)}`,
      }
    case 'workflow.node.skipped':
      return {
        title: 'node skipped',
        detail: `${text(payload.nodeId) ?? ''} · ${text(payload.reason) ?? ''}`,
      }
    case 'workflow.spawn.requested':
      return {
        title: 'workflow spawn',
        detail: `${text(payload.definitionName) ?? 'unknown'} from ${text(payload.nodeId) ?? ''}`,
      }
    case 'workflow.sleep.requested':
      return { title: 'sleep', detail: text(payload.nodeId) }
    case 'workflow.effects.requested':
      return { title: 'workflow effects', detail: text(payload.nodeId) }
    default:
      return undefined
  }
}
