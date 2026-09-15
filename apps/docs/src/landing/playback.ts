export type PlaybackState = {
  head: number
  playing: boolean
}

export type PlaybackAction =
  | { type: 'init'; length: number; reducedMotion: boolean }
  | { type: 'tick'; length: number }
  | { type: 'pause' }
  | { type: 'play'; length: number }
  | { type: 'replay' }
  | { type: 'loop' }
  | { type: 'inspect' }

export const PLAYBACK_HOLD_MS = 1600
const DEFAULT_PLAYBACK_DELAY_MS = 180
const MIN_PLAYBACK_DELAY_MS = 80
const MAX_PLAYBACK_DELAY_MS = 750
const PLAYBACK_TIME_SCALE = 0.55

export function playbackDelayAt(events: readonly { ts: number }[], head: number): number {
  const previous = events[head - 1]
  const next = events[head]

  if (!previous || !next) {
    return DEFAULT_PLAYBACK_DELAY_MS
  }

  const scaled = Math.round((next.ts - previous.ts) * PLAYBACK_TIME_SCALE)
  return Math.min(MAX_PLAYBACK_DELAY_MS, Math.max(MIN_PLAYBACK_DELAY_MS, scaled))
}

export function initialPlaybackState(length: number, reducedMotion: boolean): PlaybackState {
  return reducedMotion ? { head: length, playing: false } : { head: 0, playing: true }
}

export function reducePlayback(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case 'init':
      return initialPlaybackState(action.length, action.reducedMotion)

    case 'tick': {
      if (!state.playing || state.head >= action.length) {
        return state
      }

      return { ...state, head: state.head + 1 }
    }

    case 'pause':
    case 'inspect':
      return { ...state, playing: false }
    case 'play':
      return state.head >= action.length ? { head: 0, playing: true } : { ...state, playing: true }
    case 'replay':
    case 'loop':
      return { head: 0, playing: true }

    default: {
      const exhaustiveAction: never = action
      return exhaustiveAction
    }
  }
}

export function shouldClearSelection(action: PlaybackAction): boolean {
  return action.type === 'loop' || action.type === 'replay'
}
