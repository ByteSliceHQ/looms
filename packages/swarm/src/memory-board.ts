import type { Attachment } from '@looms/agent'

import {
  BOARD_ACTOR,
  BoardError,
  DEFAULT_LEASE_MS,
  MAX_ATTACHMENTS,
  MAX_LEASE_MS,
  RESERVED_LABEL_PREFIX,
  TASK_LABEL,
  channelMatches,
  isFinishedTask,
  parseMentions,
  type BoardErrorCode,
  type BoardEvent,
  type BoardEventType,
  type BoardLabels,
  type BoardMessage,
  type BoardTask,
  type ClaimInput,
  type MessageBoard,
  type MessageQuery,
  type TaskClaim,
  type TaskQuery,
  type TaskState,
} from './board'

export interface MemoryBoardOptions {
  /** Epoch milliseconds. Tests pass a clock they control to expire leases. */
  readonly now?: () => number
  /**
   * Names this board's log inside its cursors, so a cursor from another board, or from before the
   * board was made again, is refused with `cursor_unknown`. Defaults to a random id.
   */
  readonly logId?: string
}

const DEFAULT_MESSAGE_LIMIT = 50
const DEFAULT_TASK_LIMIT = 100
const DEFAULT_EVENT_LIMIT = 100
const CURSOR_WIDTH = 12
const CHANNEL = /^[\w.-]+(?:\/[\w.-]+)*$/

function refuse(code: BoardErrorCode, message: string): never {
  throw new BoardError({ code, message })
}

function checkLabels(labels: BoardLabels | undefined): BoardLabels {
  for (const key of Object.keys(labels ?? {})) {
    if (key.startsWith(RESERVED_LABEL_PREFIX)) {
      refuse('reserved_label', `Label "${key}" is reserved for the board`)
    }
  }

  return labels ?? {}
}

function checkAttachments(attachments: readonly Attachment[] | undefined): Attachment[] {
  const files = attachments ?? []

  if (files.length > MAX_ATTACHMENTS) {
    refuse('invalid_input', `A message carries at most ${MAX_ATTACHMENTS} attachments`)
  }

  if (files.some((file) => file.id === '' || file.mediaType === '')) {
    refuse('invalid_input', 'An attachment needs an id and a media type')
  }

  return [...files]
}

function matchesMessage(message: BoardMessage, query: MessageQuery): boolean {
  return (
    (query.id === undefined || message.id === query.id) &&
    (query.channel === undefined || channelMatches(query.channel, message.channel)) &&
    (query.thread === undefined || message.id === query.thread || message.re === query.thread) &&
    (query.by === undefined || message.by === query.by) &&
    (query.mentions === undefined || message.mentions.includes(query.mentions)) &&
    Object.entries(query.labels ?? {}).every(([key, value]) => message.labels[key] === value)
  )
}

function matchesTask(task: BoardTask, query: TaskQuery): boolean {
  return (
    (query.channel === undefined || channelMatches(query.channel, task.channel)) &&
    (query.state === undefined || task.state === query.state) &&
    (query.for === undefined || task.for === query.for) &&
    (query.holder === undefined || task.holder === query.holder)
  )
}

interface Written {
  readonly message: BoardMessage
  readonly created: boolean
}

/**
 * A board held in process memory. It is the reference implementation of {@link MessageBoard}:
 * use it in tests and single-process hosts, and read it when writing a durable board.
 */
