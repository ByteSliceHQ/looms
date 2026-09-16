import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useReducer, useState } from 'react'

import { DebuggerSplit, defaultEventCatalog, projectRunView } from '@swirls/looms/debugger'

import { landingOrchestrationEvents } from '../landing/orchestration-run'
import {
  initialPlaybackState,
  playbackDelayAt,
  PLAYBACK_HOLD_MS,
  reducePlayback,
  shouldClearSelection,
  type PlaybackAction,
  type PlaybackState,
} from '../landing/playback'

function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  return reducePlayback(state, action)
}

export function LandingDebugger() {
  const [reducedMotion, setReducedMotion] = useState(false)

  const [state, dispatch] = useReducer(playbackReducer, undefined, () =>
    initialPlaybackState(landingOrchestrationEvents.length, true),
  )

  const [selectedThread, setSelectedThread] = useState<string>()
  const [selectedSeq, setSelectedSeq] = useState<number>()

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => undefined
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')

    function apply(matches: boolean) {
      setReducedMotion(matches)

      dispatch({
        type: 'init',
        length: landingOrchestrationEvents.length,
        reducedMotion: true,
      })
    }

    apply(media.matches)

    const onChange = (event: MediaQueryListEvent) => apply(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (reducedMotion || !state.playing) {
      return () => undefined
    }

    const complete = state.head >= landingOrchestrationEvents.length

    const timer = window.setTimeout(
      () => {
        if (complete) {
          dispatch({ type: 'loop' })
          setSelectedThread(undefined)
          setSelectedSeq(undefined)
          return
        }

        dispatch({ type: 'tick', length: landingOrchestrationEvents.length })
      },
      complete ? PLAYBACK_HOLD_MS : playbackDelayAt(landingOrchestrationEvents, state.head),
    )

    return () => window.clearTimeout(timer)
  }, [reducedMotion, state.head, state.playing])

  const visible = useMemo(() => landingOrchestrationEvents.slice(0, state.head), [state.head])

  const view = useMemo(() => projectRunView(visible), [visible])

  function send(action: PlaybackAction) {
    dispatch(action)

    if (shouldClearSelection(action)) {
      setSelectedThread(undefined)
      setSelectedSeq(undefined)
    }
  }

  function inspectThread(threadId: string | undefined) {
    setSelectedThread(threadId)
    dispatch({ type: 'inspect' })
  }

  function inspectSeq(seq: number | undefined) {
    setSelectedSeq(seq)
    dispatch({ type: 'inspect' })
  }

  return (
    <div>
      <div className="landing-debugger border-line bg-background-subtle flex h-[22rem] min-h-[22rem] flex-col overflow-hidden rounded-lg border lg:h-[32rem] lg:min-h-[32rem]">
        <div className="border-border flex items-center gap-2 border-b px-3 py-2">
          <span className="text-muted font-mono text-xs tracking-wide uppercase">
            {reducedMotion ? 'Demo run' : 'Recorded orchestration'}
          </span>
          <div className="ml-auto flex items-center gap-1">
            {reducedMotion ? null : (
              <button
                type="button"
                className="text-muted hover:text-foreground inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs"
                onClick={() =>
                  send(
                    state.playing
                      ? { type: 'pause' }
                      : { type: 'play', length: landingOrchestrationEvents.length },
                  )
                }
              >
                {state.playing ? <Pause className="size-3" /> : <Play className="size-3" />}
                {state.playing ? 'Pause' : 'Play'}
              </button>
            )}
            <button
              type="button"
              className="text-muted hover:text-foreground inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs"
              onClick={() =>
                send(
                  reducedMotion
                    ? {
                        type: 'init',
                        length: landingOrchestrationEvents.length,
                        reducedMotion: true,
                      }
                    : { type: 'replay' },
                )
              }
            >
              <RotateCcw className="size-3" />
              Replay
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <DebuggerSplit
            runId={view.runId || landingOrchestrationEvents[0]!.runId}
            runStatus={view.runStatus}
            tree={view.tree}
            events={visible}
            eventCounts={view.eventCounts}
            startedAt={view.startedAt}
            selectedThread={selectedThread}
            onSelectThread={inspectThread}
            selectedSeq={selectedSeq}
            onSelectSeq={inspectSeq}
            catalog={defaultEventCatalog}
            orientation="vertical"
            showTreeHeading={false}
          />
        </div>
      </div>
    </div>
  )
}

export function LandingDebuggerFallback() {
  return (
    <div>
      <div className="landing-debugger border-line bg-background-subtle flex h-[22rem] min-h-[22rem] flex-col overflow-hidden rounded-lg border lg:h-[32rem] lg:min-h-[32rem]">
        <div className="border-border text-muted border-b px-3 py-2 font-mono text-xs tracking-wide uppercase">
          Recorded example
        </div>
        <p className="text-muted p-3 text-xs">Explore recorded events and thread relationships.</p>
      </div>
    </div>
  )
}
