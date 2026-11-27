import { useMemo, useState } from 'react'

import {
  cn,
  EmptyState,
  FollowList,
  JsonView,
  ScrollArea,
  StartForm,
  StatusBadge,
  useDebugger,
  type WorkspaceContext,
} from '@looms/debugger'
import { useLiveFold, useProjection, useRunStore } from '@looms/react'

import type { BoardEvent, BoardMessage, BoardTask } from '../board'
import { swarmStatus, type SwarmStatus } from '../projections'
import { boardTaskGroups, boardThreads, swarmBoard, type SwarmBoard } from './board-fold'
import { useLiveBoard, type BoardReader } from './board-reader'

export const SWARM_PANES = ['members', 'threads', 'tasks', 'timeline'] as const
export type SwarmPane = (typeof SWARM_PANES)[number]

const paneLabels: Record<SwarmPane, string> = {
  members: 'Members',
  threads: 'Threads',
  tasks: 'Tasks',
  timeline: 'Timeline',
}

export const DEFAULT_POLL_MS = 2000

/** Where the board panes come from. */
export interface SwarmBoardSource {
  /**
   * A reader for the swarm's whole board, by board id. With one, the board panes show every
   * event on the board, including posts from before this run, and follow it live. Without one,
   * they show the board as this run pulled it. Keep the function stable across renders.
   */
  readonly board?: (boardId: string) => BoardReader
  /** How long to wait between reads once the board has nothing new. Default 2000. */
  readonly pollMs?: number
}

/** A workspace that starts a swarm, or watches the one selected, reading the board from `source`. */
export function createSwarmWorkspace(source: SwarmBoardSource) {
  return function SwarmWorkspace(context: WorkspaceContext) {
    return context.runId === undefined ? (
      <StartForm {...context} />
    ) : (
      <SwarmView runId={context.runId} board={source.board} pollMs={source.pollMs} />
    )
  }
}

/** Starts a swarm, or watches the one selected. */
export const SwarmWorkspace = createSwarmWorkspace({})

/**
 * A swarm run and its board. Members come from the run's events. The board comes from `board`
 * when given, and otherwise from the pages the run pulled.
 */
export function SwarmView({
  runId,
  board: readBoard,
  pollMs = DEFAULT_POLL_MS,
}: { runId: string } & SwarmBoardSource) {
  const { openRun } = useDebugger()
  const store = useRunStore(runId)
  const status = useProjection(store, swarmStatus)
  const pulled = useLiveFold(store, swarmBoard)
  const boardId = status.board ?? pulled.board

  const reader = useMemo(
    () => (readBoard === undefined || boardId === null ? null : readBoard(boardId)),
    [readBoard, boardId],
  )

  if (reader === null || boardId === null) {
    return <SwarmPanels status={status} board={pulled} onOpenRun={openRun} />
  }

  return (
    <LiveSwarmPanels
      key={boardId}
      reader={reader}
      boardId={boardId}
      pollMs={pollMs}
      status={status}
      pulled={pulled}
      onOpenRun={openRun}
    />
  )
}

function LiveSwarmPanels({
  reader,
  boardId,
  pollMs,
  status,
  pulled,
  onOpenRun,
}: {
  reader: BoardReader
  boardId: string
  pollMs: number
  status: SwarmStatus
  pulled: SwarmBoard
  onOpenRun?: (runId: string) => void
}) {
  const live = useLiveBoard(reader, boardId, pollMs)

  // While the reader fails, show what the run pulled rather than a stale or empty board.
  return live.error === null ? (
    <SwarmPanels status={status} board={live.board} source="live" onOpenRun={onOpenRun} />
  ) : (
    <SwarmPanels
      status={status}
      board={pulled}
      source="pulled"
      boardError={live.error}
      onOpenRun={onOpenRun}
    />
  )
}

/** `live`: the whole board, read from the board itself. `pulled`: as this run pulled it. */
export type SwarmBoardView = 'live' | 'pulled'

const sourceLabels: Record<SwarmBoardView, string> = {
  live: 'whole board · live',
  pulled: 'as this run pulled it',
}

