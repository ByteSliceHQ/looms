import { describe, expect, test } from 'bun:test'

import type { DebuggerEvent } from '../contracts'
import { createEventCatalog } from '../events/catalog'
import { getEventMeta } from './event-meta'

function makeEvent(seq: number, type: string, threadId = 'thr_1'): DebuggerEvent {
  return {
    id: `evt_${seq}`,
    runId: 'run_1',
    seq,
    ts: 1000 + seq,
    type,
    payload: { text: `message_${seq}` },
    threadId,
  }
}

describe('Event meta index and caching', () => {
  test('caches event summary and search text on the event object', () => {
    const catalog = createEventCatalog()
    const evt = makeEvent(1, 'runtime.run.started')

    const meta1 = getEventMeta(evt, catalog)
    expect(meta1.family).toBe('runtime')
    expect(meta1.summary.title).toBeDefined()
    expect(meta1.searchText).toContain('runtime.run.started')

    // Second call should return the exact same object reference
    const meta2 = getEventMeta(evt, catalog)
    expect(meta2).toBe(meta1)
  })

  test('multiple events retain independent cached metadata', () => {
    const catalog = createEventCatalog([
      {
        name: 'agent',
        families: [{ family: 'agent', color: 'oklch(0.74 0.12 240)' }],
      },
    ])

    const evt1 = makeEvent(1, 'runtime.run.started')
    const evt2 = makeEvent(2, 'agent.message')

    const meta1 = getEventMeta(evt1, catalog)
    const meta2 = getEventMeta(evt2, catalog)

    expect(meta1).not.toBe(meta2)
    expect(meta1.family).toBe('runtime')
    expect(meta2.family).toBe('agent')

    expect(getEventMeta(evt1, catalog)).toBe(meta1)
    expect(getEventMeta(evt2, catalog)).toBe(meta2)
  })
})
