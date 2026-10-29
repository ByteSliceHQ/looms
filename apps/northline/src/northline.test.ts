import { describe, expect, test } from 'bun:test'

import { conversation } from '@swirls/looms/agent'
import { decision, pendingApprovals } from '@swirls/looms/approval'
import { createLoomsClient } from '@swirls/looms/client'
import {
  cloudflareQueueWorker,
  createMemoryQueue,
  createQueuePullConsumer,
  workerHandlers,
  type MemoryQueue,
} from '@swirls/looms/cloudflare/queues'
import type { WorkerEffectContext } from '@swirls/looms/core'
import { evaluations } from '@swirls/looms/evaluator'
import { bearerAuth, createLooms, type Looms } from '@swirls/looms/runtime'
import { scheduleStatus } from '@swirls/looms/schedule'
import { moduleConformance } from '@swirls/looms/testing'

import {
  MORNING_SWEEP_RUN_ID,
  dispatcher,
  laneDigest,
  morningSweep,
  recoverShipment,
} from './definitions'
import { deskLlm } from './llm'
import { notices, outbox } from './modules/notices'
import { bookRecovery, booking, recovery } from './modules/recovery'
import { confirmBooking } from './modules/recovery/book'
import { digest, shipments } from './modules/shipments'
import { northlineModules } from './runtime'

const WORKER_TOKEN = 'northline-test-worker'

interface Desk {
  readonly looms: Looms
  readonly queue: MemoryQueue
  stop(): Promise<void>
}

function openDesk(): Desk {
  const queue = createMemoryQueue()

  const looms = createLooms({
    modules: northlineModules({ llm: deskLlm }),
    worker: cloudflareQueueWorker({
      routes: [{ effects: [bookRecovery], queue }],
    }),
    authorize: bearerAuth({ worker: WORKER_TOKEN }),
  })

  const callbacks = createLoomsClient({
    baseUrl: 'http://northline.test',
    workerCallbackToken: WORKER_TOKEN,
    fetch: Object.assign(
      async (input: RequestInfo | URL, init?: RequestInit) =>
        (await looms.fetch(new Request(input, init))) ?? new Response('Not Found', { status: 404 }),
      { preconnect: fetch.preconnect },
    ),
  })

  const consumer = createQueuePullConsumer({
    source: queue,
    callbacks,
    handlers: workerHandlers([[bookRecovery, confirmBooking]]),
  })

  return {
    looms,
    queue,
    stop: async () => {
      await consumer.stop()
      await looms.stop()
    },
  }
}

async function waitFor(
  looms: Looms,
  runId: string,
  ready: () => boolean | Promise<boolean>,
): Promise<void> {
  const deadline = Date.now() + 4_000

  while (!(await ready())) {
    if (Date.now() > deadline) {
      const state = await looms.getRun(runId)
      const root = state.rootThreadId ? state.threads[state.rootThreadId] : undefined

      throw new Error(
        `timed out: run ${state.status}, root ${root?.status ?? 'none'} ${root?.error ?? ''}`,
      )
    }

    await Bun.sleep(20)
  }
}

async function statusOf(looms: Looms, runId: string): Promise<string> {
  return (await looms.getRun(runId)).status
}

describe('Northline modules', () => {
  test('shipments, recovery, and notices conform', () => {
    expect(moduleConformance(shipments)).toEqual([])
    expect(moduleConformance(recovery)).toEqual([])
    expect(moduleConformance(notices)).toEqual([])
  })

  test('a booking id is the effect id, so a retry hits the same partner key', async () => {
    const ctx: WorkerEffectContext = {
      placement: 'worker',
      effectId: 'eff_book',
      runId: 'run_book',
      threadId: 'thr_book',
      causingEventId: 'evt_book',
      signal: new AbortController().signal,
      attributes: {},
      secrets: {},
      trace: null,
      heartbeat: () => Promise.resolve(),
      emit: () => Promise.resolve(),
    }

    const events = await confirmBooking(
      {
        shipmentId: 'nl_1841',
        pro: '1841933',
        destination: 'Des Moines',
        status: 'exception',
        valueUsd: 840,
      },
      ctx,
    )

    expect(events[0]).toMatchObject({
      type: 'recovery.booking.confirmed',
      payload: {
        bookingId: 'eff_book',
        partner: 'Red Cedar Linehaul',
        window: 'Des Moines dock, next morning receiving',
      },
    })
  })
})

