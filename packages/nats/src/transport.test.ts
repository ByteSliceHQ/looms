import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import type { EventEnvelope } from '@looms/core'
import { ReplicaGapError } from '@looms/projectors'

import { LoomsHeaders, natsProjector } from './projector'
import {
  NatsProjectorError,
  WRONG_LAST_SEQUENCE,
  type NatsCommit,
  type NatsProjectorTransport,
  type NatsStoredMessage,
} from './transport'

/** A NATS subject filter as a pattern: `*` is one token, a trailing `>` is one or more. */
function matcher(filter: string): RegExp {
  const pattern = filter
    .split('.')
    .map((token) => {
      if (token === '*') {
        return '[^.]+'
      }

      return token === '>' ? '.+' : token.replaceAll(/[\\^$+?()[\]{}|~]/g, String.raw`\$&`)
    })
    .join(String.raw`\.`)

  return new RegExp(`^${pattern}$`)
}

/** A stream held in an array, behind the interface a host without a NATS connection supplies. */
function memoryTransport(maxBatch?: number) {
  const stored: NatsStoredMessage[] = []
  const commits: NatsCommit[] = []
  let inits = 0

  const last = (filter: string) =>
    stored.findLast((message) => matcher(filter).test(message.subject))

  const transport: NatsProjectorTransport = {
    maxBatch,
    init: () =>
      Effect.sync(() => {
        inits += 1
      }),
    last: (filter) => Effect.sync(() => last(filter) ?? null),
    commit: (batch) =>
      Effect.suspend(() => {
        if ((last(batch.filter)?.streamSeq ?? 0) !== batch.expected) {
          return Effect.fail(
            new NatsProjectorError({
              message: 'wrong last sequence',
              errCode: WRONG_LAST_SEQUENCE,
            }),
          )
        }

        commits.push(batch)

        for (const message of batch.messages) {
          stored.push({
            subject: message.subject,
            streamSeq: stored.length + 1,
            headers: message.headers,
          })
        }

        return Effect.succeed(stored.length)
      }),
  }

  return { transport, stored, commits, inits: () => inits }
}

function envelope(runId: string, seq: number, type = 'test.event.happened'): EventEnvelope {
  return {
    id: `evt_${runId}_${seq}`,
    runId,
    seq,
    ts: 1_700_000_000_000 + seq,
    type,
    payload: { seq },
    threadId: null,
    origin: { type: 'system' },
  }
}

function range(runId: string, from: number, to: number): EventEnvelope[] {
  return Array.from({ length: to - from + 1 }, (_, index) => envelope(runId, from + index))
}

function rejection(promise: Promise<void>): Promise<Error | undefined> {
  return promise.then(
    () => undefined,
    (error: Error) => error,
  )
}

describe('natsProjector over a host transport', () => {
  test('commits each run with the sequence its last message has', async () => {
    const memory = memoryTransport()
    const projector = natsProjector({ transport: memory.transport })

    await projector.project([...range('run_a', 1, 2), ...range('run_b', 1, 1)])
    await projector.project(range('run_a', 3, 3))

    expect(memory.inits()).toBe(1)

    expect(
      memory.commits.map((commit) => [commit.filter, commit.expected, commit.messages.length]),
    ).toEqual([
      ['looms.run.run_a.>', 0, 2],
      ['looms.run.run_b.>', 0, 1],
      ['looms.run.run_a.>', 2, 1],
    ])

    const first = memory.commits[0]?.messages[0]

    expect(first?.subject).toBe('looms.run.run_a.test.event.happened')
    expect(first?.headers[LoomsHeaders.seq]).toBe('1')
    expect(JSON.parse(first?.payload ?? '')).toMatchObject({ runId: 'run_a', seq: 1 })
    expect(await projector.position?.('run_a')).toBe(3)
  })

  test('keeps the redelivery and hole rules', async () => {
    const memory = memoryTransport()
    const projector = natsProjector({ transport: memory.transport })

    await projector.project(range('run_a', 1, 3))
    await projector.project(range('run_a', 1, 3))

    expect(memory.commits).toHaveLength(1)
    expect(await rejection(projector.project(range('run_a', 5, 6)))).toBeInstanceOf(ReplicaGapError)
    expect(memory.stored).toHaveLength(3)
  })

  test('sends no more in a commit than the transport takes', async () => {
    const memory = memoryTransport(2)
    const projector = natsProjector({ transport: memory.transport, maxBatch: 50 })

    await projector.project(range('run_a', 1, 5))

    expect(memory.commits.map((commit) => [commit.expected, commit.messages.length])).toEqual([
      [0, 2],
      [2, 2],
      [4, 1],
    ])
  })

  test('learns a run’s attributes from the stream when the batch has no started event', async () => {
    const memory = memoryTransport()

    const projector = natsProjector({
      transport: memory.transport,
      subjectAttributes: ['orgId', 'projectId'],
    })

    await projector.project([
      {
        ...envelope('run_a', 1, 'runtime.run.started'),
        payload: { attributes: { orgId: 'org_1', projectId: 'proj_1' } },
      },
    ])

    await projector.project(range('run_a', 2, 2))

    expect(memory.commits.map((commit) => commit.filter)).toEqual([
      'looms.run.org_1.proj_1.run_a.>',
      'looms.run.org_1.proj_1.run_a.>',
    ])

    expect(memory.stored.at(-1)?.subject).toBe('looms.run.org_1.proj_1.run_a.test.event.happened')
    expect(await projector.position?.('run_a')).toBe(2)
  })

  test('passes a refused commit on', async () => {
    const memory = memoryTransport()

    const refusing: NatsProjectorTransport = {
      ...memory.transport,
      last: () => Effect.succeed(null),
    }

    const projector = natsProjector({ transport: refusing })

    await projector.project(range('run_a', 1, 1))

    const failure = await rejection(projector.project(range('run_a', 1, 1)))

    expect(failure).toBeInstanceOf(NatsProjectorError)
    expect(failure).toMatchObject({ errCode: WRONG_LAST_SEQUENCE })
  })
})
