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

const emptyBoard: SwarmBoard = {
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

function withMessage(state: SwarmBoard, message: BoardMessage): SwarmBoard {
  const known = message.id in state.messages

  return {
    ...state,
    messages: { ...state.messages, [message.id]: message },
    messageOrder: known ? state.messageOrder : [...state.messageOrder, message.id],
  }
}

function withTask(state: SwarmBoard, task: BoardTask): SwarmBoard {
  const known = task.id in state.tasks

  return {
    ...state,
    tasks: { ...state.tasks, [task.id]: task },
    taskOrder: known ? state.taskOrder : [...state.taskOrder, task.id],
  }
}

function applyPage(state: SwarmBoard, events: readonly BoardEvent[]): SwarmBoard {
  let next = state
  const fresh: BoardEvent[] = []
  const cursors = { ...state.cursors }

  for (const event of events) {
    if (cursors[event.cursor] === true) {
      continue
    }

    cursors[event.cursor] = true
    fresh.push(event)

    if (event.message) {
      next = withMessage(next, event.message)
    }

    if (event.task) {
      next = withTask(next, event.task)
    }
  }

  return fresh.length === 0 ? state : { ...next, cursors, events: [...state.events, ...fresh] }
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

    return applyPage({ ...base, board: page.board, pulls: state.pulls + 1 }, page.events)
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
      roots.set(message.channel, [...(roots.get(message.channel) ?? []), message])
    } else if (message.re in board.messages) {
      replies.set(message.re, [...(replies.get(message.re) ?? []), message])
    } else {
      // The board showed a reply whose root came before the swarm's cursor.
      orphans.push(message)
    }
  }

  for (const message of orphans) {
    roots.set(message.channel, [...(roots.get(message.channel) ?? []), message])
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