describe('recover shipment', () => {
  test('a routine miss books on the worker and emails the consignee', async () => {
    const desk = openDesk()

    try {
      const started = await desk.looms.start(recoverShipment, {
        shipmentId: 'nl_1841',
        openedBy: 'A. Okonkwo',
      })

      await waitFor(
        desk.looms,
        started.runId,
        async () => (await statusOf(desk.looms, started.runId)) === 'completed',
      )

      const state = await desk.looms.getRun(started.runId)
      const root = state.rootThreadId ? state.threads[state.rootThreadId] : undefined

      expect(root?.output).toMatchObject({
        pro: '1841933',
        route: 'auto',
        reason: 'model',
        held: false,
        partner: 'Red Cedar Linehaul',
      })

      const mailed = await desk.looms.project(started.runId, outbox)

      expect(
        mailed.items.some(
          (item) => item.status === 'delivered' && item.to === 'receiving@hartbirch.example',
        ),
      ).toBe(true)

      const scored = await desk.looms.project(started.runId, evaluations)
      expect(scored.items[0]?.route).toBe('auto')
    } finally {
      await desk.stop()
    }
  })

  test('damage waits for a service lead, then books after approval', async () => {
    const desk = openDesk()

    try {
      const started = await desk.looms.start(recoverShipment, {
        shipmentId: 'nl_2208',
        openedBy: 'A. Okonkwo',
      })

      await waitFor(desk.looms, started.runId, async () => {
        const pending = await desk.looms.project(started.runId, pendingApprovals)
        return pending.items.some((item) => item.status === 'pending')
      })

      expect(await desk.looms.project(started.runId, booking)).toEqual({ booking: null })

      const scored = await desk.looms.project(started.runId, evaluations)
      expect(scored.items[0]?.reason).toBe('skipped')
      expect(desk.queue.size()).toBe(0)

      const pending = await desk.looms.project(started.runId, pendingApprovals)
      const approval = pending.items.find((item) => item.status === 'pending')

      if (!approval) {
        throw new Error('expected a pending approval')
      }

      await desk.looms.signal(started.runId, [decision(approval.approvalId, 'approve')])

      await waitFor(
        desk.looms,
        started.runId,
        async () => (await statusOf(desk.looms, started.runId)) === 'completed',
      )

      const booked = await desk.looms.project(started.runId, booking)
      expect(booked.booking?.partner).toBe('Red Cedar Linehaul')
    } finally {
      await desk.stop()
    }
  })

  test('a declined recovery does not call the partner', async () => {
    const desk = openDesk()

    try {
      const started = await desk.looms.start(recoverShipment, {
        shipmentId: 'nl_3902',
        openedBy: 'A. Okonkwo',
      })

      await waitFor(desk.looms, started.runId, async () => {
        const pending = await desk.looms.project(started.runId, pendingApprovals)
        return pending.items.some((item) => item.status === 'pending')
      })

      const pending = await desk.looms.project(started.runId, pendingApprovals)
      const approval = pending.items.find((item) => item.status === 'pending')

      if (!approval) {
        throw new Error('expected a pending approval')
      }

      await desk.looms.signal(started.runId, [decision(approval.approvalId, 'reject')])

      await waitFor(
        desk.looms,
        started.runId,
        async () => (await statusOf(desk.looms, started.runId)) === 'completed',
      )

      expect(await desk.looms.project(started.runId, booking)).toEqual({ booking: null })
      expect(desk.queue.size()).toBe(0)

      const mailed = await desk.looms.project(started.runId, outbox)
      expect(mailed.items.some((item) => item.body.includes('held'))).toBe(true)
    } finally {
      await desk.stop()
    }
  })

  test('an urgent perishable is reviewed because the evaluator said so', async () => {
    const desk = openDesk()

    try {
      const started = await desk.looms.start(recoverShipment, {
        shipmentId: 'nl_5510',
        openedBy: 'A. Okonkwo',
      })

      await waitFor(desk.looms, started.runId, async () => {
        const pending = await desk.looms.project(started.runId, pendingApprovals)
        return pending.items.some((item) => item.status === 'pending')
      })

      const scored = await desk.looms.project(started.runId, evaluations)
      expect(scored.items[0]?.route).toBe('review')
      expect(scored.items[0]?.reason).toBe('model')
    } finally {
      await desk.stop()
    }
  })

  test('a delivered shipment is refused before it reaches the queue', async () => {
    const desk = openDesk()

    try {
      const started = await desk.looms.start(recoverShipment, {
        shipmentId: 'nl_9001',
        openedBy: 'A. Okonkwo',
      })

      await waitFor(
        desk.looms,
        started.runId,
        async () => (await statusOf(desk.looms, started.runId)) === 'failed',
      )

      expect(desk.queue.size()).toBe(0)
      expect(await desk.looms.project(started.runId, booking)).toEqual({ booking: null })
    } finally {
      await desk.stop()
    }
  })

  test('an unknown shipment fails in the actor', async () => {
    const desk = openDesk()

    try {
      const started = await desk.looms.start(recoverShipment, {
        shipmentId: 'nl_missing',
        openedBy: 'A. Okonkwo',
      })

      await waitFor(
        desk.looms,
        started.runId,
        async () => (await statusOf(desk.looms, started.runId)) === 'failed',
      )

      const events = await desk.looms.getEvents(started.runId)
      expect(events.some((event) => event.type === 'recovery.booking.confirmed')).toBe(false)
    } finally {
      await desk.stop()
    }
  })
})

describe('desk and sweep', () => {
  test('the dispatcher looks up a PRO', async () => {
    const desk = openDesk()

    try {
      const started = await desk.looms.start(dispatcher, 'Where is PRO 1841933?')

      await waitFor(desk.looms, started.runId, async () => {
        const lines = await desk.looms.project(started.runId, conversation)
        return lines.lines.some(
          (line) => line.role === 'assistant' && line.content.includes('Hart & Birch'),
        )
      })

      expect(await statusOf(desk.looms, started.runId)).toBe('running')
    } finally {
      await desk.stop()
    }
  })

  test('the morning sweep is a running schedule and the digest counts open lanes', async () => {
    const desk = openDesk()

    try {
      const sweep = await desk.looms.start(morningSweep, null, { runId: MORNING_SWEEP_RUN_ID })
      const status = await desk.looms.project(sweep.runId, scheduleStatus)

      expect(status.status).toBe('running')
      expect(status.nextAt).toEqual(expect.any(Number))

      const digestRun = await desk.looms.start(laneDigest, { at: 1_700_000_000_000 })

      await waitFor(
        desk.looms,
        digestRun.runId,
        async () => (await statusOf(desk.looms, digestRun.runId)) === 'completed',
      )

      const view = await desk.looms.project(digestRun.runId, digest)
      expect(view.open).toBe(5)
      expect(view.at).toBe(1_700_000_000_000)

      expect(view.lanes.map((lane) => lane.destination)).toEqual([
        'Albuquerque',
        'Columbia',
        'Des Moines',
        'Kansas City',
        'Topeka',
      ])
    } finally {
      await desk.stop()
    }
  })
})
