import { describe, expect, test } from 'bun:test'

import {
  initialPlaybackState,
  playbackDelayAt,
  reducePlayback,
  shouldClearSelection,
  type PlaybackState,
} from './playback'

function play(head = 3): PlaybackState {
  return { head, playing: true }
}

describe('initialPlaybackState', () => {
  test('autoplays from empty unless motion is reduced', () => {
    expect(initialPlaybackState(10, false)).toEqual({ head: 0, playing: true })
    expect(initialPlaybackState(10, true)).toEqual({ head: 10, playing: false })

    expect(reducePlayback(play(2), { type: 'init', length: 10, reducedMotion: true })).toEqual({
      head: 10,
      playing: false,
    })
  })
})

describe('playbackDelayAt', () => {
  test('scales event time while keeping playback within usable bounds', () => {
    const events = [{ ts: 0 }, { ts: 100 }, { ts: 600 }, { ts: 2_600 }]

    expect(playbackDelayAt(events, 0)).toBe(180)
    expect(playbackDelayAt(events, 1)).toBe(80)
    expect(playbackDelayAt(events, 2)).toBe(275)
    expect(playbackDelayAt(events, 3)).toBe(750)
  })
})

describe('reducePlayback', () => {
  test('advances while playing and ignores ticks when paused or complete', () => {
    expect(reducePlayback(play(2), { type: 'tick', length: 10 })).toEqual({
      head: 3,
      playing: true,
    })

    expect(reducePlayback({ head: 2, playing: false }, { type: 'tick', length: 10 })).toEqual({
      head: 2,
      playing: false,
    })

    expect(reducePlayback(play(10), { type: 'tick', length: 10 })).toEqual({
      head: 10,
      playing: true,
    })
  })

  test('pauses on inspect and resumes from the current head', () => {
    expect(reducePlayback(play(4), { type: 'inspect' })).toEqual({ head: 4, playing: false })

    expect(reducePlayback({ head: 4, playing: false }, { type: 'play', length: 10 })).toEqual({
      head: 4,
      playing: true,
    })
  })

  test('restarts when play is pressed after completion, and loops or replays from zero', () => {
    expect(reducePlayback({ head: 10, playing: false }, { type: 'play', length: 10 })).toEqual({
      head: 0,
      playing: true,
    })

    expect(reducePlayback(play(10), { type: 'loop' })).toEqual({ head: 0, playing: true })

    expect(reducePlayback({ head: 6, playing: false }, { type: 'replay' })).toEqual({
      head: 0,
      playing: true,
    })
  })
})

describe('shouldClearSelection', () => {
  test('clears only on automatic loop and explicit replay', () => {
    expect(shouldClearSelection({ type: 'loop' })).toBe(true)
    expect(shouldClearSelection({ type: 'replay' })).toBe(true)
    expect(shouldClearSelection({ type: 'inspect' })).toBe(false)
    expect(shouldClearSelection({ type: 'pause' })).toBe(false)
  })
})
