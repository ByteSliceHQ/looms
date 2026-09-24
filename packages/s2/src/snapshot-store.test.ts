import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import { EventStoreFencedError, createEvent, emptyRunState, type RunSnapshot } from '@looms/core'

import { findS2Binary, startS2Lite } from './lite'
import { assembleSnapshot, frameSnapshot, s2SnapshotStore } from './snapshot-store'
import { s2 } from './store'

const emptyState = (runId: string): RunSnapshot['state'] => emptyRunState(runId)

describe('frameSnapshot / assembleSnapshot', () => {
  test('round-trips a small snapshot in one frame', () => {
    const snapshot: RunSnapshot = {
      runId: 'run_s',
      cursor: 12,
      stateHash: 'abc',
      takenAt: 1,
      state: emptyState('run_s'),
    }

    const frames = frameSnapshot(snapshot)
    expect(frames).toHaveLength(1)
    expect(assembleSnapshot(frames)).toEqual(snapshot)
  })

  test('round-trips a snapshot larger than one chunk', () => {
    const snapshot: RunSnapshot = {
      runId: 'run_big',
      cursor: 40,
      stateHash: 'big',
      takenAt: 2,
      state: {
        ...emptyState('run_big'),
        threads: {
          t: {
            threadId: 't',
            kind: 'echo',
            definitionName: 'e',
            definitionVersion: 'v1',
            parentThreadId: null,
            status: 'running',
            input: 'x'.repeat(50),
            output: null,
            error: null,
            state: { blob: 'y'.repeat(2000) },
          },
        },
      },
    }

    const frames = frameSnapshot(snapshot, 200)
    expect(frames.length).toBeGreaterThan(1)
    expect(assembleSnapshot(frames)).toEqual(snapshot)
  })

  test('rejects an incomplete trailing set', () => {
    const snapshot: RunSnapshot = {
      runId: 'run_partial',
      cursor: 3,
      stateHash: 'p',
      takenAt: 3,
      state: emptyState('run_partial'),
    }

    const frames = frameSnapshot(
      {
        ...snapshot,
        state: {
          ...snapshot.state,
          threads: {
            t: {
              threadId: 't',
              kind: 'echo',
              definitionName: 'e',
              parentThreadId: null,
              status: 'running',
              input: 'x'.repeat(80),
              output: null,
              error: null,
              state: {},
            },
          },
        },
      },
      40,
    )

    expect(frames.length).toBeGreaterThan(1)
    expect(() => assembleSnapshot(frames.slice(0, -1))).toThrow('Incomplete snapshot')
  })
})

const binary = findS2Binary({})

describe('s2 snapshot store + fencing (s2-lite)', () => {
  test.skipIf(!binary)('saves and loads a framed snapshot', async () => {
    const lite = await startS2Lite()

    try {
      const config = {
        basin: 'snap-test',
        accessToken: 's2_local',
        endpoint: lite.endpoint,
      }

      const snapshots = s2SnapshotStore(config)
      const runId = `run_snap_${Date.now()}`

      const snapshot: RunSnapshot = {
        runId,
        cursor: 9,
        stateHash: 'h9',
        takenAt: Date.now(),
        state: emptyState(runId),
      }

      await Effect.runPromise(snapshots.save(snapshot))
      const loaded = await Effect.runPromise(snapshots.loadLatest(snapshot.runId))
      expect(loaded._tag).toBe('Some')

      if (loaded._tag === 'Some') {
        expect(loaded.value.cursor).toBe(9)
        expect(loaded.value.state.runId).toBe(snapshot.runId)
      }
    } finally {
      lite.stop()
    }
  })

  test.skipIf(!binary)('trim updates bounds and reads skip command records', async () => {
    const lite = await startS2Lite()

    try {
      const store = s2({
        basin: 'trim-test',
        accessToken: 's2_local',
        endpoint: lite.endpoint,
      })

      const runId = `run_trim_${Date.now()}`

      await Effect.runPromise(
        store.append(runId, [
          createEvent(runId, {
            type: 'a',
            payload: {},
            threadId: null,
            origin: { type: 'system' },
          }),
          createEvent(runId, {
            type: 'b',
            payload: {},
            threadId: null,
            origin: { type: 'system' },
          }),
          createEvent(runId, {
            type: 'c',
            payload: {},
            threadId: null,
            origin: { type: 'system' },
          }),
        ]),
      )

      await Effect.runPromise(store.trim!(runId, 3))

      let bounds = await Effect.runPromise(store.bounds!(runId))

      for (let i = 0; i < 20 && bounds.head < 3; i++) {
        await new Promise((resolve) => setTimeout(resolve, 50))
        bounds = await Effect.runPromise(store.bounds!(runId))
      }

      expect(bounds.head).toBeGreaterThanOrEqual(3)
      const events = await Effect.runPromise(store.read(runId))
      expect(events.every((event) => event.seq >= 3)).toBe(true)
    } finally {
      lite.stop()
    }
  })

  test.skipIf(!binary)(
    'fence then mismatched fencingToken fails with EventStoreFencedError',
    async () => {
      const lite = await startS2Lite()

      try {
        const store = s2({
          basin: 'fence-test',
          accessToken: 's2_local',
          endpoint: lite.endpoint,
        })

        const runId = `run_fence_${Date.now()}`

        const first = await Effect.runPromise(
          store.append(
            runId,
            [
              createEvent(runId, {
                type: 'a',
                payload: {},
                threadId: null,
                origin: { type: 'system' },
              }),
            ],
            { fence: 'tok-a' },
          ),
        )

        expect(first.sequences).toEqual([2])

        let caught: unknown

        try {
          await Effect.runPromise(
            store.append(
              runId,
              [
                createEvent(runId, {
                  type: 'b',
                  payload: {},
                  threadId: null,
                  origin: { type: 'system' },
                }),
              ],
              { fencingToken: 'tok-b' },
            ),
          )
        } catch (err) {
          caught = err
        }

        expect(caught).toBeInstanceOf(EventStoreFencedError)
      } finally {
        lite.stop()
      }
    },
  )
})
