import { describe, expect, test } from 'bun:test'

import { createEvent, type JsonValue } from '@looms/core'

import type { DebuggerPlugin } from '../plugin'
import { createEventCatalog, searchText, summarizeEvent } from './catalog'
import { summarizeProtocolEvent } from './protocol-summarize'

const runId = 'run_catalog'

function event(type: string, payload: JsonValue, threadId: string | null = 'thr_a') {
  return createEvent(runId, { type, payload, threadId, id: 'evt_1', ts: 10 })
}

describe('summarizeProtocolEvent', () => {
  test('summarizes runtime events', () => {
    expect(
      summarizeProtocolEvent(
        event('runtime.run.started', { kind: 'workflow', definitionName: 'checkout', input: null }),
      ),
    ).toEqual({ title: 'run started', detail: 'workflow:checkout' })

    expect(
      summarizeProtocolEvent(
        event('runtime.wait.registered', { waitId: 'wait_1', on: { type: 'approval.decided' } }),
      ),
    ).toEqual({ title: 'wait registered', detail: 'approval.decided' })
  })

  test('returns undefined for domain events', () => {
    expect(
      summarizeProtocolEvent(
        event('agent.message', { message: { role: 'assistant', content: 'hi' } }),
      ),
    ).toBeUndefined()
  })
})

describe('summarizeEvent', () => {
  test('falls back to the event type when no plugin claims it', () => {
    expect(summarizeEvent(event('custom.unknown', { foo: 1 }))).toEqual({
      title: 'custom.unknown',
      detail: '{"foo":1}',
    })
  })
})

describe('searchText', () => {
  test('joins type, thread, summary, and id', () => {
    const item = event('agent.message', { message: { role: 'assistant', content: 'ready' } })
    expect(searchText(item)).toContain('agent.message')
    expect(searchText(item)).toContain('thr_a')
    expect(searchText(item)).toContain('evt_1')
  })
})

describe('createEventCatalog', () => {
  const plugin: DebuggerPlugin = {
    name: 'payments',
    families: [
      {
        family: 'payments',
        prefix: 'payments.',
        color: 'oklch(0.78 0.1 175)',
        summarize: (item) =>
          item.type === 'payments.charge.authorized' ? { title: 'charge authorized' } : undefined,
      },
    ],
  }

  test('prefers the longest matching prefix', () => {
    const catalog = createEventCatalog([plugin])

    expect(catalog.familyOf('runtime.wait.registered')).toBe('wait')
    expect(catalog.familyOf('runtime.run.started')).toBe('runtime')
    expect(catalog.familyOf('payments.charge.authorized')).toBe('payments')
    expect(catalog.familyOf('custom.thing')).toBe('runtime')
    expect(catalog.familyColor('payments')).toBe('oklch(0.78 0.1 175)')
    expect(catalog.familyColor('missing')).toBe(catalog.familyColor('runtime'))
  })

  test('uses a plugin summary before the generic fallback', () => {
    const catalog = createEventCatalog([plugin])

    expect(catalog.summarize(event('payments.charge.authorized', { amount: 42 }))).toEqual({
      title: 'charge authorized',
    })

    expect(catalog.summarize(event('payments.charge.declined', { amount: 42 })).title).toBe(
      'payments.charge.declined',
    )
  })
})
