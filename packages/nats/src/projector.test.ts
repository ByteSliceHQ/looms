import { Database } from 'bun:sqlite'
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { jetstreamManager, type JetStreamManager } from '@nats-io/jetstream'
import type { NatsConnection } from '@nats-io/nats-core'
import { connect } from '@nats-io/transport-node'
import { Effect } from 'effect'

import { createEvent, makeMemoryEventStore, type EventEnvelope } from '@looms/core'
import { bunSqliteExec, bunSqliteEventStore } from '@looms/core/bun-sqlite'
import {
  createProjectorDelivery,
  ReplicaGapError,
  sqliteProjectorCursorStore,
  withProjectors,
} from '@looms/projectors'

import { LoomsHeaders, natsProjector } from './projector'
import { NatsProjectorError } from './transport'

function findNatsServer(): string | undefined {
  const explicit = process.env.NATS_SERVER_BIN

  if (explicit && fs.existsSync(explicit)) {
    return explicit
  }

  const candidates = (process.env.PATH ?? '')
    .split(path.delimiter)
    .filter(Boolean)
    .map((dir) => path.join(dir, 'nats-server'))

  const floxRun = path.resolve(import.meta.dir, '../../../.flox/run')

  if (fs.existsSync(floxRun)) {
    for (const env of fs.readdirSync(floxRun)) {
      candidates.push(path.join(floxRun, env, 'bin', 'nats-server'))
    }
  }

  return candidates.find((candidate) => fs.existsSync(candidate))
}

function freePort(): number {
  const probe = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: () => new Response() })
  const port = probe.port

  void probe.stop(true)
  return port ?? 0
}

/** The error a promise rejects with, or `undefined` when it resolves. */
function rejection(promise: Promise<void> | undefined): Promise<Error | undefined> {
  return Promise.resolve(promise).then(
    () => undefined,
    (error: Error) => error,
  )
}

const binary = findNatsServer()

// CI sets this so a missing binary fails the run instead of skipping every test.
if (!binary && process.env.LOOMS_REQUIRE_NATS === '1') {
  throw new Error('LOOMS_REQUIRE_NATS=1 but nats-server is not on PATH or NATS_SERVER_BIN')
}

let server: ReturnType<typeof Bun.spawn> | undefined
let storeDir = ''
let url = ''
let nc: NatsConnection
let jsm: JetStreamManager
let streamCount = 0

beforeAll(async () => {
  if (!binary) {
    return
  }

  const port = freePort()
  storeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'looms-nats-'))
  url = `127.0.0.1:${port}`

  server = Bun.spawn([binary, '-js', '-a', '127.0.0.1', '-p', String(port), '-sd', storeDir], {
    stdout: 'ignore',
    stderr: 'ignore',
  })

  for (let tries = 0; ; tries++) {
    try {
      nc = await connect({ servers: url, reconnect: false })
      break
    } catch (error) {
      if (tries > 50) {
        throw error
      }

      await Bun.sleep(100)
    }
  }

  jsm = await jetstreamManager(nc)
})

afterAll(async () => {
  await nc?.close()
  server?.kill()
  await server?.exited

  if (storeDir) {
    fs.rmSync(storeDir, { recursive: true, force: true })
  }
})

/** A fresh stream and prefix per test, so tests share one server without seeing each other. */
function isolated() {
  streamCount += 1
  return { stream: `LOOMS_T${streamCount}`, subjectPrefix: `t${streamCount}` }
}

function envelope(runId: string, seq: number, type = 'test.event.happened'): EventEnvelope {
  return {
    id: `evt_${runId}_${seq}`,
    runId,
    seq,
    ts: 1_700_000_000_000 + seq,
    type,
    payload: { seq },
    threadId: seq % 2 === 0 ? 'thread_a' : null,
    origin: { type: 'system' },
  }
}

function range(runId: string, from: number, to: number): EventEnvelope[] {
  return Array.from({ length: to - from + 1 }, (_, index) => envelope(runId, from + index))
}

interface Stored {
  readonly subject: string
  readonly runId: string | undefined
  readonly seq: number
  readonly body: EventEnvelope
}

async function readStream(stream: string): Promise<Stored[]> {
  const info = await jsm.streams.info(stream)
  const stored: Stored[] = []

  for (let seq = info.state.first_seq; seq <= info.state.last_seq && seq > 0; seq++) {
    const message = await jsm.streams.getMessage(stream, { seq })

    if (message) {
      stored.push({
        subject: message.subject,
        runId: message.header.get(LoomsHeaders.runId),
        seq: Number(message.header.get(LoomsHeaders.seq)),
        body: message.json<EventEnvelope>(),
      })
    }
  }

  return stored
}

