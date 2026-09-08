import type { JsonValue } from '@looms/core'
import type { DemoEvents } from '../runtime'

function dump(payload: JsonValue) {
  return JSON.stringify(payload)
}

export function renderEvent(event: DemoEvents): string {
  switch (event.type) {
    case 'runtime.run.started':
      return `run started ${dump(event.payload)}`
    case 'runtime.run.completed':
      return `run completed ${dump(event.payload)}`
    case 'runtime.thread.started':
      return `thread started ${dump(event.payload)}`
    case 'runtime.thread.completed':
      return `thread completed ${dump(event.payload)}`
    case 'runtime.thread.failed':
      return `thread failed ${dump(event.payload)}`
    case 'runtime.thread.cancelled':
      return `thread cancelled ${dump(event.payload)}`
    case 'runtime.wait.registered':
      return `wait registered ${dump(event.payload)}`
    case 'runtime.wait.satisfied':
      return `wait satisfied ${dump(event.payload)}`
    case 'runtime.timer.set':
      return `timer set ${dump(event.payload)}`
    case 'runtime.timer.fired':
      return `timer fired ${dump(event.payload)}`
    case 'runtime.effect.failed':
      return `effect failed ${dump(event.payload)}`
    case 'runtime.snapshot.taken':
      return `snapshot ${dump(event.payload)}`
    case 'runtime.signal.received':
      return `signal ${dump(event.payload)}`
    case 'agent.message.received':
      return `user message ${dump(event.payload)}`
    case 'agent.turn.started':
      return `turn started ${dump(event.payload)}`
    case 'agent.turn.text_delta':
      return `text delta ${dump(event.payload)}`
    case 'agent.message':
      return `agent message ${dump(event.payload)}`
    case 'agent.tool_call.requested':
      return `tool call ${dump(event.payload)}`
    case 'agent.tool.result':
      return `tool result ${dump(event.payload)}`
    case 'agent.steered':
      return `steered ${dump(event.payload)}`
    case 'agent.spawn.requested':
      return `agent spawn ${dump(event.payload)}`
    case 'agent.effects.requested':
      return `agent effects ${dump(event.payload)}`
    case 'workflow.node.started':
      return `node started ${dump(event.payload)}`
    case 'workflow.node.finished':
      return `node finished ${dump(event.payload)}`
    case 'workflow.node.skipped':
      return `node skipped ${dump(event.payload)}`
    case 'workflow.spawn.requested':
      return `workflow spawn ${dump(event.payload)}`
    case 'workflow.sleep.requested':
      return `sleep ${dump(event.payload)}`
    case 'workflow.effects.requested':
      return `workflow effects ${dump(event.payload)}`
    case 'approval.requested':
      return `approval requested ${dump(event.payload)}`
    case 'approval.decided':
      return `approval decided ${dump(event.payload)}`
    case 'approval.timed_out':
      return `approval timed out ${dump(event.payload)}`
    case 'payments.charge.requested':
      return `charge requested ${dump(event.payload)}`
    case 'payments.charge.authorized':
      return `charge authorized ${dump(event.payload)}`
    case 'payments.charge.declined':
      return `charge declined ${dump(event.payload)}`
    default: {
      const _exhaustive: never = event
      return _exhaustive
    }
  }
}

export function eventFamily(type: string): string {
  if (type.startsWith('agent.')) return 'agent'
  if (type.startsWith('workflow.')) return 'workflow'
  if (type.startsWith('approval.')) return 'approval'
  if (type.startsWith('payments.')) return 'payments'
  if (type.startsWith('runtime.wait')) return 'wait'
  return 'runtime'
}
