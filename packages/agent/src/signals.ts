import { Predicate } from 'effect'

import type { EventInput, JsonValue } from '@looms/core'

import { agentModule } from './scope'
import type { AgentMessageDelivery, AgentSessionActiveTurn } from './types'

export interface AgentSignalOptions {
  /** Target thread. Defaults to the run's root thread when omitted. */
  readonly threadId?: string
}

/**
 * Build the `agent.message.received` event for a conversational agent.
 * Send it with `looms.signal(runId, [userMessage('Also greet Maya')])`.
 */
export function userMessage(content: string, options: AgentSignalOptions = {}): EventInput {
  return agentModule.input(
    'message.received',
    { message: { role: 'user', content } },
    { threadId: options.threadId },
  )
}

/**
 * Build the `agent.steered` event: inject a user message mid-run, optionally
 * interrupting the current turn so the agent replans immediately.
 */
export function steer(
  content: string,
  options: AgentSignalOptions & { readonly interrupt?: boolean } = {},
): EventInput {
  return agentModule.input(
    'steered',
    {
      turn: 0,
      interrupt: options.interrupt ?? true,
      message: { role: 'user', content },
    },
    { threadId: options.threadId },
  )
}

export interface AgentSessionMessageOptions extends AgentSignalOptions {
  readonly delivery?: AgentMessageDelivery
  /** Set by the client helper when a steer is aimed at an active child. */
  readonly activeChildThreadId?: string
}

export function submitAgentMessage(
  messageId: string,
  text: string,
  options: AgentSessionMessageOptions = {},
): EventInput {
  return agentModule.input(
    'session.message.submitted',
    {
      messageId,
      text,
      delivery: options.delivery,
      activeChildThreadId: options.activeChildThreadId,
    },
    {
      threadId: options.threadId,
      idempotencyKey: `agent-session-message:${messageId}`,
    },
  )
}

export function cancelAgentTurn(
  childThreadId: string,
  options: AgentSignalOptions = {},
): EventInput[] {
  return [
    agentModule.input('session.cancel.requested', {}, { threadId: options.threadId }),
    {
      type: 'runtime.thread.cancel.requested',
      payload: { threadId: childThreadId },
      threadId: options.threadId,
    },
  ]
}

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
export function agentSessionMessageEvents(
  messageId: string,
  text: string,
  options: AgentSessionMessageOptions = {},
): EventInput[] {
  const events: EventInput[] = [submitAgentMessage(messageId, text, options)]

  if (options.delivery === 'steer' && options.activeChildThreadId) {
    events.push(
      agentModule.input(
        'steered',
        {
          turn: 0,
          messageId,
          message: { role: 'user', content: text },
          interrupt: true,
        },
        { threadId: options.activeChildThreadId },
      ),
    )
  }

  return events
}

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
      agentSessionMessageEvents(messageId, text, {
        ...options,
        threadId,
        activeChildThreadId: active?.childThreadId,
      }),
    )
  })
}

export function cancelActiveAgentTurn<Result>(
  client: AgentSessionSignalClient<Result>,
  runId: string,
  options: AgentSignalOptions = {},
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

    return client.signal(runId, cancelAgentTurn(active.childThreadId, { threadId }))
  })
}
