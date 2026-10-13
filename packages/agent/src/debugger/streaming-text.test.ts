import { describe, expect, test } from 'bun:test'

import { createEvent, type EventEnvelope, type JsonValue } from '@looms/core'
import { foldEvents } from '@looms/react'

import { streamingText } from './streaming-text'

function event(
  seq: number,
  type: string,
  payload: JsonValue,
  meta: { effectId?: string; ephemeral?: boolean } = {},
): EventEnvelope {
  return { ...createEvent('run_agent', { type, payload, threadId: 'thr_a', ...meta }), seq }
}

const delta = (seq: number, text: string, effectId = 'eff_model') =>
  event(seq, 'agent.turn.text_delta', { turn: 1, delta: text }, { effectId, ephemeral: true })

describe('streamingText', () => {
  test('joins deltas until the durable message lands', () => {
    const streaming = foldEvents(streamingText, [
      event(1, 'agent.turn.started', {}),
      delta(2, 'Hel'),
      delta(3, 'lo'),
    ])

    expect(streaming.parts.join('')).toBe('Hello')

    const settled = foldEvents(streamingText, [event(4, 'agent.message', {})], streaming)
    expect(settled.parts).toEqual([])
    expect(settled.turnStarted).toBe(false)
  })

  test('drops a failed attempt’s text when its effect is retried', () => {
    const state = foldEvents(streamingText, [
      event(1, 'agent.turn.started', {}),
      delta(2, 'partial from attempt 1'),
      event(3, 'runtime.effect.retry.scheduled', {
        effectId: 'eff_model',
        attempt: 1,
        nextAttemptAt: 0,
        error: 'timed out',
      }),
      delta(4, 'attempt 2'),
    ])

    expect(state.parts.join('')).toBe('attempt 2')
    expect(state.turnStarted).toBe(true)
  })

  test('keeps streaming when another effect is retried', () => {
    const state = foldEvents(streamingText, [
      delta(1, 'still here'),
      event(2, 'runtime.effect.retry.scheduled', {
        effectId: 'eff_tool',
        attempt: 1,
        nextAttemptAt: 0,
        error: 'boom',
      }),
    ])

    expect(state.parts.join('')).toBe('still here')
  })
})
