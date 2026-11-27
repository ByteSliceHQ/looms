import { Option, Schema } from 'effect'

import { defineLiveFold } from '@looms/react'

import {
  BoardEventSchema,
  BoardMessageSchema,
  BoardTaskSchema,
  type BoardEvent,
  type BoardMessage,
  type BoardTask,
} from '../board'
import { BoardPulledPayloadSchema, SwarmRestartedPayloadSchema } from '../events'

const SwarmBoardSchema = Schema.Struct({
  /** The board the swarm follows, or null before its first pull. */
  board: Schema.NullOr(Schema.String),
  /** The pull the swarm waits for next. A page for any other pull is one the swarm ignored. */
  pulls: Schema.Finite,
  /** Board events in log order. */
  events: Schema.Array(BoardEventSchema),
  /** Cursors already folded, so a page read again adds nothing twice. */
  cursors: Schema.Record(Schema.String, Schema.Boolean),
  /** Latest snapshot of every message, keyed by id. */
  messages: Schema.Record(Schema.String, BoardMessageSchema),
  /** Message ids in the order the board first showed them. */
  messageOrder: Schema.Array(Schema.String),
  /** Latest snapshot of every task, keyed by id. */
  tasks: Schema.Record(Schema.String, BoardTaskSchema),
  /** Task ids in the order the board first showed them. */
  taskOrder: Schema.Array(Schema.String),
})

export type SwarmBoard = Schema.Schema.Type<typeof SwarmBoardSchema>

export const emptyBoard: SwarmBoard = {
  board: null,
  pulls: 0,
  events: [],
  cursors: {},
  messages: {},
  messageOrder: [],
  tasks: {},
  taskOrder: [],
}

const decodePulled = Schema.decodeUnknownOption(BoardPulledPayloadSchema)
const decodeRestarted = Schema.decodeUnknownOption(SwarmRestartedPayloadSchema)

/**
 * Fold board events into the board they came from: the latest snapshot per message or task id,
 * each event once by cursor. Shared by the run's live fold and by a live board reader.
 *
 * Linear in the page: each collection is copied at most once per call and the copies are
 * mutated in place, so replaying a long board page by page stays cheap. Returns `state` itself
 * when the page adds nothing and names the board `state` already follows.
 */
export function applyEvents(
  state: SwarmBoard,
  boardId: string,
  events: readonly BoardEvent[],
): SwarmBoard {
  const known = state.cursors
  const seen = new Set<string>()
  const fresh: BoardEvent[] = []

  for (const event of events) {
    if (known[event.cursor] === true || seen.has(event.cursor)) {
      continue
    }

    seen.add(event.cursor)
    fresh.push(event)
  }

  if (fresh.length === 0) {
    return state.board === boardId ? state : { ...state, board: boardId }
  }

  const cursors = { ...known }
  let messages: Record<string, BoardMessage> | undefined
  let messageOrder: string[] | undefined
  let tasks: Record<string, BoardTask> | undefined
  let taskOrder: string[] | undefined

  for (const event of fresh) {
    cursors[event.cursor] = true

    if (event.message) {
      messages ??= { ...state.messages }

      if (!(event.message.id in messages)) {
        messageOrder ??= [...state.messageOrder]
        messageOrder.push(event.message.id)
      }

      messages[event.message.id] = event.message
    }

    if (event.task) {
      tasks ??= { ...state.tasks }

      if (!(event.task.id in tasks)) {
        taskOrder ??= [...state.taskOrder]
        taskOrder.push(event.task.id)
      }

      tasks[event.task.id] = event.task
    }
  }

  return {
    ...state,
    board: boardId,
    cursors,
    events: [...state.events, ...fresh],
    messages: messages ?? state.messages,
    messageOrder: messageOrder ?? state.messageOrder,
    tasks: tasks ?? state.tasks,
    taskOrder: taskOrder ?? state.taskOrder,
  }
}

/**
 * The board as the swarm has read it, folded from the pages its `swarm.board.pulled` events
 * carry. Each board event holds a snapshot of its message or task, so the latest snapshot per id
 * is the current one. Pages the swarm ignored are skipped the way the swarm skips them. A page
 * read from the start of a reset log, or from another board, starts the board over.
 */
export const swarmBoard = defineLiveFold({
  name: 'swarmBoard',
  shape: SwarmBoardSchema,
  initialState: emptyBoard,
  reduce(state, event) {
    if (event.type === 'swarm.restarted') {
      // The swarm ignores a pull still in flight when it restarts.
      const restarted = Option.getOrUndefined(decodeRestarted(event.payload))
      const board = restarted?.board ?? state.board

      return board === state.board
        ? { ...state, pulls: state.pulls + 1 }
        : { ...emptyBoard, board, pulls: state.pulls + 1 }
    }

    if (event.type !== 'swarm.board.pulled') {
      return state
    }

    const page = Option.getOrUndefined(decodePulled(event.payload))

    if (!page || page.pull !== state.pulls) {
      return state
    }

    const base =
      page.reset === true || (state.board !== null && page.board !== state.board)
        ? { ...emptyBoard, pulls: state.pulls }
        : state

    return applyEvents({ ...base, pulls: state.pulls + 1 }, page.board, page.events)
  },
})

export interface BoardThread {
  readonly root: BoardMessage
  readonly replies: readonly BoardMessage[]
}

export interface BoardChannel {
  readonly channel: string
  readonly threads: readonly BoardThread[]
}

function pushTo(groups: Map<string, BoardMessage[]>, key: string, message: BoardMessage): void {
  const group = groups.get(key)

  if (group) {
    group.push(message)
  } else {
    groups.set(key, [message])
  }
}

/** Messages grouped by channel, each thread its root and then its replies, oldest first. */
export function boardThreads(board: SwarmBoard): readonly BoardChannel[] {
  const roots = new Map<string, BoardMessage[]>()
  const replies = new Map<string, BoardMessage[]>()
  const orphans: BoardMessage[] = []

  for (const id of board.messageOrder) {
    const message = board.messages[id]

    if (!message) {
      continue
    }

    if (message.re === null) {
      pushTo(roots, message.channel, message)
    } else if (message.re in board.messages) {
      pushTo(replies, message.re, message)
    } else {
      // The board showed a reply whose root came before the swarm's cursor.
      orphans.push(message)
    }
  }

  for (const message of orphans) {
    pushTo(roots, message.channel, message)
  }

  return [...roots.entries()]
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(([channel, messages]) => ({
      channel,
      threads: messages.map((root) => ({ root, replies: replies.get(root.id) ?? [] })),
    }))
}

export const TASK_STATE_ORDER = [
  'waiting',
  'ready',
  'claimed',
  'blocked',
  'completed',
  'failed',
  'canceled',
] as const satisfies readonly BoardTask['state'][]

export interface BoardTaskGroup {
  readonly state: BoardTask['state']
  readonly tasks: readonly BoardTask[]
}

/** Tasks grouped by state, open work first, each group oldest first. Empty groups are left out. */
export function boardTaskGroups(board: SwarmBoard): readonly BoardTaskGroup[] {
  const tasks = board.taskOrder.flatMap((id) => {
    const task = board.tasks[id]
    return task ? [task] : []
  })

  return TASK_STATE_ORDER.map((state) => ({
    state,
    tasks: tasks.filter((task) => task.state === state),
  })).filter((group) => group.tasks.length > 0)
}
