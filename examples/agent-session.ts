import { setTimeout as sleep } from 'node:timers/promises'

import { z } from 'zod'

import { agent, defineAgent, defineAgentSession, submitAgentMessage } from '@swirls/looms/agent'
import type { EventEnvelope } from '@swirls/looms/core'
import { createLooms } from '@swirls/looms/runtime'

const responder = defineAgent({
  name: 'session-responder',
  input: z.object({ text: z.string() }),
  instructions: 'Reply to the current message.',
  runTurn: ({ input }) => ({
    message: { role: 'assistant', content: `Reply: ${input.text}` },
    done: true,
    output: { reply: input.text },
  }),
})

const supportSession = defineAgentSession({
  name: 'support-session',
  agent: responder,
  idleTimeoutMs: 60_000,
})

const looms = createLooms({
  modules: [agent({ definitions: [responder, supportSession] })],
})

const { runId, threadId } = await looms.start(supportSession, {})

await looms.signal(runId, [
  submitAgentMessage('message-1', 'Where is my order?', { threadId }),
  submitAgentMessage('message-2', 'The order number is 1042.', {
    delivery: 'followUp',
    threadId,
  }),
])

let closedTurns: EventEnvelope[] = []

for (let attempt = 0; attempt < 100 && closedTurns.length < 2; attempt++) {
  const events = await looms.getEvents(runId)

  closedTurns = events.filter((event) => event.type === 'agent.session.turn.closed')

  if (closedTurns.length < 2) {
    await sleep(10)
  }
}

if (closedTurns.length < 2) {
  throw new Error('Agent session did not close both turns')
}

console.log({ runId, closedTurns: closedTurns.length })
await looms.stop()
