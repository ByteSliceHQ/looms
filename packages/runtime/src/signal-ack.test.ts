import { describe, expect, test } from 'bun:test'

import { agent, defineAgent, userMessage } from '@looms/agent'

import { createLooms } from './looms'

async function waitFor(predicate: () => Promise<boolean> | boolean, timeoutMs = 2_000) {
  const deadline = Date.now() + timeoutMs

  while (!(await predicate()) && Date.now() < deadline) {
    await Bun.sleep(5)
  }

  if (!(await predicate())) {
    throw new Error('timed out waiting for condition')
  }
}

/** An agent whose turns after the first one wait until the test lets them finish. */
function setup() {
  let turns = 0
  let releaseTurn: (() => void) | undefined

  const assistant = defineAgent({
    name: 'slow-assistant',
    instructions: 'answer',
    conversational: true,
    runTurn: () => {
      turns += 1

      const reply = {
        message: { role: 'assistant' as const, content: `reply ${turns}` },
        done: true,
      }

      if (turns === 1) {
        return Promise.resolve(reply)
      }

      // oxlint-disable-next-line effecttsgo/new-promise
      return new Promise<typeof reply>((resolve) => {
        releaseTurn = () => resolve(reply)
      })
    },
  })

  const looms = createLooms({ modules: [agent({ definitions: [assistant] })] })

  return {
    looms,
    assistant,
    turns: () => turns,
    release: () => releaseTurn?.(),
    turnStarted: () => releaseTurn !== undefined,
  }
}

const replies = (events: readonly { type: string }[]) =>
  events.filter((event) => event.type === 'agent.message').length

describe('a signal that schedules its wake', () => {
  test('resolves once the events are committed, before the run acts on them', async () => {
    const { looms, assistant, release, turnStarted } = setup()
    const { runId, threadId } = await looms.start(assistant, 'hello')
    const before = await looms.getEvents(runId)

    await looms.signal(runId, [userMessage({ content: 'follow up' }, { threadId })], {
      wake: 'schedule',
    })

    // The message is on the log although the turn it starts has not finished.
    const committed = await looms.getEvents(runId)

    expect(committed.length).toBeGreaterThan(before.length)
    expect(replies(committed)).toBe(replies(before))

    await waitFor(turnStarted)
    release()
    await waitFor(async () => replies(await looms.getEvents(runId)) > replies(before))

    await looms.stop()
  })

  test('joins a wake already in progress without waiting for it', async () => {
    const { looms, assistant, release, turnStarted, turns } = setup()
    const { runId, threadId } = await looms.start(assistant, 'hello')

    const first = looms.signal(runId, [userMessage({ content: 'one' }, { threadId })])
    await waitFor(turnStarted)

    await looms.signal(runId, [userMessage({ content: 'two' }, { threadId })], {
      wake: 'schedule',
    })

    // The message may restart the turn it interrupted, so release whichever turn is waiting.
    let parked = false

    void first.then(() => {
      parked = true
    })

    await waitFor(() => {
      release()
      return parked
    })

    expect(turns()).toBeGreaterThanOrEqual(2)
    await looms.stop()
  })

  test('the events it commits carry the idempotency key a client can match them by', async () => {
    const { looms, assistant, release, turnStarted } = setup()
    const { runId, threadId } = await looms.start(assistant, 'hello')

    await looms.fetch(
      new Request(`http://looms.test/runs/${runId}/events?respond=async`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          events: [userMessage({ content: 'hi' }, { threadId })],
          idempotencyKey: 'commit_1',
        }),
      }),
    )

    const listed = await looms.fetch(new Request(`http://looms.test/runs/${runId}/events`))
    // SAFETY: the events route answers `{ events }`.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const body = (await listed?.json()) as { events: { type: string; idempotencyKey?: string }[] }

    expect(body.events.filter((event) => event.idempotencyKey === 'commit_1')).toHaveLength(1)

    await waitFor(turnStarted)
    release()
    await looms.stop()
  })

  test('answers 202 over HTTP when asked to respond async', async () => {
    const { looms, assistant, release, turnStarted } = setup()
    const { runId, threadId } = await looms.start(assistant, 'hello')
    const before = replies(await looms.getEvents(runId))

    const send = (url: string, headers: Record<string, string> = {}) =>
      looms.fetch(
        new Request(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...headers },
          body: JSON.stringify({ events: [userMessage({ content: 'hi' }, { threadId })] }),
        }),
      )

    const byHeader = await send(`http://looms.test/runs/${runId}/events`, {
      prefer: 'respond-async',
    })

    expect(byHeader?.status).toBe(202)
    expect(byHeader?.headers.get('preference-applied')).toBe('respond-async')

    const byQuery = await send(`http://looms.test/runs/${runId}/events?respond=async`)

    expect(byQuery?.status).toBe(202)
    expect(replies(await looms.getEvents(runId))).toBe(before)

    await waitFor(turnStarted)
    release()
    await looms.stop()
  })
})
