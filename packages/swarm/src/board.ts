import { Data, Schema } from 'effect'

import { AttachmentSchema, type Attachment } from '@looms/agent'

/**
 * A message board is the only thing swarm members share. It holds channels of threaded messages,
 * tasks that members claim under a lease, and one ordered event log that a swarm follows.
 *
 * Implement {@link MessageBoard} over any store and check it with `boardConformance`.
 */

export const BoardLabelsSchema = Schema.Record(Schema.String, Schema.String)
export type BoardLabels = Schema.Schema.Type<typeof BoardLabelsSchema>

export const BoardMessageSchema = Schema.Struct({
  id: Schema.String,
  /** A path such as `support` or `support/billing`. The first post creates it. */
  channel: Schema.String,
  text: Schema.String,
  /** The member or person who wrote it. */
  by: Schema.String,
  /** The root message of the thread, or null when this message is a root. */
  re: Schema.NullOr(Schema.String),
  /** Names written as `@name` in `text`. */
  mentions: Schema.Array(Schema.String),
  /** `key=value` state. Keys under `board.` belong to the board. */
  labels: BoardLabelsSchema,
  /**
   * Files that travel with the message: screenshots, recordings, documents. The board holds
   * these references and never the bytes, which stay wherever the application stored them.
   */
  attachments: Schema.Array(AttachmentSchema),
  createdAt: Schema.Finite,
})
export type BoardMessage = Schema.Schema.Type<typeof BoardMessageSchema>

export const TaskStateSchema = Schema.Union([
  /** Has prerequisites that are not completed. */
  Schema.Literal('waiting'),
  Schema.Literal('ready'),
  Schema.Literal('claimed'),
  Schema.Literal('blocked'),
  Schema.Literal('completed'),
  Schema.Literal('failed'),
  Schema.Literal('canceled'),
])
export type TaskState = Schema.Schema.Type<typeof TaskStateSchema>

/** A task is a thread with state the board keeps. Its id is the id of its root message. */
export const BoardTaskSchema = Schema.Struct({
  id: Schema.String,
  channel: Schema.String,
  text: Schema.String,
  by: Schema.String,
  /** The only member who may claim it, or null when anyone may. */
  for: Schema.NullOr(Schema.String),
  /** Tasks that must complete before this one is ready. */
  needs: Schema.Array(Schema.String),
  state: TaskStateSchema,
  /** Who holds the current claim. */
  holder: Schema.NullOr(Schema.String),
  /** Counts claims. A claim from an earlier epoch can no longer change the task. */
  epoch: Schema.Finite,
  leaseUntil: Schema.NullOr(Schema.Finite),
  /** The result, failure reason, or blocker written when the task last changed state. */
  note: Schema.NullOr(Schema.String),
  createdAt: Schema.Finite,
  updatedAt: Schema.Finite,
})
export type BoardTask = Schema.Schema.Type<typeof BoardTaskSchema>

export const TaskClaimSchema = Schema.Struct({
  task: BoardTaskSchema,
  /** Proves the holder to `renew` and `settle`. It stops working when the claim is lost. */
  token: Schema.String,
  until: Schema.Finite,
})
export type TaskClaim = Schema.Schema.Type<typeof TaskClaimSchema>

export const BoardEventTypeSchema = Schema.Union([
  Schema.Literal('message.posted'),
  Schema.Literal('message.labeled'),
  Schema.Literal('task.created'),
  /** A waiting task's prerequisites completed, or a claim was released or expired. */
  Schema.Literal('task.ready'),
  Schema.Literal('task.claimed'),
  Schema.Literal('task.blocked'),
  Schema.Literal('task.completed'),
  Schema.Literal('task.failed'),
  Schema.Literal('task.canceled'),
  Schema.Literal('task.reopened'),
])
export type BoardEventType = Schema.Schema.Type<typeof BoardEventTypeSchema>

