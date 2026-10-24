import { describe, expect, test } from 'bun:test'

import { Effect, Predicate } from 'effect'

import { approval, decision, gate, pendingApprovals } from '@swirls/looms/approval'
import {
  defineProjection,
  isJsonObject,
  makeMemoryEventStore,
  memoryBlobStore,
  snapshotStoreOf,
  withBlobOffload,
} from '@swirls/looms/core'
import { createLooms } from '@swirls/looms/runtime'
import { defineWorkflow, workflow } from '@swirls/looms/workflow'

import { containsSecret, rootOutput, waitForStatus } from './helpers'

const SECRET = 'sk_live_parity_never_logged'

describe('swirls-parity approval, blobs, and secrets', () => {
  test('a long-lived approval times out and can be rejected', async () => {
    const review = defineWorkflow({
      name: 'parity-review',
      nodes: [
        {
          id: 'ask',
          run: (ctx) =>
            // Seven days from "now" in production; a near deadline keeps the suite fast.
            ctx.effects(gate({ title: 'Ship the release?', timeoutAt: Date.now() + 40 })),
        },
        {
          id: 'done',
          deps: ['ask'],
          run: (ctx) => {
            const ask = ctx.results.ask
            const outcome = isJsonObject(ask) ? (ask.outcome ?? null) : null
            return { outcome }
          },
        },
      ],
      output: ({ results }) => results.done ?? null,
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [review] }), approval()],
    })

    const timed = await looms.start(review, null, { runId: 'parity_approval_timeout' })
    await Bun.sleep(50)
    await looms.wake(timed.runId)

    const timedState = await looms.getRun(timed.runId)
    const timedEvents = await looms.getEvents(timed.runId)
    const timedOut = timedEvents.some(
      (event) =>
        event.type === 'runtime.wait.satisfied' &&
        Predicate.isObject(event.payload) &&
        Predicate.isObject(event.payload.tag) &&
        event.payload.tag.outcome === 'timeout',
    )

    expect(timedOut).toBe(true)
    expect(timedState.status).toBe('failed')

    const rejected = await looms.start(review, null, { runId: 'parity_approval_reject' })
    const pending = await looms.project(rejected.runId, pendingApprovals)
    const approvalId = pending.items.find((item) => item.status === 'pending')?.approvalId

    expect(approvalId).toEqual(expect.any(String))

    await looms.signal(rejected.runId, [decision(approvalId!, 'reject')])
    const after = await waitForStatus(looms, rejected.runId, 'completed')
    expect(rootOutput(after)).toEqual({ outcome: 'reject' })

    await looms.stop()
  })

  test('a 1.5 MB node output survives blob offload', async () => {
    const payload = 'x'.repeat(1_500_000)

    const bulky = defineWorkflow({
      name: 'parity-bulky',
      nodes: [{ id: 'emit', run: () => ({ blob: payload }) }],
      output: ({ results }) => results.emit ?? null,
    })

    const blobs = memoryBlobStore()
    const store = withBlobOffload(await Effect.runPromise(makeMemoryEventStore), blobs)
    const looms = createLooms({
      store,
      blobStore: blobs,
      modules: [workflow({ definitions: [bulky] })],
    })

    const started = await looms.start(bulky, null)
    const state = await waitForStatus(looms, started.runId, 'completed')
    const output = rootOutput(state)

    expect(isJsonObject(output) && output.blob).toBe(payload)

    const events = await looms.getEvents(started.runId)
    const raw = JSON.stringify(events)
    // Resolved reads hide the claim check; the UTF-8 size proves the value was not dropped.
    expect(raw.length).toBeGreaterThan(1_500_000)
    expect(raw.includes(payload)).toBe(true)

    await looms.stop()
  })

  test('a secret context never appears in events, snapshots, projections, or HTTP', async () => {
    const seen = defineWorkflow({
      name: 'parity-secret',
      nodes: [{ id: 'ok', run: () => ({ ok: true }) }],
      output: ({ results }) => results.ok ?? null,
    })

    const store = await Effect.runPromise(makeMemoryEventStore)
    const snapshots = snapshotStoreOf(store)

    const looms = createLooms({
      store,
      modules: [workflow({ definitions: [seen] })],
    })

    const started = await looms.start(seen, null, {
      runId: 'parity_secret',
      attributes: { tenant: 'acme' },
      secrets: { token: SECRET },
    })

    await waitForStatus(looms, started.runId, 'completed')

    const events = await looms.getEvents(started.runId)
    const state = await looms.getRun(started.runId)
    const snapshot = snapshots
      ? await Effect.runPromise(snapshots.loadLatest('parity_secret'))
      : null
    const projected = await looms.project(
      started.runId,
      defineProjection({
        name: 'parity-secret-fold',
        initialState: { count: 0 },
        reduce: (acc) => ({ count: acc.count + 1 }),
      }),
    )

    expect(containsSecret(events, SECRET)).toBe(false)
    expect(containsSecret(state, SECRET)).toBe(false)
    expect(containsSecret(started, SECRET)).toBe(false)
    expect(containsSecret(snapshot, SECRET)).toBe(false)
    expect(containsSecret(projected, SECRET)).toBe(false)

    const response = await looms.fetch(new Request('http://looms.test/runs/parity_secret'))
    const body = response ? await response.text() : ''
    expect(body.includes(SECRET)).toBe(false)

    await looms.stop()
  })
})
