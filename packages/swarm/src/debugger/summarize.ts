import type { JsonValue } from '@looms/core'
import {
  jsonFields,
  jsonNumberText,
  jsonText,
  type DebuggerEvent,
  type EventSummary,
} from '@looms/debugger'

function count(value: JsonValue | undefined, noun: string): string {
  const length = Array.isArray(value) ? value.length : 0
  return `${length} ${noun}${length === 1 ? '' : 's'}`
}

function firstLine(text: string | undefined): string | undefined {
  return text?.split('\n', 1)[0]
}

export function summarizeSwarmEvent(event: DebuggerEvent): EventSummary | undefined {
  const payload = jsonFields(event.payload)

  switch (event.type) {
    case 'swarm.board.pulled':
      return {
        title: payload.reset === true ? 'board read from the start' : 'board pulled',
        detail: `${count(payload.events, 'event')}${payload.more === true ? ', more waiting' : ''}`,
      }

    case 'swarm.member.activated': {
      const member = jsonText(payload.member) ?? 'member'
      const activation = jsonNumberText(payload.activation)
      return {
        title: `${member} activated`,
        detail: activation === undefined ? undefined : `activation ${activation}`,
      }
    }

    case 'swarm.nudged':
      return { title: 'swarm nudged' }
    case 'swarm.stopped':
      return { title: 'swarm stopped' }
    case 'swarm.paused':
      return { title: 'swarm paused' }
    case 'swarm.resumed':
      return { title: 'swarm resumed' }
    case 'swarm.restarted':
      return { title: 'swarm restarted', detail: jsonText(payload.board) }
    case 'swarm.halted':
      return { title: 'swarm halted', detail: jsonText(payload.error) }

    case 'swarm.message.posted': {
      const message = jsonFields(payload.message)
      const channel = jsonText(message.channel)
      return {
        title: jsonText(message.re) === undefined ? 'posted' : 'replied',
        detail: [
          channel === undefined ? undefined : `#${channel}`,
          firstLine(jsonText(message.text)),
        ]
          .filter(Boolean)
          .join(' '),
      }
    }

    case 'swarm.message.labeled':
      return { title: 'labeled message', detail: jsonText(jsonFields(payload.message).id) }
    case 'swarm.messages.read':
      return { title: 'read messages', detail: count(payload.messages, 'message') }
    case 'swarm.attachments.viewed':
      return { title: 'viewed attachments', detail: count(payload.attachments, 'file') }
    case 'swarm.task.created':
      return { title: 'created task', detail: firstLine(jsonText(jsonFields(payload.task).text)) }
    case 'swarm.tasks.listed':
      return { title: 'listed tasks', detail: count(payload.tasks, 'task') }

    case 'swarm.task.claimed': {
      const claim = jsonFields(payload.claim)
      return payload.claim === null
        ? { title: 'nothing to claim' }
        : { title: 'claimed task', detail: firstLine(jsonText(jsonFields(claim.task).text)) }
    }

    case 'swarm.task.settled': {
      const task = jsonFields(payload.task)
      return {
        title: `task ${jsonText(task.state) ?? 'settled'}`,
        detail: firstLine(jsonText(task.note) ?? jsonText(task.text)),
      }
    }

    case 'swarm.task.renewed':
      return {
        title: 'renewed lease',
        detail: jsonText(jsonFields(jsonFields(payload.claim).task).id),
      }
    case 'swarm.task.reopened':
      return { title: 'reopened task', detail: jsonText(jsonFields(payload.task).id) }
    case 'swarm.task.canceled':
      return { title: 'canceled task', detail: jsonText(jsonFields(payload.task).id) }
    case 'swarm.call.rejected':
      return {
        title: `board refused: ${jsonText(payload.code) ?? 'error'}`,
        detail: jsonText(payload.error),
      }
    default:
      return undefined
  }
}
