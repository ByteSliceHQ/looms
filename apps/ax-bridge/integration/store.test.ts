import { afterAll, afterEach, beforeEach, expect, test } from 'bun:test'
import { randomBytes } from 'node:crypto'

import { Config, Effect } from 'effect'
import postgres from 'postgres'

import type { Job } from '../src/model'
import { postgresJobStore } from '../src/store'

// Each test creates and drops its own database; the supplied role must have CREATEDB.
const adminUrl = Effect.runSync(Config.string('AX_TEST_DATABASE_URL'))
const database = `looms_ax_test_${randomBytes(8).toString('hex')}`
const url = new URL(adminUrl)
url.pathname = `/${database}`
const admin = postgres(adminUrl, { max: 1 })
let store: Awaited<ReturnType<typeof postgresJobStore>>

beforeEach(async () => {
  await admin`CREATE DATABASE ${admin(database)}`
  store = await postgresJobStore(url.href)
})

afterEach(async () => {
  try {
    await store.close()
  } finally {
    await admin`DROP DATABASE ${admin(database)} WITH (FORCE)`
  }
})

afterAll(async () => {
  await admin.end({ timeout: 5 })
})

function job(id: string): Job {
  return {
    id,
    logicalKey: id,
    requestHash: 'same-request',
    submission: {
      protocol: 1,
      scope: 'test',
      callbackTarget: 'test',
      profile: 'fixture-v1',
      task: { runId: 'run', effectId: id, attempt: 1, type: 'test.work', input: {} },
    },
    profile: {
      id: 'fixture-v1',
      effectType: 'test.work',
      image: `fixture@sha256:${'a'.repeat(64)}`,
      command: ['test'],
      gateway: 'test',
      allowedEvents: ['test.done'],
      maxDurationMs: 60_000,
    },
    cancelled: false,
    launched: false,
    stopped: false,
    instance: null,
    outcome: null,
    outcomeDigest: null,
    delivery: 'pending',
    createdAt: 0,
    expiresAt: 60_000,
    lastError: null,
  }
}

test('concurrent acceptance preserves cancellation and rejects conflicting input', async () => {
  const submitted = job('concurrent')

  await Promise.all(
    Array.from({ length: 20 }, (_, index) =>
      store.accept({ ...submitted, cancelled: index === 5 }),
    ),
  )

  expect((await store.get(submitted.id))?.cancelled).toBe(true)
  expect(await store.siblings(submitted.logicalKey)).toHaveLength(1)

  const conflict = await Promise.allSettled([
    store.accept({ ...submitted, requestHash: 'different' }),
  ])

  expect(conflict[0]?.status).toBe('rejected')

  await store.close()
  store = await postgresJobStore(url.href)
  expect((await store.get(submitted.id))?.cancelled).toBe(true)
})

test('row locking admits only one worker under concurrent claims', async () => {
  await store.accept(job('claim'))

  const claims = await Promise.allSettled(
    Array.from({ length: 20 }, (_, index) =>
      store.update('claim', (current) => {
        if (current.instance !== null) {
          throw new Error('Already claimed')
        }

        return { ...current, instance: `worker-${index}` }
      }),
    ),
  )

  expect(claims.filter((claim) => claim.status === 'fulfilled')).toHaveLength(1)
  expect(claims.filter((claim) => claim.status === 'rejected')).toHaveLength(19)
})

test('unresolved batches cannot starve later jobs', async () => {
  await Promise.all(Array.from({ length: 210 }, (_, index) => store.accept(job(`job-${index}`))))
  const first = await store.pending()
  const second = await store.pending()
  expect(first).toHaveLength(200)
  expect(new Set([...first, ...second].map((pending) => pending.id)).size).toBe(210)

  await store.update('job-0', (current) => ({ ...current, stopped: true, delivery: 'applied' }))
  expect((await store.pending()).some((pending) => pending.id === 'job-0')).toBe(false)
})

test('a second reconciler cannot own the same database', async () => {
  const second = await postgresJobStore(url.href).then(
    async (unexpected) => {
      await unexpected.close()
      return 'acquired'
    },
    () => 'rejected',
  )

  expect(second).toBe('rejected')
  await store.close()
  store = await postgresJobStore(url.href)
  expect(await store.pending()).toHaveLength(0)
})
