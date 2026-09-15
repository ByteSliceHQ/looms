import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useReducer, useState } from 'react'

import { DebuggerSplit, defaultEventCatalog, projectRunView } from '@looms/debugger'

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
import { LandingSourceIde } from './landing-source-ide'

type ShowcaseView = 'live' | 'source'

function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  return reducePlayback(state, action)
}

export function LandingDebugger() {
  const [showcaseView, setShowcaseView] = useState<ShowcaseView>('live')

  const [reducedMotion, setReducedMotion] = useState(false)

  const [state, dispatch] = useReducer(playbackReducer, undefined, () =>
    initialPlaybackState(landingOrchestrationEvents.length, false),
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
        reducedMotion: matches,
      })
    }

    apply(media.matches)

    const onChange = (event: MediaQueryListEvent) => apply(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (showcaseView === 'source' || reducedMotion || !state.playing) {
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
  }, [reducedMotion, showcaseView, state.head, state.playing])

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
      <ShowcaseTabs selected={showcaseView} onSelect={setShowcaseView} />
      {showcaseView === 'live' ? (
        <div className="landing-debugger border-line bg-background-subtle flex h-[22rem] min-h-[22rem] flex-col overflow-hidden rounded-lg border lg:h-[32rem] lg:min-h-[32rem]">
          <div className="border-border flex items-center gap-2 border-b px-3 py-2">
            <span className="text-muted font-mono text-[11px] tracking-wide uppercase">
              {reducedMotion ? 'Demo run' : 'Live orchestration'}
            </span>
            <div className="ml-auto flex items-center gap-1">
              {reducedMotion ? null : (
                <button
                  type="button"
                  className="text-muted hover:text-foreground inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px]"
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
                className="text-muted hover:text-foreground inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px]"
                onClick={() => send({ type: 'replay' })}
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
            />
          </div>
        </div>
      ) : (
        <LandingSourceIde />
      )}
    </div>
  )
}

function ShowcaseTabs({
  selected,
  onSelect,
}: {
  selected: ShowcaseView
  onSelect: (view: ShowcaseView) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Looms showcase"
      className="border-line bg-background-subtle mb-2 inline-flex rounded-md border p-0.5"
    >
      {(['live', 'source'] as const).map((view) => {
        const active = selected === view

        return (
          <button
            key={view}
            type="button"
            role="tab"
            aria-selected={active}
            className={`rounded px-2.5 py-1 font-mono text-[10px] transition-colors ${
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
            onClick={() => onSelect(view)}
          >
            {view === 'live' ? 'Live orchestration' : 'Source'}
          </button>
        )
      })}
    </div>
  )
}

export function LandingDebuggerFallback() {
  return (
    <div>
      <div className="border-line bg-background-subtle mb-2 inline-flex rounded-md border p-0.5">
        <span className="bg-background text-foreground rounded px-2.5 py-1 font-mono text-[10px] shadow-sm">
          Live orchestration
        </span>
        <span className="text-muted rounded px-2.5 py-1 font-mono text-[10px]">Source</span>
      </div>
      <div className="landing-debugger border-line bg-background-subtle flex h-[22rem] min-h-[22rem] flex-col overflow-hidden rounded-lg border lg:h-[32rem] lg:min-h-[32rem]">
        <div className="border-border text-muted border-b px-3 py-2 font-mono text-[11px] tracking-wide uppercase">
          Starting run…
        </div>
        <p className="text-muted p-3 text-xs">Waiting for threads…</p>
      </div>
    </div>
  )
}