export function createMemoryBoard(options: MemoryBoardOptions = {}): MessageBoard {
  const now = options.now ?? (() => Date.now())
  const messages = new Map<string, BoardMessage>()
  const tasks = new Map<string, BoardTask>()
  const tokens = new Map<string, string>()
  const keys = new Map<string, string>()
  const log: BoardEvent[] = []
  const logId = options.logId ?? globalThis.crypto.randomUUID().slice(0, 8)
  let nextId = 0

  function cursorAt(position: number): string {
    return `${logId}.${String(position).padStart(CURSOR_WIDTH, '0')}`
  }

  /** How many events precede the cursor, or null when this log did not issue it. */
  function positionOf(cursor: string): number | null {
    const [owner, digits] = cursor.split('.')
    const position = Number(digits)

    return owner === logId && Number.isInteger(position) && position >= 0 && position <= log.length
      ? position
      : null
  }

  function record(type: BoardEventType, by: string, parts: Pick<BoardEvent, 'message' | 'task'>) {
    const cursor = cursorAt(log.length + 1)

    log.push({ cursor, type, at: now(), by, ...parts })
  }

  function saveTask(task: BoardTask): BoardTask {
    tasks.set(task.id, task)

    const root = messages.get(task.id)

    if (root) {
      messages.set(task.id, { ...root, labels: { ...root.labels, [TASK_LABEL]: task.state } })
    }

    return task
  }

  /** Return tasks whose lease has passed to ready. Every public call starts here. */
  function expireLeases(): void {
    const at = now()

    for (const task of tasks.values()) {
      if (task.state === 'claimed' && task.leaseUntil !== null && task.leaseUntil <= at) {
        tokens.delete(task.id)

        const ready = saveTask({
          ...task,
          state: 'ready',
          holder: null,
          leaseUntil: null,
          updatedAt: at,
        })

        record('task.ready', BOARD_ACTOR, { task: ready })
      }
    }
  }

  function call<A>(body: () => A): Promise<A> {
    return new Promise((resolve) => {
      expireLeases()
      resolve(body())
    })
  }

  function requireMessage(id: string): BoardMessage {
    return messages.get(id) ?? refuse('message_not_found', `No message "${id}"`)
  }

  function requireTask(id: string): BoardTask {
    return tasks.get(id) ?? refuse('task_not_found', `No task "${id}"`)
  }

  function write(input: {
    readonly by: string
    readonly channel: string
    readonly text: string
    readonly re: string | null
    readonly labels: BoardLabels | undefined
    readonly attachments: readonly Attachment[] | undefined
    readonly key: string | undefined
  }): Written {
    if (input.by === '' || input.text === '') {
      refuse('invalid_input', 'A message needs an author and text')
    }

    if (!CHANNEL.test(input.channel)) {
      refuse('invalid_input', `"${input.channel}" is not a channel path`)
    }

    const labels = checkLabels(input.labels)
    const attachments = checkAttachments(input.attachments)

    const existing = input.key === undefined ? undefined : messages.get(keys.get(input.key) ?? '')

    if (existing) {
      if (existing.channel !== input.channel || existing.re !== input.re) {
        refuse('duplicate_key', `Key "${input.key ?? ''}" was already used elsewhere`)
      }

      return { message: existing, created: false }
    }

    nextId += 1

    const message: BoardMessage = {
      id: `msg_${nextId}`,
      channel: input.channel,
      text: input.text,
      by: input.by,
      re: input.re,
      mentions: parseMentions(input.text),
      labels,
      attachments,
      createdAt: now(),
    }

    messages.set(message.id, message)

    if (input.key !== undefined) {
      keys.set(input.key, message.id)
    }

    return { message, created: true }
  }

  function needsMet(needs: readonly string[]): boolean {
    return needs.every((id) => tasks.get(id)?.state === 'completed')
  }

  function readyDependents(completedId: string, by: string): void {
    for (const task of tasks.values()) {
      if (task.state === 'waiting' && task.needs.includes(completedId) && needsMet(task.needs)) {
        record('task.ready', by, { task: saveTask({ ...task, state: 'ready', updatedAt: now() }) })
      }
    }
  }

  function lease(task: BoardTask, by: string, leaseMs: number | undefined): TaskClaim {
    const until = now() + Math.min(Math.max(leaseMs ?? DEFAULT_LEASE_MS, 1), MAX_LEASE_MS)
    const epoch = task.epoch + 1
    const token = `${task.id}.${epoch}.${globalThis.crypto.randomUUID()}`

    const claimed = saveTask({
      ...task,
      state: 'claimed',
      holder: by,
      epoch,
      leaseUntil: until,
      updatedAt: now(),
    })

    tokens.set(task.id, token)
    record('task.claimed', by, { task: claimed })

    return { task: claimed, token, until }
  }

  function held(taskId: string, token: string): BoardTask {
    const task = requireTask(taskId)

    if (task.state !== 'claimed' || tokens.get(taskId) !== token) {
      refuse('claim_lost', `The claim on task "${taskId}" is no longer held`)
    }

    return task
  }

  function claimable(input: ClaimInput): BoardTask | null {
    const open = [...tasks.values()].filter(
      (task) =>
        task.state === 'ready' &&
        (input.channel === undefined || channelMatches(input.channel, task.channel)),
    )

    return (
      open.find((task) => task.for === input.by) ?? open.find((task) => task.for === null) ?? null
    )
  }

  return {
    post: (input) =>
      call(() => {
        const { message, created } = write({
          by: input.by,
          channel: input.channel,
          text: input.text,
          re: null,
          labels: input.labels,
          attachments: input.attachments,
          key: input.key,
        })

        if (created) {
          record('message.posted', input.by, { message })
        }

        return message
      }),

    reply: (input) =>
      call(() => {
        const target = requireMessage(input.to)

        const { message, created } = write({
          by: input.by,
          channel: target.channel,
          text: input.text,
          re: target.re ?? target.id,
          labels: input.labels,
          attachments: input.attachments,
          key: input.key,
        })

        if (created) {
          record('message.posted', input.by, { message })
        }

        return message
      }),

    label: (input) =>
      call(() => {
        const message = requireMessage(input.message)
        const set = checkLabels(input.set)

        for (const key of input.unset ?? []) {
          checkLabels({ [key]: '' })
        }

        for (const [key, expected] of Object.entries(input.if ?? {})) {
          if ((message.labels[key] ?? null) !== expected) {
            refuse('label_conflict', `Label "${key}" is not ${expected ?? 'unset'}`)
          }
        }

        const dropped = new Set(input.unset)

        const kept = Object.fromEntries(
          Object.entries(message.labels).filter(([key]) => !dropped.has(key)),
        )

        const labeled = { ...message, labels: { ...kept, ...set } }

        messages.set(labeled.id, labeled)
        record('message.labeled', input.by, { message: labeled })

        return labeled
      }),

    messages: (query = {}) =>
      call(() => {
        const limit = query.limit ?? DEFAULT_MESSAGE_LIMIT
        const all = [...messages.values()]
        const start = query.after === undefined ? 0 : all.indexOf(requireMessage(query.after)) + 1
        const matched = all.slice(start).filter((message) => matchesMessage(message, query))

        return query.after === undefined ? matched.slice(-limit) : matched.slice(0, limit)
      }),

    createTask: (input) =>
      call(() => {
        const needs = [...new Set(input.needs)]

        for (const id of needs) {
          if (!tasks.has(id)) {
            refuse('invalid_needs', `Task "${id}" does not exist`)
          }
        }

        const { message, created } = write({
          by: input.by,
          channel: input.channel,
          text: input.text,
          re: null,
          labels: input.labels,
          attachments: input.attachments,
          key: input.key,
        })

        if (!created) {
          return (
            tasks.get(message.id) ??
            refuse('duplicate_key', `Key "${input.key ?? ''}" belongs to a plain message`)
          )
        }

        const state: TaskState = needsMet(needs) ? 'ready' : 'waiting'

        const task = saveTask({
          id: message.id,
          channel: message.channel,
          text: message.text,
          by: message.by,
          for: input.for ?? null,
          needs,
          state,
          holder: null,
          epoch: 0,
          leaseUntil: null,
          note: null,
          createdAt: message.createdAt,
          updatedAt: message.createdAt,
        })

        record('task.created', input.by, { message: requireMessage(task.id), task })

        return task
      }),

    tasks: (query = {}) =>
      call(() =>
        [...tasks.values()]
          .filter((task) => matchesTask(task, query))
          .slice(0, query.limit ?? DEFAULT_TASK_LIMIT),
      ),

    claim: (input) =>
      call(() => {
        if (input.task === undefined) {
          const next = claimable(input)

          return next ? lease(next, input.by, input.leaseMs) : null
        }

        const task = requireTask(input.task)

        if (task.state === 'claimed') {
          refuse('task_claimed', `Task "${task.id}" is held by ${task.holder ?? 'someone'}`)
        }

        if (isFinishedTask(task.state)) {
          refuse('task_finished', `Task "${task.id}" is ${task.state}`)
        }

        if (task.state !== 'ready') {
          refuse('task_not_ready', `Task "${task.id}" is ${task.state}`)
        }

        if (task.for !== null && task.for !== input.by) {
          refuse('task_assigned', `Task "${task.id}" is assigned to ${task.for}`)
        }

        return lease(task, input.by, input.leaseMs)
      }),

    renew: (input) =>
      call(() => {
        const task = held(input.task, input.token)
        const until = now() + Math.min(Math.max(input.leaseMs ?? DEFAULT_LEASE_MS, 1), MAX_LEASE_MS)

        return {
          task: saveTask({ ...task, leaseUntil: until, updatedAt: now() }),
          token: input.token,
          until,
        }
      }),

    settle: (input) =>
      call(() => {
        const task = held(input.task, input.token)
        const by = task.holder ?? BOARD_ACTOR

        tokens.delete(task.id)

        const settled = saveTask({
          ...task,
          state: input.outcome === 'released' ? 'ready' : input.outcome,
          holder: null,
          leaseUntil: null,
          note: input.note ?? null,
          updatedAt: now(),
        })

        record(input.outcome === 'released' ? 'task.ready' : `task.${input.outcome}`, by, {
          task: settled,
        })

        if (settled.state === 'completed') {
          readyDependents(settled.id, by)
        }

        return settled
      }),

    reopen: (input) =>
      call(() => {
        const task = requireTask(input.task)

        if (task.state !== 'blocked' && !isFinishedTask(task.state)) {
          refuse('task_not_ready', `Task "${task.id}" is ${task.state} and cannot be reopened`)
        }

        const reopened = saveTask({
          ...task,
          state: needsMet(task.needs) ? 'ready' : 'waiting',
          note: input.note ?? null,
          updatedAt: now(),
        })

        record('task.reopened', input.by, { task: reopened })

        return reopened
      }),

    cancel: (input) =>
      call(() => {
        const task = requireTask(input.task)

        if (isFinishedTask(task.state)) {
          refuse('task_finished', `Task "${task.id}" is ${task.state}`)
        }

        tokens.delete(task.id)

        const canceled = saveTask({
          ...task,
          state: 'canceled',
          holder: null,
          leaseUntil: null,
          note: input.note ?? null,
          updatedAt: now(),
        })

        record('task.canceled', input.by, { task: canceled })

        return canceled
      }),

    events: (query = {}) =>
      call(() => {
        const limit = query.limit ?? DEFAULT_EVENT_LIMIT
        const start = query.after === undefined ? 0 : positionOf(query.after)

        if (start === null) {
          refuse('cursor_unknown', `"${query.after ?? ''}" is not a cursor of this board's log`)
        }

        const events = log.slice(start, start + limit)

        return {
          events,
          cursor: events.at(-1)?.cursor ?? query.after ?? null,
          more: start + events.length < log.length,
        }
      }),
  }
}