export const BoardEventSchema = Schema.Struct({
  /** Opaque position in the board's log. Pass it back unchanged; do not compare or parse it. */
  cursor: Schema.String,
  type: BoardEventTypeSchema,
  at: Schema.Finite,
  /** Who caused the event. `BOARD_ACTOR` when the board did, such as an expired lease. */
  by: Schema.String,
  /** The message as it was after the event. Present on message events and on `task.created`. */
  message: Schema.optional(BoardMessageSchema),
  /** The task as it was after the event. Present on every task event. */
  task: Schema.optional(BoardTaskSchema),
})
export type BoardEvent = Schema.Schema.Type<typeof BoardEventSchema>

/** The `by` of events the board causes itself. */
export const BOARD_ACTOR = 'board'

/** The label a task's root message carries. Its value is the task state. */
export const TASK_LABEL = 'board.task'

/** Label keys with this prefix are written only by the board. */
export const RESERVED_LABEL_PREFIX = 'board.'

/** The most files one message can carry. */
export const MAX_ATTACHMENTS = 10

export const DEFAULT_LEASE_MS = 15 * 60_000
export const MAX_LEASE_MS = 60 * 60_000

export type BoardErrorCode =
  | 'invalid_input'
  | 'message_not_found'
  | 'task_not_found'
  | 'duplicate_key'
  | 'reserved_label'
  | 'label_conflict'
  | 'invalid_needs'
  | 'task_claimed'
  | 'task_assigned'
  | 'task_not_ready'
  | 'task_finished'
  | 'claim_lost'

/**
 * A request the board refused. Retrying the same request fails the same way, so the swarm module
 * reports it to the calling agent and does not retry. Throw any other error for a fault that a
 * retry might clear.
 */
export class BoardError extends Data.TaggedError('BoardError')<{
  readonly code: BoardErrorCode
  readonly message: string
}> {}

export interface PostInput {
  readonly by: string
  readonly channel: string
  readonly text: string
  readonly labels?: BoardLabels
  /** At most {@link MAX_ATTACHMENTS}. Stored and returned as given. */
  readonly attachments?: readonly Attachment[]
  /**
   * Idempotency key. Posting the same key again returns the first message and writes nothing.
   * The same key in a different channel or thread fails with `duplicate_key`.
   */
  readonly key?: string
}

export interface ReplyInput {
  readonly by: string
  /** Any message of the thread. The reply attaches to that thread's root. */
  readonly to: string
  readonly text: string
  readonly labels?: BoardLabels
  readonly attachments?: readonly Attachment[]
  readonly key?: string
}

export interface LabelInput {
  readonly by: string
  readonly message: string
  readonly set?: BoardLabels
  readonly unset?: readonly string[]
  /**
   * Compare-and-set. Each key must hold the given value, or be absent for `null`, or the call
   * fails with `label_conflict` and changes nothing.
   */
  readonly if?: { readonly [key: string]: string | null }
}

export interface MessageQuery {
  /** Only the message with this id. */
  readonly id?: string
  /** `support` matches that channel. `support/` matches it and every channel below it. */
  readonly channel?: string
  /** Only the thread with this root: the root itself and its replies. */
  readonly thread?: string
  readonly by?: string
  readonly mentions?: string
  /** Every pair must be on the message. */
  readonly labels?: BoardLabels
  /** Only messages after the one with this id. */
  readonly after?: string
  /** At most this many. Without `after` these are the latest matches. Default 50. */
  readonly limit?: number
}

export interface CreateTaskInput {
  readonly by: string
  readonly channel: string
  readonly text: string
  readonly for?: string
  readonly needs?: readonly string[]
  readonly labels?: BoardLabels
  /** Kept on the task's root message. */
  readonly attachments?: readonly Attachment[]
  readonly key?: string
}

export interface TaskQuery {
  readonly channel?: string
  readonly state?: TaskState
  readonly for?: string
  readonly holder?: string
  readonly limit?: number
}

export interface ClaimInput {
  readonly by: string
  /** Claim this task. Fails when it is held, assigned to someone else, or not ready. */
  readonly task?: string
  /**
   * Without `task`: claim the oldest ready task in this channel filter that is assigned to the
   * caller, then the oldest unassigned one. Resolves to null when there is none.
   */
  readonly channel?: string
  /** Default {@link DEFAULT_LEASE_MS}, at most {@link MAX_LEASE_MS}. */
  readonly leaseMs?: number
}

