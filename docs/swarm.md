# Swarms

A swarm is a set of agents that coordinate through one shared message board. No member calls another. A member posts, mentions a teammate, or puts a task on the board, and the swarm wakes whoever that concerns. The board is the swarm's only shared memory, so people can read it, write to it, and join the same threads.

`@swirls/looms/swarm` has two parts:

- A **swarm**: a long-lived run that follows a board and starts a member's agent run when the board has something for that member.
- A **message board**: the `MessageBoard` interface, an in-memory implementation, and a conformance suite for your own.

## Define a swarm

```ts
import { agent, defineAgent } from '@swirls/looms/agent'
import { createLooms } from '@swirls/looms/runtime'
import { defineSwarm, ensureSwarm, memberTools, swarm } from '@swirls/looms/swarm'

const triage = defineAgent({
  name: 'triage',
  instructions: 'Sort incoming reports. Create a task for the member who should handle each one.',
  resolveTools: memberTools,
})

const fixer = defineAgent({
  name: 'fixer',
  instructions: 'Claim the tasks assigned to you, do them, and settle them with the result.',
  resolveTools: memberTools,
})

export const ops = defineSwarm({
  name: 'ops',
  members: [
    { name: 'triage', agent: triage, channels: ['support/'], description: 'Sorts incoming work' },
    { name: 'fixer', agent: fixer, description: 'Fixes what triage hands over' },
  ],
})

const looms = createLooms({
  modules: [agent({ definitions: [triage, fixer], llm }), swarm({ definitions: [ops], board })],
})

await ensureSwarm(looms, ops, 'swarm_acme', { board: 'acme' })
```

