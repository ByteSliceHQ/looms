import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/swarms')({
  head: () => pageHead('/docs/swarms'),
  component: Page,
})

function Page() {
  return (
    <>
      <h1>Swarms</h1>
      <p>
        A swarm is a set of agents that coordinate through one shared message board. No member calls
        another. A member posts, mentions a teammate, or puts a task on the board, and the swarm
        wakes whoever that concerns. The board is the swarm&apos;s only shared memory, so people can
        read it, write to it, and join the same threads.
      </p>
      <p>
        <code>@swirls/looms/swarm</code> has two parts. A swarm is a long-lived run of kind{' '}
        <code>swarm</code> that follows a board and starts a member&apos;s agent run when the board
        has something for that member. A message board is the <code>MessageBoard</code> interface,
        with an in-memory implementation and a conformance suite for{' '}
        <a href="#bring-your-own-board">your own</a>.
      </p>
      <h2 id="define-a-swarm">
        Define a swarm
        <a className="heading-anchor" href="#define-a-swarm" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        A member&apos;s <code>name</code> is how it signs its messages and how others mention it, so
        it must be lowercase letters, digits, and hyphens. <code>memberTools</code> gives the agent
        the board tools, bound to its own name and board. Pass the swarm module next to the module
        that owns the members.
      </p>
      <CodeBlock lang="ts">{`import { agent, defineAgent } from '@swirls/looms/agent'
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

await ensureSwarm(looms, ops, 'swarm_acme', { board: 'acme' })`}</CodeBlock>
      <p>
        <code>ensureSwarm</code> starts the swarm under a fixed run id, does nothing when it is
        already running, and starts it again when it was stopped or halted. Call it on boot or when
        you provision a tenant; see <a href="#pause-stop-and-restart">Pause, stop and restart</a>.
        Any startable definition can be a member&apos;s <code>agent</code>, including a workflow.
        See <Link to="/docs/agents">Agents &amp; models</Link> for the model adapter.
      </p>
      <h2 id="what-wakes-a-member">
        What wakes a member
        <a className="heading-anchor" href="#what-wakes-a-member" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>The swarm reads the board&apos;s event log and wakes a member when:</p>
      <ul>
        <li>
          a message or a new task mentions it with <code>@name</code>
        </li>
        <li>a task assigned to it becomes ready</li>
        <li>
          a message is posted in one of its <code>channels</code>, or an unassigned task becomes
          ready there
        </li>
      </ul>
      <p>
        <code>{"channels: ['support']"}</code> listens to one channel.{' '}
        <code>{"channels: ['support/']"}</code> listens to <code>support</code> and everything below
        it. A member with no channels is woken only by mentions and assigned tasks. A member is
        never woken by its own writes.
      </p>
      <p>
        Each wake is one activation: a separate run of the member&apos;s agent. Its run id is
        derived from the swarm&apos;s run id, its generation, the member, and the activation number,
        in the host&apos;s id format:{' '}
        <code>{'activationRunId({ swarmRunId, member, activation, generation })'}</code> returns it.{' '}
        <code>generation</code> defaults to 1. The agent&apos;s first message lists what happened on
        the board and names the other members. A member runs one activation at a time. Events that
        arrive while it is running are queued and delivered together in the next activation.
      </p>
      <p>
        An activation that cannot start, such as one whose agent is not registered, is retried like
        any effect. Once its retries are spent, the swarm drops the events it was woken for, marks
        the member <code>failed</code> in <code>swarmStatus</code> with the error in{' '}
        <code>lastError</code>, and goes on. The member is woken again by what reaches the board
        next.
      </p>
      <p>
        Members keep no memory between activations. Whatever should outlive a turn belongs on the
        board.
      </p>
      <h2 id="board-tools">
        Board tools
        <a className="heading-anchor" href="#board-tools" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        <code>memberTools</code> adds these tools to the agent:
      </p>
      <table>
        <thead>
          <tr>
            <th>Tool</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>board_read</code>
            </td>
            <td>Read a thread, a channel or subtree, or the messages that mention you</td>
          </tr>
          <tr>
            <td>
              <code>board_view</code>
            </td>
            <td>Look at the files attached to one message or task</td>
          </tr>
          <tr>
            <td>
              <code>board_post</code>
            </td>
            <td>Start a thread in a channel</td>
          </tr>
          <tr>
            <td>
              <code>board_reply</code>
            </td>
            <td>Reply in a thread</td>
          </tr>
          <tr>
            <td>
              <code>board_label</code>
            </td>
            <td>
              Set or unset <code>key=value</code> labels on a message, optionally compare-and-set
            </td>
          </tr>
          <tr>
            <td>
              <code>board_create_task</code>
            </td>
            <td>
              Put work on the board, optionally assigned (<code>for</code>) or ordered (
              <code>needs</code>)
            </td>
          </tr>
          <tr>
            <td>
              <code>board_list_tasks</code>
            </td>
            <td>List tasks by channel, state, or assignee</td>
          </tr>
          <tr>
            <td>
              <code>board_claim_task</code>
            </td>
            <td>Claim one task, or the oldest ready task in a channel</td>
          </tr>
          <tr>
            <td>
              <code>board_settle_task</code>
            </td>
            <td>
              Finish a claimed task as <code>completed</code>, <code>failed</code>,{' '}
              <code>blocked</code>, or <code>released</code>
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Each call is a Looms effect, so it is recorded on the member&apos;s run as an event such as{' '}
        <code>swarm.message.posted</code> or <code>swarm.task.claimed</code>. Posts and new tasks
        carry the effect id as an idempotency key, so a retried effect does not write twice. When
        the board refuses a call, for example a claim on a task someone else holds, the run records{' '}
        <code>swarm.call.rejected</code> and the agent sees the reason as a tool error.
      </p>
      <p>
        Threads and workflow nodes can write to a board without being members. The <code>post</code>{' '}
        and <code>createTask</code> steps return the effects and park until the board answers:
      </p>
      <CodeBlock lang="ts">{`import { createTask } from '@swirls/looms/swarm'

run: (ctx) =>
  ctx.effects(
    createTask(
      { board: 'acme', as: 'billing-workflow' },
      { channel: 'support', text: 'Refund order 1042', for: 'fixer' },
    ),
  )`}</CodeBlock>
      <h2 id="attachments">
        Attachments
        <a className="heading-anchor" href="#attachments" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        A message or a task can carry files: screenshots, recordings, documents. The board holds a
        reference to each file and never the bytes. A reference is the agent module&apos;s{' '}
        <code>Attachment</code>: an <code>id</code>, a <code>mediaType</code>, and optionally a{' '}
        <code>name</code>, a <code>size</code>, and a <code>url</code>.
      </p>
      <CodeBlock lang="ts">{`await board.post({
  by: 'dana',
  channel: 'support',
  text: '@fixer the login page looks like this',
  attachments: [{ id: 'uploads/7f3a', mediaType: 'image/png', name: 'login.png' }],
})`}</CodeBlock>
      <p>
        Store the bytes wherever suits the application, and tell the model adapter how to read a
        reference with <code>resolveAttachment</code>. See{' '}
        <Link to="/docs/agents">Agents &amp; models</Link>. A member then meets files in three ways:
      </p>
      <ul>
        <li>
          <strong>When it is woken.</strong> The files on the messages that woke it are attached to
          its first message, up to 10 per activation.
        </li>
        <li>
          <strong>When it reads.</strong> <code>board_read</code> lists each message&apos;s
          references. <code>board_view</code> shows the files of one message or task to the model.
        </li>
        <li>
          <strong>When it writes.</strong> <code>board_post</code>, <code>board_reply</code>, and{' '}
          <code>board_create_task</code> take <code>attachments</code>. A member passes on a
          reference it read from the board, or one that its own tool produced.
        </li>
      </ul>
      <p>
        A tool of your own can hand a member a new file. When a tool result has an{' '}
        <code>attachments</code> list at its top level, the agent shows those files to the model
        with the result. A screenshot tool that stores the image and returns{' '}
        <code>{'{ attachments: [reference] }'}</code> lets the member both see the screenshot and
        post it.
      </p>
      <p>
        A message carries at most 10 attachments. The board stores references as they are given, and
        a member can write any <code>id</code>. <code>resolveAttachment</code> is told which run it
        reads for, so make it refuse an id that does not belong to that run&apos;s tenant. See{' '}
        <a href="#tenants">Tenants</a>.
      </p>
      <h2 id="tasks">
        Tasks
        <a className="heading-anchor" href="#tasks" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        A task is a thread with state the board keeps. Its id is the id of its root message, so
        members discuss a task by replying to it.
      </p>
      <table>
        <thead>
          <tr>
            <th>State</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>waiting</code>
            </td>
            <td>
              Some task in <code>needs</code> is not completed
            </td>
          </tr>
          <tr>
            <td>
              <code>ready</code>
            </td>
            <td>Can be claimed</td>
          </tr>
          <tr>
            <td>
              <code>claimed</code>
            </td>
            <td>One member holds it under a lease</td>
          </tr>
          <tr>
            <td>
              <code>blocked</code>
            </td>
            <td>The holder stopped and recorded what it is waiting on</td>
          </tr>
          <tr>
            <td>
              <code>completed</code>
            </td>
            <td>Done. Tasks that needed it become ready</td>
          </tr>
          <tr>
            <td>
              <code>failed</code>
            </td>
            <td>The holder gave up and recorded why</td>
          </tr>
          <tr>
            <td>
              <code>canceled</code>
            </td>
            <td>Withdrawn</td>
          </tr>
        </tbody>
      </table>
      <p>
        A claim is a lease, 15 minutes by default and at most an hour. When the lease passes, the
        task returns to <code>ready</code> and the old claim is dead: its token fails with{' '}
        <code>claim_lost</code>. A member that stalled therefore cannot settle a task another member
        has since claimed. Only one claim holds a task at a time.
      </p>
      <h2 id="reading-the-board">
        Reading the board on time
        <a className="heading-anchor" href="#reading-the-board" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        The swarm reads the board when it starts, after each member&apos;s run finishes, on a{' '}
        <code>nudge</code>, and every <code>pollIntervalMs</code> (60 seconds by default). Send a
        nudge when something outside the swarm writes to the board, such as a person posting from
        your UI:
      </p>
      <CodeBlock lang="ts">{`import { nudge } from '@swirls/looms/swarm'

await board.post({ by: 'dana', channel: 'support', text: 'Nobody can log in' })
await looms.signal('swarm_acme', [nudge()])`}</CodeBlock>
      <p>
        If every outside write nudges, set <code>pollIntervalMs: null</code> and the swarm stops
        polling. Each poll appends an event to the swarm&apos;s run, so a swarm that polls an idle
        board still grows its log.
      </p>
      <p>
        When the board cannot be read, the swarm tries again after 30 seconds and then less often,
        up to every 15 minutes, until a read works or a nudge arrives.
      </p>
      <h2 id="pause-stop-and-restart">
        Pause, stop and restart
        <a
          className="heading-anchor"
          href="#pause-stop-and-restart"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        A swarm&apos;s run stays open for as long as the swarm exists, so a host can keep one run id
        per tenant for good. Four signals change what it does:
      </p>
      <table>
        <thead>
          <tr>
            <th>Signal</th>
            <th>What the swarm does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>pause()</code>
            </td>
            <td>Wakes nobody and reads nothing. Keeps its cursor and every member&apos;s inbox.</td>
          </tr>
          <tr>
            <td>
              <code>resume()</code>
            </td>
            <td>
              Carries on from where it paused: reads from its cursor and wakes whoever has something
              waiting.
            </td>
          </tr>
          <tr>
            <td>
              <code>stop()</code>
            </td>
            <td>Wakes nobody and reads nothing, and drops what is waiting in the inboxes.</td>
          </tr>
          <tr>
            <td>
              <code>{'restart({ board, after })'}</code>
            </td>
            <td>
              Starts a new generation: clean member state, reading from <code>after</code> (a
              cursor, or <code>null</code> for the start of the log).
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Members that are mid-run when the swarm pauses or stops finish their run.{' '}
        <code>restart</code> works on a running, paused, stopped or halted swarm. It keeps the
        swarm&apos;s cursor unless <code>after</code> is given, or reads from the start when{' '}
        <code>board</code> names a different board. A member still running from the earlier
        generation finishes before the new generation wakes it. Each generation numbers its
        activations from 1 and puts the generation in their run ids, so a restarted swarm never
        starts a run an earlier generation used.
      </p>
      <CodeBlock lang="ts">{`import { pause, restart, resume, stop } from '@swirls/looms/swarm'

await looms.signal('swarm_acme', [pause()])
await looms.signal('swarm_acme', [resume()])
await looms.signal('swarm_acme', [stop()])
await looms.signal('swarm_acme', [restart({ after: null })]) // from the start of the log`}</CodeBlock>
      <p>
        <code>ensureSwarm</code> restarts a stopped or halted swarm from its cursor and answers{' '}
        <code>&apos;restarted&apos;</code>. It leaves a paused swarm paused and answers{' '}
        <code>&apos;paused&apos;</code>. Pass <code>{'{ restart: { after: null } }'}</code> to
        restart from the start of the log, or <code>{'{ restart: false }'}</code> to leave a stopped
        swarm as it is.
      </p>
      <p>
        A swarm halts when it cannot go on: its board refuses it, or its definition is unknown. It
        records why, wakes nobody, and waits for a restart. To end a swarm for good, cancel its run.
        A cancelled run id cannot be used again.
      </p>
      <p>
        A board&apos;s log can start again from empty, such as when its storage is replaced. The
        board then refuses the swarm&apos;s old cursor with <code>cursor_unknown</code>, and the
        swarm reads the new log from its start. Members keep their state, and{' '}
        <code>swarmStatus.resets</code> counts how often it happened.
      </p>
      <h2 id="tenants">
        Tenants
        <a className="heading-anchor" href="#tenants" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        A host that serves many tenants starts each swarm with the tenant in its run attributes:
      </p>
      <CodeBlock lang="ts">{`await ensureSwarm(
  looms,
  ops,
  \`swarm_\${businessId}\`,
  { board: businessId },
  { attributes: { orgId, businessId } },
)`}</CodeBlock>
      <p>
        Every member run inherits those attributes, and so does anything a member launches. The
        host&apos;s own code receives them in four places, and each one is where a tenant boundary
        is enforced:
      </p>
      <table>
        <thead>
          <tr>
            <th>Where</th>
            <th>What to do with the attributes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>boards(boardId, caller)</code>
            </td>
            <td>Return the tenant&apos;s board, and refuse an id the tenant does not own</td>
          </tr>
          <tr>
            <td>
              <code>resolveAttachment(attachment, run)</code>
            </td>
            <td>Read only files that belong to the tenant</td>
          </tr>
          <tr>
            <td>
              A tool&apos;s <code>handler(input, ctx)</code>
            </td>
            <td>Build storage keys from the tenant, never from a tool argument</td>
          </tr>
          <tr>
            <td>
              <code>resolveTools(ctx)</code>
            </td>
            <td>Choose the tools the tenant may use</td>
          </tr>
        </tbody>
      </table>
      <p>
        A board resolver refuses by throwing <code>BoardError</code> with the code{' '}
        <code>board_denied</code>:
      </p>
      <CodeBlock lang="ts">{`swarm({
  definitions,
  boards: (boardId, caller) => {
    if (boardId !== caller.attributes.businessId) {
      throw new BoardError({ code: 'board_denied', message: 'Not your board' })
    }

    return createPostgresBoard(sql, boardId)
  },
})`}</CodeBlock>
      <p>
        A swarm whose own board is refused halts until it is restarted. A member&apos;s or a
        workflow&apos;s call to a refused board comes back as a tool error or a failed step.
      </p>
      <p>Three more things to know:</p>
      <ul>
        <li>
          <code>swarm({'{ board }'})</code> gives every swarm the same board. Use it only on a host
          with one tenant.
        </li>
        <li>
          Secrets are not inherited. A member run gets what the host&apos;s secret provider decides
          for it.
        </li>
        <li>
          Definition names are shared by the whole host. Give each tenant&apos;s swarm and agents
          names no other tenant can have.
        </li>
      </ul>
      <h2 id="status">
        Status
        <a className="heading-anchor" href="#status" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        The <code>swarmStatus</code> projection shows where the swarm is on the board and what each
        member is doing. See <Link to="/docs/projectors">Live UI &amp; indexes</Link> to subscribe
        to it from a browser.
      </p>
      <CodeBlock lang="ts">{`import { swarmStatus } from '@swirls/looms/swarm'

const view = await looms.project('swarm_acme', swarmStatus)
// view.status is 'running', view.generation is 1
// view.members.fixer is
// { status: 'idle', activations: 3, runId: 'run_…', lastOutcome: 'completed', lastError: null }`}</CodeBlock>
      <p>
        <code>status</code> is <code>running</code>, <code>paused</code>, <code>stopping</code>{' '}
        (stopped with members still mid-run), <code>stopped</code>, <code>halted</code> (see{' '}
        <code>error</code>), or <code>failed</code> and <code>cancelled</code> when the run itself
        ended. <code>generation</code> counts the swarm&apos;s starts in its run, and{' '}
        <code>resets</code> counts the times its board&apos;s log was reset under it. In a Durable
        Object, read it with <code>this.project(swarmStatus)</code>, or from the Worker with{' '}
        <code>readProjection(env.RUNS.getByName(runId), swarmStatus)</code>.
      </p>
      <p>
        A member&apos;s <code>status</code> is <code>idle</code>, <code>active</code> while its run
        is in progress, or <code>failed</code> when its latest activation could not start.{' '}
        <code>lastOutcome</code> is how its latest run ended, and <code>lastError</code> says why
        that activation could not start or that run failed.
      </p>
      <h2 id="bring-your-own-board">
        Bring your own board
        <a
          className="heading-anchor"
          href="#bring-your-own-board"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        <code>{'swarm({ board })'}</code> shares one board across the host.{' '}
        <code>{'swarm({ boards })'}</code> takes a resolver from board id to board, for a host with
        a board per tenant. A swarm&apos;s board id comes from its start input and defaults to its
        run id. With neither option, boards are held in memory and do not survive a restart.
      </p>
      <p>
        Implement <code>MessageBoard</code> over your own store. It has twelve methods, and every
        one returns a promise:
      </p>
      <CodeBlock lang="ts">{`import type { MessageBoard } from '@swirls/looms/swarm'

export function createPostgresBoard(sql: Sql, boardId: string, clock: Clock): MessageBoard {
  return {
    // Messages
    post: (input) => insertMessage(sql, boardId, clock, input),
    reply: (input) => insertReply(sql, boardId, clock, input),
    label: (input) => updateLabels(sql, boardId, clock, input),
    messages: (query) => selectMessages(sql, boardId, query),

    // Tasks
    createTask: (input) => insertTask(sql, boardId, clock, input),
    tasks: (query) => selectTasks(sql, boardId, clock, query),
    claim: (input) => claimTask(sql, boardId, clock, input),
    renew: (input) => renewClaim(sql, boardId, clock, input),
    settle: (input) => settleTask(sql, boardId, clock, input),
    reopen: (input) => reopenTask(sql, boardId, clock, input),
    cancel: (input) => cancelTask(sql, boardId, clock, input),

    // The log the swarm follows
    events: (query) => selectEvents(sql, boardId, clock, query),
  }
}`}</CodeBlock>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Contract</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>post</code>, <code>reply</code>
            </td>
            <td>
              Write a message and append <code>message.posted</code>. A reply attaches to the root
              of its thread. Fill <code>mentions</code> with <code>parseMentions(text)</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>label</code>
            </td>
            <td>
              Set and unset labels. With <code>if</code>, change nothing and reject with{' '}
              <code>label_conflict</code> unless every key holds the expected value. Keys under{' '}
              <code>board.</code> are yours alone.
            </td>
          </tr>
          <tr>
            <td>
              <code>messages</code>
            </td>
            <td>
              Oldest first. Without <code>after</code>, the latest <code>limit</code> matches. A
              channel filter ending in <code>/</code> selects the subtree. <code>id</code> selects
              one message.
            </td>
          </tr>
          <tr>
            <td>
              <code>createTask</code>
            </td>
            <td>
              Write the root message and the task, <code>ready</code> or <code>waiting</code> on its{' '}
              <code>needs</code>, and append one <code>task.created</code> carrying both. Keep the
              task state on the root message as the <code>board.task</code> label.
            </td>
          </tr>
          <tr>
            <td>
              <code>claim</code>
            </td>
            <td>
              With <code>task</code>, claim it or reject with <code>task_claimed</code>,{' '}
              <code>task_assigned</code>, <code>task_not_ready</code>, or <code>task_finished</code>
              . With <code>channel</code>, take the oldest ready task assigned to the caller, then
              the oldest unassigned one, or resolve to <code>null</code>. Raise <code>epoch</code>{' '}
              and issue a new token.
            </td>
          </tr>
          <tr>
            <td>
              <code>renew</code>, <code>settle</code>
            </td>
            <td>
              Accept only the current token of a claimed task. Anything else rejects with{' '}
              <code>claim_lost</code> and changes nothing. Completing a task readies its dependents.
            </td>
          </tr>
          <tr>
            <td>
              <code>reopen</code>, <code>cancel</code>
            </td>
            <td>
              Reopen a blocked or finished task to <code>ready</code> or <code>waiting</code>.
              Cancel ends any claim on the task.
            </td>
          </tr>
          <tr>
            <td>
              <code>events</code>
            </td>
            <td>
              A page of the log after a cursor, with <code>more</code> when the log continues. An
              empty page returns the cursor it was given. A cursor the current log did not issue
              rejects with <code>cursor_unknown</code>, never an empty page.
            </td>
          </tr>
        </tbody>
      </table>
      <p>The rules that hold across all of them:</p>
      <ul>
        <li>
          Every write appends to one ordered event log, in the order the writes took effect. Cursors
          are opaque strings. In SQL, write the row and its event in one transaction.
        </li>
        <li>
          A cursor from another board, from past the end of the log, or from before the log was
          reset is refused with <code>cursor_unknown</code>. A board whose log can start again
          should put a log id or epoch in its cursors, so an old cursor is not read as a position in
          the new log.
        </li>
        <li>
          <code>post</code>, <code>reply</code>, and <code>createTask</code> are idempotent on{' '}
          <code>key</code>. A repeated key returns the first message and writes nothing.
        </li>
        <li>
          A message returns the attachments it was written with, in order, and an empty list when it
          had none. More than 10 is refused with <code>invalid_input</code>.
        </li>
        <li>
          <code>messages({'{ id }'})</code> returns the one message with that id, whether it is a
          root or a reply.
        </li>
        <li>
          At most one claim holds a task. In SQL, make the claim a conditional update on the task
          row so two callers cannot both win.
        </li>
        <li>
          A task whose lease has passed is ready again, and the log gains a <code>task.ready</code>{' '}
          event no later than the next read of tasks or events. The memory board does this at the
          start of every call. A durable board can do the same or run a sweeper.
        </li>
        <li>
          Reject a request the board refuses with <code>BoardError</code> and a code. The swarm
          reports it to the calling agent and does not retry. Any other rejection is treated as a
          fault and retried.
        </li>
      </ul>
      <h2 id="check-your-board">
        Check your board
        <a className="heading-anchor" href="#check-your-board" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        <code>boardConformance</code> runs the contract against your implementation and returns one
        line per failure. It calls your factory for a fresh, empty board before each check, and for
        a second one where a check needs it; boards from separate calls must be separate logs. The
        board must read time from the clock it is given, because the suite advances that clock to
        expire leases.
      </p>
      <CodeBlock lang="ts">{`import { expect, test } from 'bun:test'

import { boardConformance } from '@swirls/looms/swarm'

test('the Postgres board keeps the board contract', async () => {
  const failures = await boardConformance((clock) =>
    createPostgresBoard(sql, crypto.randomUUID(), clock),
  )

  expect(failures).toEqual([])
})`}</CodeBlock>
      <p>
        <code>createMemoryBoard</code> is the reference implementation. Read it alongside the
        interface when you write your own, and use it in tests: see{' '}
        <Link to="/docs/testing">Testing</Link>.
      </p>
    </>
  )
}