export interface RenewInput {
  readonly task: string
  readonly token: string
  readonly leaseMs?: number
}

/** `released` returns the task to ready without finishing it. */
export type SettleOutcome = 'completed' | 'failed' | 'blocked' | 'released'

export interface SettleInput {
  readonly task: string
  readonly token: string
  readonly outcome: SettleOutcome
  readonly note?: string
}

export interface TaskChangeInput {
  readonly by: string
  readonly task: string
  readonly note?: string
}

export interface EventQuery {
  /** Only events after this cursor. Omit to read from the start of the log. */
  readonly after?: string
  /** Default 100. */
  readonly limit?: number
}

export interface EventPage {
  readonly events: readonly BoardEvent[]
  /** The cursor of the last event returned, or the `after` that was passed when there were none. */
  readonly cursor: string | null
  /** Whether more events were already in the log past this page. */
  readonly more: boolean
}

/**
 * The storage contract behind a swarm. One instance is one board.
 *
 * Rules every implementation keeps:
 *
 * - Every write appends to one totally ordered event log, in the order the writes took effect.
 * - `post`, `reply` and `createTask` are idempotent on `key`.
 * - A message returns the attachments it was written with, in order, and an empty list when it
 *   had none. More than {@link MAX_ATTACHMENTS} is refused with `invalid_input`.
 * - At most one claim holds a task. `claim` on a held task fails with `task_claimed`.
 * - A claim ends when it is settled, when its lease passes, or when the task is canceled. After
 *   that its token fails with `claim_lost` and changes nothing, so a member that stalled cannot
 *   settle a task another member has since claimed.
 * - A task whose lease has passed is ready again, and the log gains a `task.ready` event no later
 *   than the next call that reads tasks or events.
 * - Completing a task makes ready every waiting task whose `needs` are now all completed.
 * - Refusals reject with {@link BoardError}. Any other rejection is treated as a fault and retried.
 */
export interface MessageBoard {
  post(input: PostInput): Promise<BoardMessage>
  reply(input: ReplyInput): Promise<BoardMessage>
  label(input: LabelInput): Promise<BoardMessage>
  /** Oldest first. */
  messages(query?: MessageQuery): Promise<readonly BoardMessage[]>

  createTask(input: CreateTaskInput): Promise<BoardTask>
  /** Oldest first. */
  tasks(query?: TaskQuery): Promise<readonly BoardTask[]>
  claim(input: ClaimInput): Promise<TaskClaim | null>
  renew(input: RenewInput): Promise<TaskClaim>
  settle(input: SettleInput): Promise<BoardTask>
  /** Return a blocked, failed or canceled task to ready, or to waiting if it has unmet needs. */
  reopen(input: TaskChangeInput): Promise<BoardTask>
  cancel(input: TaskChangeInput): Promise<BoardTask>

  events(query?: EventQuery): Promise<EventPage>
}

/** Looks a board up by id, so one host can serve a board per tenant. */
export type BoardResolver = (boardId: string) => MessageBoard | Promise<MessageBoard>

const MENTION = /(?:^|[^\w@])@([a-z][a-z0-9-]*)/gi

/** The distinct `@name` handles in `text`, lowercased, in the order they first appear. */
export function parseMentions(text: string): string[] {
  const names = new Set<string>()

  for (const match of text.matchAll(MENTION)) {
    const name = match[1]

    if (name !== undefined) {
      names.add(name.toLowerCase())
    }
  }

  return [...names]
}

/** Whether `channel` is selected by `filter`. A filter ending in `/` selects a whole subtree. */
export function channelMatches(filter: string, channel: string): boolean {
  if (!filter.endsWith('/')) {
    return filter === channel
  }

  return channel === filter.slice(0, -1) || channel.startsWith(filter)
}

/** Whether a task is finished and will not change state again without `reopen`. */
export function isFinishedTask(state: TaskState): boolean {
  return state === 'completed' || state === 'failed' || state === 'canceled'
}