export function SwarmPanels({
  status,
  board,
  onOpenRun,
  initialPane = 'members',
  source = 'pulled',
  boardError = null,
}: {
  status: SwarmStatus
  board: SwarmBoard
  onOpenRun?: (runId: string) => void
  initialPane?: SwarmPane
  /** Which board `board` is, named in the header. */
  source?: SwarmBoardView
  /** Why the live board could not be read, shown in the header. */
  boardError?: string | null
}) {
  const [pane, setPane] = useState<SwarmPane>(initialPane)

  const counts: Record<SwarmPane, number> = {
    members: Object.keys(status.members).length,
    threads: board.messageOrder.length,
    tasks: board.taskOrder.length,
    timeline: board.events.length,
  }

  return (
    <div className="flex h-full min-h-0 flex-col text-xs">
      <div className="border-border flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2">
        <StatusBadge status={status.status} />
        <span className="text-muted-foreground min-w-0 truncate">
          {status.board ?? board.board ?? 'no board yet'}
        </span>
        <span className="text-muted-foreground shrink-0">{sourceLabels[source]}</span>
        <span className="text-muted-foreground ml-auto shrink-0 font-mono tabular-nums">
          gen {status.generation} · {status.eventsRead} read
          {status.resets > 0 ? ` · ${status.resets} resets` : ''}
        </span>
        {boardError ? (
          <p className="text-status-failed w-full truncate" title={boardError}>
            board unreadable: {boardError}
          </p>
        ) : null}
        {status.error ? (
          <p className="text-status-failed w-full truncate" title={status.error}>
            {status.error}
          </p>
        ) : null}
      </div>
      <div
        role="tablist"
        className="border-border flex shrink-0 flex-wrap gap-1 border-b px-2 py-1.5"
      >
        {SWARM_PANES.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={pane === name}
            onClick={() => setPane(name)}
            className={cn(
              'flex h-6 items-center gap-1.5 rounded-md px-2 font-medium',
              pane === name
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {paneLabels[name]}
            <span className="font-mono text-[10px] tabular-nums opacity-70">{counts[name]}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={paneLabels[pane]} className="flex min-h-0 flex-1 flex-col">
        {pane === 'members' ? <MembersPane status={status} onOpenRun={onOpenRun} /> : null}
        {pane === 'threads' ? <ThreadsPane board={board} /> : null}
        {pane === 'tasks' ? <TasksPane board={board} /> : null}
        {pane === 'timeline' ? <TimelinePane board={board} /> : null}
      </div>
    </div>
  )
}

function MembersPane({
  status,
  onOpenRun,
}: {
  status: SwarmStatus
  onOpenRun?: (runId: string) => void
}) {
  const members = Object.entries(status.members).toSorted(([left], [right]) =>
    left.localeCompare(right),
  )

  if (members.length === 0) {
    return (
      <EmptyState title="No members woken yet">
        Members appear once the board wakes them.
      </EmptyState>
    )
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <ul className="divide-border divide-y">
        {members.map(([name, member]) => (
          <li key={name} className="grid gap-1 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
              <StatusBadge status={member.status} />
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                {member.activations} activation{member.activations === 1 ? '' : 's'}
              </span>
              {member.lastOutcome ? <span>last {member.lastOutcome}</span> : null}
              {member.runId ? (
                onOpenRun ? (
                  <button
                    type="button"
                    className="text-foreground truncate font-mono underline-offset-2 hover:underline"
                    onClick={() => onOpenRun(member.runId ?? '')}
                  >
                    {member.runId}
                  </button>
                ) : (
                  <span className="truncate font-mono">{member.runId}</span>
                )
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </ScrollArea>
  )
}

function Labels({ labels }: { labels: BoardMessage['labels'] }) {
  const entries = Object.entries(labels)

  if (entries.length === 0) {
    return null
  }

  return (
    <span className="flex flex-wrap gap-1">
      {entries.map(([key, value]) => (
        <span
          key={key}
          className="bg-muted text-muted-foreground rounded px-1 font-mono text-[10px]"
        >
          {key}={value}
        </span>
      ))}
    </span>
  )
}

function MessageItem({ message, reply }: { message: BoardMessage; reply: boolean }) {
  return (
    <div className={cn('grid gap-1', reply && 'border-border ml-3 border-l pl-3')}>
      <div className="flex items-baseline gap-2">
        <span className="font-medium">{message.by}</span>
        <span className="text-muted-foreground font-mono text-[10px]">
          {formatTime(message.createdAt)}
        </span>
        {message.mentions.length > 0 ? (
          <span className="text-muted-foreground truncate">
            → {message.mentions.map((name) => `@${name}`).join(' ')}
          </span>
        ) : null}
      </div>
      <p className="break-words whitespace-pre-wrap">{message.text}</p>
      <Labels labels={message.labels} />
    </div>
  )
}

/** Threads a channel shows at first. A long-lived board can hold thousands. */
export const THREADS_SHOWN = 200

function ThreadsPane({ board }: { board: SwarmBoard }) {
  const channels = useMemo(() => boardThreads(board), [board])
  const [shown, setShown] = useState(THREADS_SHOWN)

  if (channels.length === 0) {
    return (
      <EmptyState title="No messages yet">Messages appear as the swarm reads the board.</EmptyState>
    )
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="grid gap-3 p-3">
        {channels.map(({ channel, threads }) => {
          const hidden = Math.max(0, threads.length - shown)

          return (
            <section key={channel} aria-label={`#${channel}`} className="grid gap-2">
              <h3 className="text-muted-foreground font-mono text-[11px]">#{channel}</h3>
              {hidden > 0 ? (
                <button
                  type="button"
                  onClick={() => setShown(shown + THREADS_SHOWN)}
                  className="text-muted-foreground hover:bg-accent rounded px-1 py-1 text-left"
                >
                  Show older threads ({hidden} hidden)
                </button>
              ) : null}
              {threads.slice(hidden).map(({ root, replies }) => (
                <article
                  key={root.id}
                  className="border-border bg-card grid gap-2 rounded-md border p-2"
                >
                  <MessageItem message={root} reply={false} />
                  {replies.map((message) => (
                    <MessageItem key={message.id} message={message} reply />
                  ))}
                </article>
              ))}
            </section>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function TaskItem({ task }: { task: BoardTask }) {
  const facts = [
    task.holder ? `held by ${task.holder}` : undefined,
    task.leaseUntil === null ? undefined : `lease until ${formatTime(task.leaseUntil)}`,
    task.for ? `for ${task.for}` : undefined,
    task.needs.length > 0 ? `needs ${task.needs.join(', ')}` : undefined,
  ].filter((fact) => fact !== undefined)

  return (
    <li className="border-border bg-card grid gap-1 rounded-md border p-2">
      <div className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1 font-medium break-words">{task.text}</span>
        <span className="text-muted-foreground shrink-0 font-mono text-[10px]">{task.id}</span>
      </div>
      <div className="text-muted-foreground flex flex-wrap gap-x-3">
        <span>
          #{task.channel} by {task.by}
        </span>
        {facts.map((fact) => (
          <span key={fact}>{fact}</span>
        ))}
      </div>
      {task.note ? <p className="break-words whitespace-pre-wrap">{task.note}</p> : null}
    </li>
  )
}

function TasksPane({ board }: { board: SwarmBoard }) {
  const groups = boardTaskGroups(board)

  if (groups.length === 0) {
    return <EmptyState title="No tasks yet">Tasks appear as the swarm reads the board.</EmptyState>
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="grid gap-3 p-3">
        {groups.map(({ state, tasks }) => (
          <section key={state} aria-label={state} className="grid gap-2">
            <h3 className="flex items-center gap-2">
              <StatusBadge status={state} />
              <span className="text-muted-foreground font-mono tabular-nums">{tasks.length}</span>
            </h3>
            <ul className="grid gap-2">
              {tasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </ScrollArea>
  )
}

function eventSubject(event: BoardEvent): string {
  return event.task?.text ?? event.message?.text ?? ''
}

function TimelinePane({ board }: { board: SwarmBoard }) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <FollowList
      items={board.events}
      getKey={(event) => event.cursor}
      estimateSize={28}
      empty={<EmptyState title="No board events yet">The swarm has not read the board.</EmptyState>}
      renderItem={(event) => (
        <div className="px-2">
          <button
            type="button"
            aria-expanded={open === event.cursor}
            onClick={() => setOpen(open === event.cursor ? null : event.cursor)}
            className="hover:bg-accent flex w-full items-baseline gap-2 rounded px-1 py-1 text-left"
          >
            <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
              {formatTime(event.at)}
            </span>
            <span className="shrink-0 font-mono">{event.type}</span>
            <span className="text-muted-foreground shrink-0">{event.by}</span>
            <span className="min-w-0 truncate">{eventSubject(event)}</span>
          </button>
          {open === event.cursor ? (
            <JsonView value={event} className="border-border mb-1 rounded border p-2" />
          ) : null}
        </div>
      )}
    />
  )
}

function formatTime(at: number): string {
  return new Date(at).toISOString().slice(11, 19)
}
