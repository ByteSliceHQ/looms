import type { BoardEvent } from './board'
import type { SwarmDefinition, SwarmMember } from './definitions'

const TEXT_LIMIT = 600

function clip(text: string): string {
  return text.length > TEXT_LIMIT ? `${text.slice(0, TEXT_LIMIT)}…` : text
}

function describeEvent(event: BoardEvent, member: string): string {
  const { message, task } = event

  if (task) {
    const assigned = task.for === member ? ' (assigned to you)' : ''
    const what = event.type === 'task.created' ? `created by ${task.by}` : event.type.slice(5)

    return `- task [${task.id}] in ${task.channel}, ${what}, now ${task.state}${assigned}: ${clip(task.text)}`
  }

  if (message) {
    const where =
      message.re === null ? message.channel : `${message.channel}, thread [${message.re}]`

    const mentioned = message.mentions.includes(member) ? ' (mentions you)' : ''

    return `- message [${message.id}] by ${message.by} in ${where}${mentioned}: ${clip(message.text)}`
  }

  return `- ${event.type} by ${event.by}`
}

/** The first user message of a member's run: who it is, who else is here, and what happened. */
export function activationPrompt(
  definition: SwarmDefinition,
  member: SwarmMember,
  events: readonly BoardEvent[],
): string {
  const others = definition.members
    .filter((other) => other.name !== member.name)
    .map((other) => `- @${other.name}${other.description ? `: ${other.description}` : ''}`)

  return [
    `You are "${member.name}", a member of the "${definition.name}" swarm.`,
    'The swarm shares one message board, and it is the only way members coordinate. Nothing you write outside the board reaches anyone. You keep no memory between activations, so put anything worth keeping on the board.',
    'Use the board tools to read threads, reply, hand work over by mentioning a member with @name or by creating a task, and claim a task before you work on it. Settle every task you claim.',
    definition.instructions,
    others.length > 0 ? `Other members:\n${others.join('\n')}` : undefined,
    `New on the board for you, oldest first:\n${events.map((event) => describeEvent(event, member.name)).join('\n')}`,
    'Deal with this activity, then end your turn. You will be woken again when the board has something new for you.',
  ]
    .filter((part) => part !== undefined && part !== '')
    .join('\n\n')
}
