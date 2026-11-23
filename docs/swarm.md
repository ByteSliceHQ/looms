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

`ensureSwarm` starts the swarm under a fixed run id, or does nothing when that run already exists. Call it on boot or when you provision a tenant.

A member's `name` is how it signs its messages and how others mention it, so it must be lowercase letters, digits, and hyphens. `memberTools` gives the agent the board tools, bound to its own name and board. Any startable definition can be a member's `agent`, including a workflow.

## What wakes a member

The swarm reads the board's event log and wakes a member when:

- a message or a new task mentions it with `@name`
- a task assigned to it becomes ready
- a message is posted in one of its `channels`, or an unassigned task becomes ready there

`channels: ['support']` listens to one channel. `channels: ['support/']` listens to `support` and everything below it. A member with no channels is woken only by mentions and assigned tasks. A member is never woken by its own writes.

Each wake is one **activation**: a separate run of the member's agent, with run id `<swarm run id>:<member>:<n>`. The agent's first message lists what happened on the board and names the other members. A member runs one activation at a time. Events that arrive while it is running are queued and delivered together in the next activation.

Members keep no memory between activations. Whatever should outlive a turn belongs on the board.

## Board tools

`memberTools` adds these tools to the agent:

| Tool                | What it does                                                             |
| ------------------- | ------------------------------------------------------------------------ |
| `board_read`        | Read a thread, a channel or subtree, or the messages that mention you    |
| `board_post`        | Start a thread in a channel                                              |
| `board_reply`       | Reply in a thread                                                        |
| `board_label`       | Set or unset `key=value` labels on a message, optionally compare-and-set |
| `board_create_task` | Put work on the board, optionally assigned (`for`) or ordered (`needs`)  |
| `board_list_tasks`  | List tasks by channel, state, or assignee                                |
| `board_claim_task`  | Claim one task, or the oldest ready task in a channel                    |
| `board_settle_task` | Finish a claimed task as `completed`, `failed`, `blocked`, or `released` |

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

A claim is a lease, 15 minutes by default and at most an hour. When the lease passes, the task returns to `ready` and the old claim is dead: its token fails with `claim_lost`. A member that stalled therefore cannot settle a task another member has since claimed. Only one claim holds a task at a time.

## Reading the board on time

The swarm reads the board when it starts, after each member's run finishes, on a `nudge`, and every `pollIntervalMs` (60 seconds by default).

Send a nudge when something outside the swarm writes to the board, such as a person posting from your UI:

```ts
import { nudge } from '@swirls/looms/swarm'

await board.post({ by: 'dana', channel: 'support', text: 'Nobody can log in' })
await looms.signal('swarm_acme', [nudge()])
```

If every outside write nudges, set `pollIntervalMs: null` and the swarm stops polling. Each poll appends an event to the swarm's run, so a swarm that polls an idle board still grows its log.

`stop()` ends a swarm. It stops waking members and completes once the members that are mid-run have finished.

## Status

The `swarmStatus` projection shows where the swarm is on the board and what each member is doing:

```ts
import { swarmStatus } from '@swirls/looms/swarm'

const view = await looms.project('swarm_acme', swarmStatus)
// view.members.fixer → { status: 'idle', activations: 3, runId: '…:fixer:3', lastOutcome: 'completed' }
```

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
- `post`, `reply`, and `createTask` are idempotent on `key`.
- At most one claim holds a task. A claim ends when it is settled, when its lease passes, or when the task is canceled, and its token stops working.
- A task whose lease has passed is ready again, and the log gains a `task.ready` event no later than the next read of tasks or events.
- Completing a task readies every waiting task whose needs are now all completed.
- Reject a request the board refuses with `BoardError` and a code. The swarm reports it to the calling agent and does not retry. Any other rejection is treated as a fault and retried.

`boardConformance` checks those rules. It calls your factory for a fresh board before each check and returns one line per failure. The board must read time from the clock it is given, because the suite advances that clock to expire leases:

```ts
import { boardConformance } from '@swirls/looms/swarm'

expect(await boardConformance((clock) => createPostgresBoard(sql, newBoardId(), clock))).toEqual([])
```

`createMemoryBoard` is the reference implementation. Read it alongside the interface when you write your own.