function seqsFor(stored: readonly Stored[], runId: string): number[] {
  return stored.filter((message) => message.runId === runId).map((message) => message.seq)
}

describe.skipIf(!binary)('natsProjector', () => {
  test('replicates appends through withProjectors with typed subjects and headers', async () => {
    const names = isolated()
    const projector = natsProjector({ connection: nc, ...names })
    const store = withProjectors(bunSqliteEventStore(), [projector])
    const runId = 'run_e2e'

    await Effect.runPromise(
      store.append(runId, [
        createEvent(runId, {
          type: 'runtime.run.started',
          payload: { input: 'hi' },
          threadId: null,
          origin: { type: 'system' },
        }),
        createEvent(runId, {
          type: 'runtime.thread.started',
          payload: { threadId: 't' },
          threadId: 't',
          origin: { type: 'system' },
        }),
      ]),
    )

    const stored = await readStream(names.stream)

    expect(stored.map((message) => message.subject)).toEqual([
      `${names.subjectPrefix}.run.run_e2e.runtime.run.started`,
      `${names.subjectPrefix}.run.run_e2e.runtime.thread.started`,
    ])

    const local = await Effect.runPromise(store.read(runId))

    expect(stored.map((message) => message.body)).toEqual(
      local.map((event) => ({ ...event, ephemeral: event.ephemeral })),
    )

    expect(await projector.position?.(runId)).toBe(2)
  })

  test('skips events it already published, so redelivery is a no-op', async () => {
    const names = isolated()
    const projector = natsProjector({ connection: nc, ...names })

    await projector.project(range('run_a', 1, 3))
    await projector.project(range('run_a', 1, 3))
    await projector.project(range('run_a', 2, 5))

    expect(seqsFor(await readStream(names.stream), 'run_a')).toEqual([1, 2, 3, 4, 5])
  })

  test('refuses a batch that starts after a hole', async () => {
    const names = isolated()
    const projector = natsProjector({ connection: nc, ...names })

    await projector.project(range('run_gap', 1, 2))

    const failure = await rejection(projector.project(range('run_gap', 4, 5)))

    expect(failure).toBeInstanceOf(ReplicaGapError)
    expect(failure).toMatchObject({ runId: 'run_gap', replicatedSeq: 2, batchFrom: 4 })
    expect(seqsFor(await readStream(names.stream), 'run_gap')).toEqual([1, 2])
  })

  test('keeps runs apart, including run ids that need escaping', async () => {
    const names = isolated()
    const projector = natsProjector({ connection: nc, ...names })

    await projector.project([...range('run.x', 1, 2), ...range('run~2Ex', 1, 3)])

    expect(await projector.position?.('run.x')).toBe(2)
    expect(await projector.position?.('run~2Ex')).toBe(3)
    expect(await projector.position?.('run_unknown')).toBe(0)
  })

  test('splits large batches without losing order', async () => {
    const names = isolated()
    const projector = natsProjector({ connection: nc, ...names, maxBatch: 2 })

    await projector.project(range('run_chunks', 1, 7))

    expect(seqsFor(await readStream(names.stream), 'run_chunks')).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  test('two writers racing on one run still leave one ordered copy', async () => {
    const names = isolated()
    const first = natsProjector({ connection: nc, ...names })
    const second = natsProjector({ connection: nc, ...names })
    await first.init?.()

    const events = range('run_race', 1, 40)

    const results = await Promise.allSettled(
      [first, second, first, second].map((projector) => projector.project(events)),
    )

    for (const result of results) {
      if (result.status === 'rejected') {
        expect(result.reason).toBeInstanceOf(NatsProjectorError)
      }
    }

    await first.project(events)

    expect(seqsFor(await readStream(names.stream), 'run_race')).toEqual(
      events.map((event) => event.seq),
    )
  })

  test('durable delivery rewinds and refills a stream that lost its messages', async () => {
    const names = isolated()
    const projector = natsProjector({ connection: nc, ...names })
    const source = await Effect.runPromise(makeMemoryEventStore)

    const delivery = createProjectorDelivery(
      source,
      [projector],
      sqliteProjectorCursorStore(bunSqliteExec(new Database(':memory:'))),
    )

    const append = (count: number) =>
      Effect.runPromise(
        source.append(
          'run_refill',
          Array.from({ length: count }, () =>
            createEvent('run_refill', {
              type: 'test.event.happened',
              payload: {},
              threadId: null,
              origin: { type: 'system' },
            }),
          ),
        ),
      )

    await append(3)
    await Effect.runPromise(delivery.deliver('run_refill'))
    await jsm.streams.purge(names.stream)
    await append(1)
    await Effect.runPromise(delivery.deliver('run_refill'))

    expect(seqsFor(await readStream(names.stream), 'run_refill')).toEqual([1, 2, 3, 4])
  })

  test('files a run under its attributes, from the started event and then from the stream', async () => {
    const names = isolated()

    const projector = natsProjector({
      connection: nc,
      ...names,
      subjectAttributes: ['orgId', 'projectId'],
    })

    const started = (runId: string, attributes: { [key: string]: string }): EventEnvelope => ({
      ...envelope(runId, 1, 'runtime.run.started'),
      payload: { attributes },
    })

    await projector.project([started('run_attr', { orgId: 'org_1', projectId: 'p.1' })])
    // A later batch has no started event: the run's subjects come from its last message.
    await projector.project(range('run_attr', 2, 3))
    await projector.project([started('run_other', { orgId: 'org_2' }), envelope('run_other', 2)])

    const root = `${names.subjectPrefix}.run`

    expect((await readStream(names.stream)).map((message) => message.subject)).toEqual([
      `${root}.org_1.p~2E1.run_attr.runtime.run.started`,
      `${root}.org_1.p~2E1.run_attr.test.event.happened`,
      `${root}.org_1.p~2E1.run_attr.test.event.happened`,
      `${root}.org_2.~.run_other.runtime.run.started`,
      `${root}.org_2.~.run_other.test.event.happened`,
    ])

    expect(await projector.position?.('run_attr')).toBe(3)
    expect(await projector.position?.('run_other')).toBe(2)
    expect(await projector.position?.('org_1')).toBe(0)

    const org1 = await jsm.streams.getMessage(names.stream, { last_by_subj: `${root}.org_1.>` })
    expect(org1?.header.get(LoomsHeaders.runId)).toBe('run_attr')
  })

  test('keeps the hole and redelivery rules with attributes in the subject', async () => {
    const names = isolated()
    const projector = natsProjector({ connection: nc, ...names, subjectAttributes: ['orgId'] })

    await projector.project(range('run_plain', 1, 2))
    await projector.project(range('run_plain', 1, 3))

    const failure = await rejection(projector.project(range('run_plain', 5, 6)))

    expect(failure).toBeInstanceOf(ReplicaGapError)

    expect((await readStream(names.stream)).map((message) => message.subject)).toEqual(
      Array.from({ length: 3 }, () => `${names.subjectPrefix}.run.~.run_plain.test.event.happened`),
    )
  })

  test('marks ephemeral events in a header', async () => {
    const names = isolated()
    const projector = natsProjector({ connection: nc, ...names })

    await projector.project([{ ...envelope('run_eph', 1), ephemeral: true }])

    const message = await jsm.streams.getMessage(names.stream, { seq: 1 })
    expect(message?.header.get(LoomsHeaders.ephemeral)).toBe('true')
    expect(message?.header.get(LoomsHeaders.type)).toBe('test.event.happened')
  })

  test('refuses an existing stream without atomic batches', async () => {
    const names = isolated()
    await jsm.streams.add({ name: names.stream, subjects: [`${names.subjectPrefix}.run.>`] })
    const projector = natsProjector({ connection: nc, ...names })

    expect((await rejection(projector.init?.()))?.message).toContain('allow_atomic')
  })

  test('does not create the stream when createStream is false', async () => {
    const names = isolated()
    const projector = natsProjector({ connection: nc, ...names, createStream: false })

    expect((await rejection(projector.init?.()))?.message).toContain('does not exist')
  })

  test('opens a connection lazily and drains it on dispose', async () => {
    const names = isolated()
    let opened: NatsConnection | undefined

    const projector = natsProjector({
      ...names,
      connect: async () => {
        opened = await connect({ servers: url })
        return opened
      },
    })

    expect(opened).toBeUndefined()
    await projector.project(range('run_lazy', 1, 1))
    expect(opened?.isClosed()).toBe(false)

    await projector.dispose?.()
    expect(opened?.isClosed()).toBe(true)
  })

  test('rejects an invalid subject prefix up front', () => {
    expect(() => natsProjector({ connection: nc, subjectPrefix: 'looms.>' })).toThrow(
      'Subject prefix',
    )
  })
})
