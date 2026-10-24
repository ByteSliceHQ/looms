import { describe, expect, test } from 'bun:test'

import { Effect, Schema } from 'effect'
import { z } from 'zod'

import {
  agent,
  defaultAgentCompactor,
  defineAgent,
  defineAgentSession,
  sendAgentSessionMessage,
  stopAgentTurn,
  submitAgentMessage,
  STRUCTURED_OUTPUT_TOOL_NAME,
} from '@swirls/looms/agent'
import { makeMemoryEventStore } from '@swirls/looms/core'
import { withProjectors } from '@swirls/looms/projectors'
import { memoryEventLog } from '@swirls/looms/projectors/postgres'
import { createLooms } from '@swirls/looms/runtime'
import { cron, defineSchedule, nextFireAt } from '@swirls/looms/schedule'
import { defineWorkflow, workflow } from '@swirls/looms/workflow'

import { waitFor, waitForStatus } from './helpers'

function rootOutput(state: Awaited<ReturnType<ReturnType<typeof createLooms>['getRun']>>) {
  return state.rootThreadId ? state.threads[state.rootThreadId]?.output : undefined
}

describe('swirls-parity agent, schedule, and projector', () => {
  test('structured output is accepted through submit_output', async () => {
    const structured = defineAgent({
      name: 'parity-structured',
      instructions: 'Return structured output.',
      output: Schema.Struct({ answer: Schema.String, confidence: Schema.Number }),
      runTurn: ({ turn }) => {
        if (turn === 1) {
          return {
            message: { role: 'assistant', content: '' },
            toolCalls: [
              {
                id: 'call_1',
                name: STRUCTURED_OUTPUT_TOOL_NAME,
                arguments: { answer: '42', confidence: 0.99 },
              },
            ],
          }
        }

        return { message: { role: 'assistant', content: 'done' } }
      },
    })

    const looms = createLooms({ modules: [agent({ definitions: [structured] })] })
    const result = await looms.start(structured, null)

    expect(rootOutput(result.state)).toEqual({ answer: '42', confidence: 0.99 })
    await looms.stop()
  })

  test('an agent session handles many turns, steering, cancellation, and compaction', async () => {
    let compacted = 0
    let turnsStarted = 0
    const usages: Array<{ input: number; output: number }> = []

    const responder = defineAgent({
      name: 'parity-responder',
      input: z.object({ text: z.string() }),
      instructions: 'Reply briefly.',
      compact: (ctx) => {
        compacted += 1
        return defaultAgentCompactor(ctx)
      },
      trackUsage: (usage) => {
        usages.push(usage)
      },
      runTurn: async ({ input }) => {
        turnsStarted += 1
        // Force one overflow recovery mid-suite so compaction is exercised.
        if (turnsStarted === 20 && compacted === 0) {
          throw new Error('context_length_exceeded: prompt is too long')
        }

        // Slow turn so a concurrent steer/stop can land mid-flight.
        if (input.text === 'slow-for-steer') {
          await Bun.sleep(250)
        }

        return {
          message: { role: 'assistant', content: `ok:${input.text}` },
          done: true,
          output: { reply: input.text },
          usage: { input: 3, output: 2 },
        }
      },
    })

    const session = defineAgentSession({
      name: 'parity-session',
      agent: responder,
      idleTimeoutMs: 60_000,
    })

    const looms = createLooms({
      modules: [agent({ definitions: [responder, session] })],
      maxWakeIterations: 2_000,
    })

    const { runId, threadId } = await looms.start(session, null)
    const batchSize = 25
    const turns = 500

    for (let offset = 0; offset < turns; offset += batchSize) {
      const batch = Array.from({ length: Math.min(batchSize, turns - offset) }, (_, index) =>
        submitAgentMessage(`m-${offset + index}`, `turn-${offset + index}`, {
          delivery: 'followUp',
          threadId,
        }),
      )

      await looms.signal(runId, batch)
      const target = Math.min(offset + batch.length, turns)
      await waitFor(async () => {
        const events = await looms.getEvents(runId)
        return events.filter((event) => event.type === 'agent.session.turn.closed').length >= target
      }, 60_000)
    }

    // Do not await: wake stays busy in the slow runTurn while we steer/stop.
    const slowTurn = looms.signal(runId, [
      submitAgentMessage('slow-1', 'slow-for-steer', { delivery: 'followUp', threadId }),
    ])

    await Bun.sleep(20)

    await sendAgentSessionMessage(looms, runId, 'steer-1', 'change course', {
      delivery: 'steer',
      threadId,
    })

    await waitFor(async () =>
      (await looms.getEvents(runId)).some((event) => event.type === 'agent.steered'),
    )

    const childThreadId = (await looms.getEvents(runId))
      .filter((event) => event.type === 'runtime.thread.started')
      .map((event) => event.threadId)
      .filter((id): id is string => typeof id === 'string' && id !== threadId)
      .at(-1)

    await looms.signal(runId, [stopAgentTurn({ threadId: childThreadId ?? threadId })])
    await slowTurn

    const events = await looms.getEvents(runId)
    const closed = events.filter((event) => event.type === 'agent.session.turn.closed')

    expect(closed.length).toBeGreaterThanOrEqual(turns)
    expect(usages.length).toBeGreaterThan(0)
    expect(compacted).toBeGreaterThan(0)
    expect(events.some((event) => event.type === 'agent.steered')).toBe(true)
    expect(events.some((event) => event.type === 'agent.turn.stopped')).toBe(true)

    await looms.stop()
  }, 180_000)

  test('a cron schedule skips the missing hour across a daylight-saving change', () => {
    const spec = cron('0 2 * * *', { tz: 'Europe/Paris' })
    const before = Date.parse('2026-03-28T01:00:00Z')
    const next = nextFireAt(spec, before)

    expect(next).not.toBeNull()
    // Europe/Paris springs forward 2026-03-29; 02:00 local does not exist that morning.
    expect(new Date(next!).toISOString()).toBe('2026-03-29T01:00:00.000Z')

    const report = defineWorkflow({
      name: 'parity-dst-report',
      nodes: [{ id: 'write', run: (ctx) => ctx.input ?? null }],
    })

    const nightly = defineSchedule({
      name: 'parity-dst-nightly',
      target: report,
      spec,
      input: ({ at }) => ({ at }),
    })

    expect(nightly.spec).toEqual(spec)
  })

  test('an event-log projector rebuilt from cursor 0 matches the live projection', async () => {
    const unit = defineWorkflow({
      name: 'parity-log-unit',
      nodes: [{ id: 'out', run: () => ({ ok: true }) }],
      output: ({ results }) => results.out ?? null,
    })

    const live = memoryEventLog()
    const rebuilt = memoryEventLog()
    const store = withProjectors(await Effect.runPromise(makeMemoryEventStore), [live])

    const looms = createLooms({
      store,
      modules: [workflow({ definitions: [unit] })],
    })

    const first = await looms.start(unit, null, {
      runId: 'parity_log_a',
      attributes: { tenant: 'a' },
    })
    const second = await looms.start(unit, null, {
      runId: 'parity_log_b',
      attributes: { tenant: 'b' },
    })

    await waitForStatus(looms, first.runId, 'completed')
    await waitForStatus(looms, second.runId, 'completed')

    const eventsA = await looms.getEvents(first.runId)
    const eventsB = await looms.getEvents(second.runId)

    await rebuilt.project([...eventsA, ...eventsB])

    expect(rebuilt.events(first.runId).map((entry) => entry.seq)).toEqual(
      live.events(first.runId).map((entry) => entry.seq),
    )
    expect(rebuilt.events(second.runId).map((entry) => entry.seq)).toEqual(
      live.events(second.runId).map((entry) => entry.seq),
    )
    expect(rebuilt.run(first.runId)).toMatchObject(live.run(first.runId) ?? {})
    expect(rebuilt.run(second.runId)).toMatchObject(live.run(second.runId) ?? {})

    await looms.stop()
  })
})