`ensureSwarm` starts the swarm under a fixed run id, does nothing when it is already running, and starts it again when it was stopped or halted. Call it on boot or when you provision a tenant. See [Pause, stop and restart](#pause-stop-and-restart).

A member's `name` is how it signs its messages and how others mention it, so it must be lowercase letters, digits, and hyphens. `memberTools` gives the agent the board tools, bound to its own name and board. Any startable definition can be a member's `agent`, including a workflow.

## What wakes a member

The swarm reads the board's event log and wakes a member when:

- a message or a new task mentions it with `@name`
- a task assigned to it becomes ready
- a message is posted in one of its `channels`, or an unassigned task becomes ready there

`channels: ['support']` listens to one channel. `channels: ['support/']` listens to `support` and everything below it. A member with no channels is woken only by mentions and assigned tasks. A member is never woken by its own writes.

Each wake is one **activation**: a separate run of the member's agent. Its run id is derived from the swarm's run id, its generation, the member, and the activation number, in the host's id format: `activationRunId({ swarmRunId, member, activation, generation })` returns it. `generation` defaults to 1. The agent's first message lists what happened on the board and names the other members. A member runs one activation at a time. Events that arrive while it is running are queued and delivered together in the next activation.

An activation that cannot start, such as one whose agent is not registered, is retried like any effect. Once its retries are spent, the swarm drops the events it was woken for, marks the member `failed` in `swarmStatus` with the error in `lastError`, and goes on. The member is woken again by what reaches the board next.

Members keep no memory between activations. Whatever should outlive a turn belongs on the board.

## Board tools

`memberTools` adds these tools to the agent:

| Tool                | What it does                                                             |
| ------------------- | ------------------------------------------------------------------------ |
| `board_read`        | Read a thread, a channel or subtree, or the messages that mention you    |
| `board_view`        | Look at the files attached to one message or task                        |
| `board_post`        | Start a thread in a channel                                              |
| `board_reply`       | Reply in a thread                                                        |
| `board_label`       | Set or unset `key=value` labels on a message, optionally compare-and-set |
| `board_create_task` | Put work on the board, optionally assigned (`for`) or ordered (`needs`)  |
| `board_list_tasks`  | List tasks by channel, state, or assignee                                |
| `board_claim_task`  | Claim one task, or the oldest ready task in a channel                    |
| `board_settle_task` | Finish a claimed task as `completed`, `failed`, `blocked`, or `released` |
| `board_renew_task`  | Extend the lease of a task the member still holds                        |
| `board_reopen_task` | Return a blocked, failed or canceled task to the queue                   |
| `board_cancel_task` | Withdraw a task that should no longer be done                            |

Each call is a Looms effect, so it is recorded on the member's run as an event such as `swarm.message.posted` or `swarm.task.claimed`. Posts and new tasks carry the effect id as an idempotency key, so a retried effect does not write twice. When the board refuses a call, for example a claim on a task someone else holds, the run records `swarm.call.rejected` and the agent sees the reason as a tool error.

Threads and workflow nodes can write to a board without being members. `swarm().steps.post` and `swarm().steps.createTask` return the effects and park until the board answers:

```ts
import { createTask } from '@swirls/looms/swarm'

run: (ctx) =>
  ctx.effects(
    createTask(
      { board: 'acme', as: 'billing-workflow' },
      { channel: 'support', text: 'Refund order 1042', for: 'fixer' },
    ),
  )
```

## Attachments

A message or a task can carry files: screenshots, recordings, documents. The board holds a reference to each file and never the bytes. A reference is the agent module's `Attachment`: an `id`, a `mediaType`, and optionally a `name`, a `size`, and a `url`.

```ts
await board.post({
  by: 'dana',
  channel: 'support',
  text: '@fixer the login page looks like this',
  attachments: [{ id: 'uploads/7f3a', mediaType: 'image/png', name: 'login.png' }],
})
```

Store the bytes wherever suits the application, and tell the model adapter how to read a reference with `resolveAttachment` (see [AI providers](./ai-providers.md#attachments)). A member then meets files in three ways:

- **When it is woken.** The files on the messages that woke it are attached to its first message, up to 10 per activation.
- **When it reads.** `board_read` lists each message's references. `board_view` shows the files of one message or task to the model.
- **When it writes.** `board_post`, `board_reply`, and `board_create_task` take `attachments`. A member passes on a reference it read from the board, or one that its own tool produced.

A tool of your own can hand a member a new file. When a tool result has an `attachments` list at its top level, the agent shows those files to the model with the result. A screenshot tool that stores the image and returns `{ attachments: [reference] }` lets the member both see the screenshot and post it.

A message carries at most 10 attachments. The board stores references as they are given, and a member can write any `id`. `resolveAttachment` is told which run it reads for, so make it refuse an id that does not belong to that run's tenant. See [Tenants](#tenants).

## Tasks

A task is a thread with state the board keeps. Its id is the id of its root message, so members discuss a task by replying to it.

| State       | Meaning                                               |
| ----------- | ----------------------------------------------------- |
| `waiting`   | Some task in `needs` is not completed                 |
| `ready`     | Can be claimed                                        |
| `claimed`   | One member holds it under a lease                     |
| `blocked`   | The holder stopped and recorded what it is waiting on |
| `completed` | Done. Tasks that needed it become ready               |
| `failed`    | The holder gave up and recorded why                   |
| `canceled`  | Withdrawn                                             |

A claim is a lease, 15 minutes by default and at most an hour. When the lease passes, the task returns to `ready` and the old claim is dead: its token fails with `claim_lost`. A member that stalled therefore cannot settle a task another member has since claimed. Only one claim holds a task at a time. A member whose work outlasts the lease calls `board_renew_task` with its token before the lease passes.

## Reading the board on time

The swarm reads the board when it starts, after each member's run finishes, on a `nudge`, and every `pollIntervalMs` (60 seconds by default).

Send a nudge when something outside the swarm writes to the board, such as a person posting from your UI:

```ts
import { nudge } from '@swirls/looms/swarm'

await board.post({ by: 'dana', channel: 'support', text: 'Nobody can log in' })
await looms.signal('swarm_acme', [nudge()])
```

If every outside write nudges, set `pollIntervalMs: null` and the swarm stops polling. Each poll appends an event to the swarm's run, so a swarm that polls an idle board still grows its log.

When the board cannot be read, the swarm tries again after 30 seconds and then less often, up to every 15 minutes, until a read works or a nudge arrives.

### Resting members

A member with `restMs` is not woken again until that long after its last run ended. Board activity that arrives meanwhile waits in its inbox and wakes it once, in one activation, when the rest ends. The swarm wakes it then without a nudge. Use it to bound what a busy board costs: a member with `restMs: 60_000` runs at most once a minute.

```ts
{ name: 'triage', agent: triage, channels: ['support/'], restMs: 60_000 }
```

## Pause, stop and restart

A swarm's run stays open for as long as the swarm exists, so a host can keep one run id per tenant for good. Four signals change what it does:

| Signal                      | What the swarm does                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `pause()`                   | Wakes nobody and reads nothing. Keeps its cursor and every member's inbox                                            |
| `resume()`                  | Carries on from where it paused: reads from its cursor and wakes whoever has something waiting                       |
| `stop()`                    | Wakes nobody and reads nothing, and drops what is waiting in the inboxes                                             |
| `restart({ board, after })` | Starts a new generation: clean member state, and reading from `after` (a cursor, or `null` for the start of the log) |

Members that are mid-run when the swarm pauses or stops finish their run. `restart` works on a running, paused, stopped or halted swarm. It keeps the swarm's cursor unless `after` is given, or reads from the start when `board` names a different board. A member still running from the earlier generation finishes before the new generation wakes it.

```ts
import { pause, restart, resume, stop } from '@swirls/looms/swarm'

await looms.signal('swarm_acme', [pause()])
await looms.signal('swarm_acme', [resume()])
await looms.signal('swarm_acme', [stop()])
await looms.signal('swarm_acme', [restart({ after: null })]) // read the board again from the start
```

Each generation numbers its activations from 1, and its activation run ids include the generation, so a restarted swarm never starts a run an earlier generation already used. The first generation's ids are the ones swarms had before generations.

`ensureSwarm` restarts a stopped or halted swarm from its cursor, on the board in its `config` (or its current board), and answers `'restarted'`. It leaves a paused swarm paused and answers `'paused'`: resume it on purpose. Pass `{ restart: { after: null } }` to restart from the start of the log, or `{ restart: false }` to leave a stopped swarm as it is. Two hosts that ensure the same stopped swarm at once start one generation.

A swarm **halts** when it cannot go on: its board refuses it (`BoardError`), or its definition is unknown. It records why, wakes nobody, and waits for a restart. To end a swarm for good, cancel its run; a cancelled run id cannot be used again.

### A board that was reset

A board's log can start again from empty, such as when its storage is replaced. The swarm's cursor then names a position the new log never issued. The board refuses that cursor with `cursor_unknown`, and the swarm reads the new log from its start. Members keep their state, and `swarmStatus.resets` counts how often it happened. To start the members over as well, `restart()` the swarm.

## Tenants

A host that serves many tenants starts each swarm with the tenant in its run attributes:

```ts
await ensureSwarm(
  looms,
  ops,
  `swarm_${businessId}`,
  { board: businessId },
  { attributes: { orgId, businessId } },
)
```

Every member run inherits those attributes, and so does anything a member launches. The host's own code receives them in four places, and each one is where a tenant boundary is enforced:

| Where                                | What to do with the attributes                                      |
| ------------------------------------ | ------------------------------------------------------------------- |
| `boards(boardId, caller)`            | Return the tenant's board, and refuse an id the tenant does not own |
| `resolveAttachment(attachment, run)` | Read only files that belong to the tenant                           |
| A tool's `handler(input, ctx)`       | Build storage keys from the tenant, never from a tool argument      |
| `resolveTools(ctx)`                  | Choose the tools the tenant may use                                 |

A board resolver refuses by throwing `BoardError` with the code `board_denied`:

```ts
swarm({
  definitions,
  boards: (boardId, caller) => {
    if (boardId !== caller.attributes.businessId) {
      throw new BoardError({ code: 'board_denied', message: 'Not your board' })
    }

    return createPostgresBoard(sql, boardId)
  },
})
```

A swarm whose own board is refused halts until it is restarted. A member's or a workflow's call to a refused board comes back as a tool error or a failed step.

Three more things to know:

- `swarm({ board })` gives every swarm the same board. Use it only on a host with one tenant.
- Secrets are not inherited. A member run gets what the host's secret provider decides for it.
- Definition names are shared by the whole host. Give each tenant's swarm and agents names no other tenant can have.

## Status

The `swarmStatus` projection shows where the swarm is on the board and what each member is doing:

```ts
import { swarmStatus } from '@swirls/looms/swarm'

const view = await looms.project('swarm_acme', swarmStatus)
// view.status → 'running', view.generation → 1
// view.members.fixer → { status: 'idle', activations: 3, runId: 'run_…', lastOutcome: 'completed', lastError: null }
```

`status` is one of:

| Status      | Meaning                                                 |
| ----------- | ------------------------------------------------------- |
| `running`   | Following the board and waking members                  |
| `paused`    | Waiting for `resume()`                                  |
| `stopping`  | Stopped, with members still mid-run                     |
| `stopped`   | Waiting for `restart()`                                 |
| `halted`    | Cannot go on; `error` says why. Waiting for `restart()` |
| `failed`    | The run itself failed. Its run id cannot be used again  |
| `cancelled` | The run was cancelled. Its run id cannot be used again  |

`generation` counts the swarm's starts in its run, `error` says why it halted or failed, and `resets` counts the times its board's log was reset under it.

A member's `status` is `idle`, `active` while its run is in progress, or `failed` when its latest activation could not start. `lastOutcome` is how its latest run ended, and `lastError` says why that activation could not start or that run failed.

Inside a Durable Object, or from the Worker that holds its namespace, read the projection without the HTTP API: `this.project(swarmStatus)` in the object, or `readProjection(env.RUNS.getByName(runId), swarmStatus)` from the Worker.

## Bring your own board

`swarm({ board })` shares one board across the host. `swarm({ boards })` takes a resolver from board id to board, for a host with a board per tenant. A swarm's board id comes from its start input and defaults to its run id. With neither option, boards are held in memory and do not survive a restart.

Implement `MessageBoard` over your own store:

```ts
import type { MessageBoard } from '@swirls/looms/swarm'

export function createPostgresBoard(sql: Sql, boardId: string): MessageBoard {
  return {
    post: (input) => …,
    reply: (input) => …,
    label: (input) => …,
    messages: (query) => …,
    createTask: (input) => …,
    tasks: (query) => …,
    claim: (input) => …,
    renew: (input) => …,
    settle: (input) => …,
    reopen: (input) => …,
    cancel: (input) => …,
    events: (query) => …,
  }
}
```

The rules a board keeps:

- Every write appends to one ordered event log. Cursors are opaque strings.
- `events({ after })` refuses with `cursor_unknown` a cursor its current log did not issue: one past the end of the log, one from another board, or one from before the log was reset. It never answers such a cursor with an empty page, or the swarm would wait on it forever. A board whose log can start again should put something in its cursors that names the log, such as a log id or epoch, so an old cursor is not mistaken for a position in the new log.
- `post`, `reply`, and `createTask` are idempotent on `key`.
- A message returns the attachments it was written with, in order, and an empty list when it had none. More than 10 is refused with `invalid_input`.
- `messages({ id })` returns the one message with that id, whether it is a root or a reply.
- At most one claim holds a task. A claim ends when it is settled, when its lease passes, or when the task is canceled, and its token stops working.
- A task whose lease has passed is ready again, and the log gains a `task.ready` event no later than the next read of tasks or events.
- Completing a task readies every waiting task whose needs are now all completed.
- Reject a request the board refuses with `BoardError` and a code. The swarm reports it to the calling agent and does not retry. Any other rejection is treated as a fault and retried.

`boardConformance` checks those rules. It calls your factory for a fresh board before each check, and for a second one where a check needs it (boards from separate calls must be separate logs), and returns one line per failure. The board must read time from the clock it is given, because the suite advances that clock to expire leases:

```ts
import { boardConformance } from '@swirls/looms/swarm'

expect(await boardConformance((clock) => createPostgresBoard(sql, newBoardId(), clock))).toEqual([])
```

`createMemoryBoard` is the reference implementation. Read it alongside the interface when you write your own.

### A board in another process

On a host where each run is its own process, such as Durable Objects, the swarm and its members cannot share a board in memory. Keep the board in a database, serve it from the service that owns the database, and give the runs a remote board:

```ts
import { boardHandler, remoteBoard } from '@swirls/looms/swarm'

// Where the store is. `resolve` authenticates the request and picks the caller's board.
const handle = boardHandler((request) => boardFor(tenantOf(request)))

// In the host that runs the swarm.
swarm({
  definitions: [ops],
  boards: (boardId, caller) =>
    remoteBoard({
      url: `https://boards.example.test/${boardId}`,
      headers: () => ({ authorization: `Bearer ${tokenFor(caller)}` }),
    }),
})
```

One request is one board call: a POST of `{ method, input }`, answered with `{ ok: true, value }` or `{ ok: false, code, message }`. A refusal reaches the caller as the same `BoardError` a local board throws. Any other status is a fault and the swarm retries it. `answerBoardCall(board, call)` does the same without a `Request`, for a route of your own. The remote board passes `boardConformance` over the memory board, so a board that passes locally keeps the contract when served.
