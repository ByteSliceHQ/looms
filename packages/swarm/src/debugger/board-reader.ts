import { useEffect, useState } from 'react'

import { delay } from '@looms/client'

import { BoardError, type EventQuery, type MessageBoard } from '../board'
import { applyEvents, emptyBoard, type SwarmBoard } from './board-fold'

/** What the debugger needs from a board: its event log. `remoteBoard` satisfies it as is. */
export type BoardReader = Pick<MessageBoard, 'events'>

export interface LiveBoard {
  /** The whole board as read so far. */
  readonly board: SwarmBoard
  /** Why the last read failed, until a read succeeds again. */
  readonly error: string | null
}

export interface FollowBoardOptions {
  /** How long to wait after an empty page before reading again. */
  readonly pollMs: number
  /** Stops following. A read in flight finishes, and its page is dropped. */
  readonly signal: AbortSignal
  /** Called with the board each time it or the error changes. */
  readonly onChange: (live: LiveBoard) => void
  /** Resolves once reading should go on. Defaults to waiting while the document is hidden. */
  readonly whenVisible?: (signal: AbortSignal) => Promise<void>
  /** Events per page. Defaults to the board's own default. */
  readonly pageSize?: number
}

const MAX_BACKOFF_MS = 30_000

function startOf(boardId: string): SwarmBoard {
  return { ...emptyBoard, board: boardId }
}

function pageQuery(cursor: string | null, pageSize: number | undefined): EventQuery {
  if (cursor === null) {
    return pageSize === undefined ? {} : { limit: pageSize }
  }

  return pageSize === undefined ? { after: cursor } : { after: cursor, limit: pageSize }
}

/** Resolves at once while the document is visible, or when it becomes visible again. */
function whenDocumentVisible(signal: AbortSignal): Promise<void> {
  if (!('document' in globalThis) || document.visibilityState !== 'hidden') {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    function done() {
      document.removeEventListener('visibilitychange', changed)
      signal.removeEventListener('abort', done)
      resolve()
    }

    function changed() {
      if (document.visibilityState !== 'hidden') {
        done()
      }
    }

    document.addEventListener('visibilitychange', changed)
    signal.addEventListener('abort', done)
  })
}

/**
 * Read a board's whole event log and keep following it until `signal` aborts. Pages are read
 * while `more`; after an empty page the next read waits `pollMs`. A `cursor_unknown` refusal
 * means the log was reset, so the board starts over from the beginning. Any other failure is
 * reported through `onChange` and retried with a growing backoff.
 */
export async function followBoard(
  reader: BoardReader,
  boardId: string,
  options: FollowBoardOptions,
): Promise<void> {
  const { pollMs, signal, onChange, pageSize } = options
  const whenVisible = options.whenVisible ?? whenDocumentVisible
  let live: LiveBoard = { board: startOf(boardId), error: null }
  let cursor: string | null = null
  let failures = 0

  function publish(board: SwarmBoard, error: string | null) {
    if (signal.aborted || (board === live.board && error === live.error)) {
      return
    }

    live = { board, error }
    onChange(live)
  }

  onChange(live)

  while (!signal.aborted) {
    await whenVisible(signal)

    if (signal.aborted) {
      return
    }

    try {
      const page = await reader.events(pageQuery(cursor, pageSize))

      if (signal.aborted) {
        return
      }

      cursor = page.cursor ?? cursor
      failures = 0
      publish(applyEvents(live.board, boardId, page.events), null)

      if (page.more) {
        continue
      }

      await delay(pollMs, signal)
    } catch (cause) {
      if (signal.aborted) {
        return
      }

      if (cause instanceof BoardError && cause.code === 'cursor_unknown' && cursor !== null) {
        // The log this cursor came from is gone: read the board again from the start.
        cursor = null
        publish(startOf(boardId), null)
        continue
      }

      failures += 1
      publish(live.board, cause instanceof Error ? cause.message : String(cause))
      await delay(Math.min(pollMs * 2 ** failures, MAX_BACKOFF_MS), signal)
    }
  }
}

/**
 * The whole board, read live from `reader` and followed every `pollMs` while the page is
 * visible. Reading stops when the component unmounts or its inputs change.
 */
export function useLiveBoard(reader: BoardReader, boardId: string, pollMs: number): LiveBoard {
  const [live, setLive] = useState<LiveBoard>(() => ({ board: startOf(boardId), error: null }))

  useEffect(() => {
    const controller = new AbortController()

    void followBoard(reader, boardId, { pollMs, signal: controller.signal, onChange: setLive })

    return () => controller.abort()
  }, [reader, boardId, pollMs])

  return live
}
