import { Predicate, Schema } from 'effect'

import type { EventInput, JsonValue } from '@looms/core'

import { AgentSessionDeliverySchema, AgentSessionMessageSubmittedPayloadSchema } from './events'
import { agentModule } from './scope'
import type { AgentMessageDelivery, AgentSessionActiveTurn } from './types'

const UserMessageInputSchema = Schema.Struct({
  content: Schema.String,
})

const SteerInputSchema = Schema.Struct({
  content: Schema.String,
  interrupt: Schema.optional(Schema.Boolean),
})

const CancelAgentTurnInputSchema = Schema.Struct({
  childThreadId: Schema.String,
})

const AgentSessionMessageInputSchema = Schema.Struct({
  messageId: Schema.String,
  text: Schema.String,
  delivery: Schema.optional(AgentSessionDeliverySchema),
  activeChildThreadId: Schema.optional(Schema.String),
})

/**
 * Build the `agent.message.received` event for a conversational agent.
 * Send it with `looms.signal(runId, [userMessage({ content: 'Also greet Maya' })])`.
 */
export const userMessage = agentModule.signal({
  description: 'Append a user message to a conversational agent.',
  input: UserMessageInputSchema,
  build: ({ content }) =>
    agentModule.input('message.received', { message: { role: 'user', content } }),
})

/**
 * Build the `agent.steered` event: inject a user message mid-run, optionally
 * interrupting the current turn so the agent replans immediately.
 */
export const steer = agentModule.signal({
  description: 'Inject a user message mid-run, optionally interrupting the current turn.',
  input: SteerInputSchema,
  build: ({ content, interrupt }) =>
    agentModule.input('steered', {
      turn: 0,
      interrupt: interrupt ?? true,
      message: { role: 'user', content },
    }),
})

/**
 * Build the `agent.turn.stopped` event. A conversational agent aborts its in-flight turn and
 * waits for the next message; an agent session cancels its active turn and stays open.
 */
export const stopAgentTurn = agentModule.signal({
  description: 'Stop the in-flight agent turn without ending the run.',
  build: () => agentModule.input('turn.stopped', {}),
})

export interface AgentSessionMessageOptions {
  readonly threadId?: string
  readonly delivery?: AgentMessageDelivery
  /** Set by the client helper when a steer is aimed at an active child. */
  readonly activeChildThreadId?: string
}

export const submitAgentMessage = agentModule.signal({
  description: 'Submit a message to an agent session.',
  input: AgentSessionMessageSubmittedPayloadSchema,
  build: (input) =>
    agentModule.input('session.message.submitted', input, {
      idempotencyKey: `agent-session-message:${input.messageId}`,
    }),
})

export const cancelAgentTurn = agentModule.signal({
  description: 'Cancel the active child turn of an agent session.',
  input: CancelAgentTurnInputSchema,
  build: ({ childThreadId }) => [
    agentModule.input('session.cancel.requested', {}),
    {
      type: 'runtime.thread.cancel.requested' as const,
      payload: { threadId: childThreadId },
    },
  ],
})

interface AgentSessionSignalClient<Result> {
  getRun(runId: string): Promise<{
    rootThreadId: string | null
    threads: { [threadId: string]: { state: JsonValue } }
  }>
  signal(runId: string, events: ReadonlyArray<EventInput>): Promise<Result>
  cancel?(runId: string, threadId?: string): Promise<Result>
}

function activeTurnFrom(value: JsonValue | undefined): AgentSessionActiveTurn | null {
  if (!Predicate.isObject(value) || !Predicate.isObject(value.activeTurn)) {
    return null
  }

  const activeTurn = value.activeTurn

  return Predicate.isString(activeTurn.messageId) &&
    Predicate.isString(activeTurn.childThreadId) &&
    Predicate.isString(activeTurn.text)
    ? {
        messageId: activeTurn.messageId,
        childThreadId: activeTurn.childThreadId,
        text: activeTurn.text,
      }
    : null
}

/** Events for one session message. A steer aimed at `activeChildThreadId` interrupts that turn in the same batch. */
export const agentSessionMessageEvents = agentModule.signal({
  description: 'Submit a session message, and steer the active child when delivery is steer.',
  input: AgentSessionMessageInputSchema,
  build: (input) => {
    const submitted = agentModule.input(
      'session.message.submitted',
      {
        messageId: input.messageId,
        text: input.text,
        delivery: input.delivery,
        activeChildThreadId: input.activeChildThreadId,
      },
      { idempotencyKey: `agent-session-message:${input.messageId}` },
    )

    if (input.delivery === 'steer' && input.activeChildThreadId) {
      return [
        submitted,
        agentModule.input(
          'steered',
          {
            turn: 0,
            messageId: input.messageId,
            message: { role: 'user', content: input.text },
            interrupt: true,
          },
          { threadId: input.activeChildThreadId },
        ),
      ]
    }

    return [submitted]
  },
})

export function sendAgentSessionMessage<Result>(
  client: AgentSessionSignalClient<Result>,
  runId: string,
  messageId: string,
  text: string,
  options: Omit<AgentSessionMessageOptions, 'activeChildThreadId'> = {},
): Promise<Result> {
  return client.getRun(runId).then((run) => {
    const threadId = options.threadId ?? run.rootThreadId ?? undefined

    const active =
      options.delivery === 'steer' && threadId ? activeTurnFrom(run.threads[threadId]?.state) : null

    return client.signal(
      runId,
      agentSessionMessageEvents(
        {
          messageId,
          text,
          delivery: options.delivery,
          activeChildThreadId: active?.childThreadId,
        },
        { threadId },
      ),
    )
  })
}

export function cancelActiveAgentTurn<Result>(
  client: AgentSessionSignalClient<Result>,
  runId: string,
  options: { readonly threadId?: string } = {},
): Promise<Result | Awaited<ReturnType<AgentSessionSignalClient<Result>['getRun']>>> {
  return client.getRun(runId).then((run) => {
    const threadId = options.threadId ?? run.rootThreadId ?? undefined
    const active = threadId ? activeTurnFrom(run.threads[threadId]?.state) : null

    if (!active) {
      return run
    }

    if (client.cancel) {
      const cancel = (targetRunId: string, childThreadId: string) =>
        client.cancel!(targetRunId, childThreadId)

      const requested = client.signal(runId, [
        agentModule.input('session.cancel.requested', {}, { threadId }),
      ])

      const cancelled = cancel(runId, active.childThreadId)

      return Promise.all([requested, cancelled]).then(([, result]) => result)
    }

    return client.signal(
      runId,
      cancelAgentTurn({ childThreadId: active.childThreadId }, { threadId }),
    )
  })
}
