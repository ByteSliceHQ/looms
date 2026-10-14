import { describe, expect, test } from 'bun:test'

import { createEvent, type EventEnvelope, type JsonValue } from '@looms/core'
import { foldLive } from '@looms/react'

import { streamingText } from './streaming-text'

function event(
  seq: number,
  type: string,
  payload: JsonValue,
  meta: { effectId?: string; ephemeral?: boolean } = {},
): EventEnvelope {
  return { ...createEvent('run_agent', { type, payload, threadId: 'thr_a', ...meta }), seq }
}

const delta = (seq: number, text: string) =>
  event(
    seq,
    'agent.turn.text_delta',
    { turn: 1, delta: text },
    { effectId: 'eff_model', ephemeral: true },
  )

describe('streamingText', () => {
  test('joins deltas until the durable message lands', () => {
    const streamed = [event(1, 'agent.turn.started', {}), delta(2, 'Hel'), delta(3, 'lo')]
    const streaming = foldLive(streamingText, streamed)

    expect(streaming.parts.join('')).toBe('Hello')

    const settled = foldLive(streamingText, [...streamed, event(4, 'agent.message', {})])
    expect(settled.parts).toEqual([])
    expect(settled.turnStarted).toBe(false)
  })

  test('shows only the latest attempt when the model call is retried', () => {
    const state = foldLive(streamingText, [
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
})
