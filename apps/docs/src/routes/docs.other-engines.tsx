import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/other-engines')({
  head: () => pageHead('/docs/other-engines'),
  component: OtherEngines,
})

function OtherEngines() {
  return (
    <>
      <h1>Other engines</h1>
      <p>
        Durable execution engines agree on the job. A piece of work should survive a process crash
        and a wait that lasts days. They disagree on what you write. Temporal and most of the
        engines below ask for a function, and they keep a journal so that function can resume. Looms
        asks for an event catalog and pure reducers, and derives state from the log.
      </p>
      <p>
        The comparison is the programming model. Pricing, retry defaults, and hosted limits move.
        Follow the links for the current product.
      </p>

      <h2 id="why-the-constraints">
        Why the constraints
        <a className="heading-anchor" href="#why-the-constraints" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        For a long time, building a UI meant imperatively updating the DOM. jQuery made the updates
        shorter. Two event handlers could still edit the same nodes and disagree about what the
        screen was.
      </p>
      <p>
        React added a constraint. The UI is a function of state. You describe the screen, and the
        library updates the DOM. That is less free than reaching into a node and patching it, and
        large UIs got easier to change. Flux and Redux added a second constraint. State is
        immutable. The next state is a pure function of the previous state and an action. The action
        log is the source, and the screen is a view of the fold.
      </p>
      <p>
        Looms is that shape for work that has to outlive the process. You name the facts that can
        happen, and a reducer folds them into state. The runtime schedules effects, waits, and
        recovery. A replayed function keeps that procedure in local variables.
      </p>

      <h2 id="two-records">
        Two records
        <a className="heading-anchor" href="#two-records" aria-label="Link to this section">
          #
        </a>
      </h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Journaled function</th>
            <th>Looms</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>What you author</td>
            <td>A function. Side effects live in steps or activities.</td>
            <td>An event catalog, reducers, and effect handlers.</td>
          </tr>
          <tr>
            <td>What the log holds</td>
            <td>An execution trace: this step was scheduled, this step returned.</td>
            <td>Domain events you named.</td>
          </tr>
          <tr>
            <td>Where state lives</td>
            <td>Local variables, rebuilt by re-running the function against the journal.</td>
            <td>A fold of the log. Snapshots checkpoint that fold.</td>
          </tr>
          <tr>
            <td>Determinism rule</td>
            <td>The function must schedule the same steps, in the same order, on every replay.</td>
            <td>
              The reducer must be pure. Clocks, random ids, and HTTP belong in an effect handler,
              and they come back as events.
            </td>
          </tr>
          <tr>
            <td>A live run after a code change</td>
            <td>Patch the function, pin the worker, or drain the old deployment.</td>
            <td>
              Keep the definition version the run started with, and evolve event payloads
              additively.
            </td>
          </tr>
          <tr>
            <td>A UI of the same work</td>
            <td>A query into workflow state, or a read model you write from inside a step.</td>
            <td>A projection over the same log, including in the browser.</td>
          </tr>
        </tbody>
      </table>

      <h2 id="journaled-functions">
        Journaled functions
        <a className="heading-anchor" href="#journaled-functions" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        <a href="https://temporal.io/" target="_blank" rel="noreferrer">
          Temporal
        </a>{' '}
        is the reference implementation of this model, and a fork of Uber&apos;s Cadence. Azure
        Durable Functions and Dapr Workflows use the same cut: an orchestrator function replays, and
        activities do the I/O. You write something that looks like ordinary async code.
      </p>
      <CodeBlock lang="ts">{`// Temporal TypeScript, abbreviated. Timeouts and retries omitted.
import { condition, defineSignal, proxyActivities, setHandler } from '@temporalio/workflow'

import type * as activities from './activities'

const { charge } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
})

export const decided = defineSignal<[{ decision: 'approved' | 'rejected' }]>('decided')

export async function checkout(order: { amount: number }): Promise<void> {
  let decision: 'approved' | 'rejected' | undefined
  setHandler(decided, (input) => {
    decision = input.decision
  })
  await condition(() => decision !== undefined)
  if (decision === 'approved') {
    await charge(order)
  }
}`}</CodeBlock>
      <p>
        <code>decision</code> is a local variable. <code>charge</code> is an activity. Temporal
        records a{' '}
        <a
          href="https://docs.temporal.io/workflow-execution/event"
          target="_blank"
          rel="noreferrer"
        >
          history of commands
        </a>
        : workflow started, signal received, activity scheduled, activity completed. The Web UI
        shows that history. The event types belong to Temporal. The fact that a card was charged
        sits inside an activity result, or in a workflow variable you remember to set.
      </p>
      <p>
        Recovery re-executes <code>checkout</code> from the top. Completed activities return their
        recorded results and do not run again. A <code>Date.now()</code> or a branch that was not
        there when the history was written makes the commands diverge from the history, and the
        workflow task fails until the code matches. Temporal&apos;s answers are{' '}
        <a href="https://docs.temporal.io/patching" target="_blank" rel="noreferrer">
          <code>patched()</code>
        </a>{' '}
        and worker versioning: a pinned workflow stays on the worker version that started it, and an
        auto-upgrade workflow has to stay replay-safe. Long histories are your problem too.
        Continue-as-new starts a fresh run and you pass along whatever state the next run needs.
      </p>
      <p>
        Loops, <code>Promise.all</code>, try/catch, and a signal handler are ordinary code. Teams
        pick Temporal when a procedure waits on humans and crosses services, and when they want
        multi-language workers, a visibility store, and Temporal Cloud. The history is an
        operational log. A ledger or a chat transcript is a second model you write beside it.
      </p>

      <h2 id="the-same-family">
        The same family
        <a className="heading-anchor" href="#the-same-family" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Several engines keep the function, and change where the journal lives or how the function is
        re-entered.
      </p>
      <p>
        <a href="https://restate.dev/" target="_blank" rel="noreferrer">
          Restate
        </a>{' '}
        journals each handler invocation. <code>ctx.run</code> records a step result,{' '}
        <code>ctx.sleep</code> and awakeables are durable waits, and a crash replays the handler
        until it passes the end of the journal. Virtual objects add the piece Temporal makes you
        build: an addressable key, durable key-value state, and exclusive handlers that queue per
        key. A cart or a session is an object you call. On Temporal, the same shape is a workflow
        you keep alive with signals and continue-as-new. Restate stores that state as key-value.
        Each invocation has its own journal of step results. Deployments are immutable: new code is
        a new endpoint, and in-flight invocations finish where they started, so a handler that runs
        for days holds an old deployment open. The server is Business Source License; the SDKs are
        MIT.
      </p>
      <p>
        <a href="https://docs.dbos.dev/architecture" target="_blank" rel="noreferrer">
          DBOS
        </a>{' '}
        is a library in your process. Workflow inputs and step outputs are checkpointed to Postgres,
        and recovery re-runs the workflow function, returning checkpointed step results. The
        function has the same determinism rule as a Temporal workflow. Steps are at-least-once: a
        crash after the side effect and before the checkpoint runs the step again. A datasource
        transaction can commit your own database write and the durability record in one Postgres
        transaction, which is a stronger guarantee than a step, and stronger than Looms claims for
        an effect. By default DBOS hashes the workflow source into an application version and
        recovers only workflows of that version, so a drive-by edit leaves the previous
        version&apos;s pending work waiting for a process that still has it. Pin the version and
        patch, or drain old processes. The library is MIT. Conductor, the control plane, is
        proprietary.
      </p>
      <p>
        <a href="https://www.inngest.com/" target="_blank" rel="noreferrer">
          Inngest
        </a>{' '}
        memoizes steps. It calls your existing HTTP app.{' '}
        <code>step.run(&quot;charge&quot;, ...)</code> stores its result under that id, and a later
        attempt gets the stored result. Code outside a step runs again on every attempt, so an
        unwrapped model call can bill you once per step and disagree with a later memoized step.
        Rename the step id and in-flight runs miss the memo and execute it again.{' '}
        <a href="https://trigger.dev/" target="_blank" rel="noreferrer">
          Trigger.dev
        </a>{' '}
        checkpoints tasks in a similar way. Its server is Apache-2.0, and self-hosting it means
        running more than the library.{' '}
        <a href="https://docs.hatchet.run/" target="_blank" rel="noreferrer">
          Hatchet
        </a>{' '}
        is a task runtime: workers pull durable tasks, and workflows checkpoint those tasks. It is
        MIT and Postgres-backed.
      </p>
      <p>
        <a href="https://developers.cloudflare.com/workflows/" target="_blank" rel="noreferrer">
          Cloudflare Workflows
        </a>{' '}
        and{' '}
        <a href="https://vercel.com/docs/workflows" target="_blank" rel="noreferrer">
          Vercel Workflow
        </a>{' '}
        are platform step journals. Looms&apos; production host is also Cloudflare. A Looms run on a
        Durable Object keeps a domain log. These two keep step results. Cloudflare&apos;s{' '}
        <code>step.do(name, fn)</code> persists the callback&apos;s return value. The{' '}
        <code>run</code> method is re-entered after hibernation, cached steps return stored results,
        and{' '}
        <a
          href="https://developers.cloudflare.com/workflows/build/rules-of-workflows/"
          target="_blank"
          rel="noreferrer"
        >
          state outside a step is gone
        </a>
        . The step name is the identity. Vercel&apos;s <code>&quot;use workflow&quot;</code> and{' '}
        <code>&quot;use step&quot;</code> directives split the same way, with the workflow function
        replayed in a sandbox that stabilizes <code>Date</code> and <code>Math.random</code>. Steps
        get a normal Node runtime. Vercel documents skew protection so a run stays on a deployment
        compatible with its journal.
      </p>
      <p>
        <a href="https://www.resonatehq.io/" target="_blank" rel="noreferrer">
          Resonate
        </a>{' '}
        makes the durable promise the primitive. An async function suspends on a promise that
        outlives the process, and the log is promise completions.
      </p>

      <h2 id="declared-graphs">
        Declared graphs
        <a className="heading-anchor" href="#declared-graphs" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        <a href="https://aws.amazon.com/step-functions/" target="_blank" rel="noreferrer">
          AWS Step Functions
        </a>{' '}
        and Netflix Conductor (Orkes) make the program a declared graph: states and transitions, or
        a JSON workflow and task workers. Operators can run that graph without the application
        source open. The history records states entered and exited. The state document is JSON the
        states assign into. A product UI still needs its own read model. Airflow and Argo Workflows
        schedule tasks, usually data jobs or Kubernetes pods. A retry re-runs the task. Their record
        is task status.
      </p>

      <h2 id="checkpointed-graphs">
        Checkpointed graphs
        <a className="heading-anchor" href="#checkpointed-graphs" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        <a
          href="https://docs.langchain.com/oss/python/langgraph/overview"
          target="_blank"
          rel="noreferrer"
        >
          LangGraph
        </a>{' '}
        is the usual library when the work is an agent. You draw a graph of nodes over a typed state
        object. Channel reducers merge node writes. A{' '}
        <a
          href="https://docs.langchain.com/oss/python/langgraph/checkpointers"
          target="_blank"
          rel="noreferrer"
        >
          checkpointer
        </a>{' '}
        stores a snapshot at each super-step, and you can resume, interrupt for a human, or branch
        from an earlier checkpoint.
      </p>
      <p>
        The checkpoint is a snapshot of the graph state object. Resume re-invokes the graph from
        that snapshot. Side effects inside a node can run again, so idempotency stays your job. Time
        travel re-executes nodes after the chosen checkpoint, which re-issues model calls. LangSmith
        Deployment is a hosted runtime around the graph. The open-source library leaves a dead
        process until something calls <code>invoke</code> again. Looms&apos; historical replay folds
        events and skips effect dispatch.
      </p>

      <h2 id="what-looms-inverts">
        What Looms inverts
        <a className="heading-anchor" href="#what-looms-inverts" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        A Looms run has one append-only log. You define the events in a catalog (
        <code>approval.decided</code>, <code>payments.charge.authorized</code>). A thread reducer is
        a pure function from state and event to next state. An effects function reads that state and
        returns instructions: <code>invoke</code>, <code>spawn</code>, <code>emit</code>,{' '}
        <code>wait</code>. The host performs the I/O and appends the resulting events. Projections
        fold the same log into a transcript, a ledger, or a pending-approval badge, on the server
        and in the browser. The <Link to="/docs/math">execution model</Link> writes this as{' '}
        <code>(state, event) → (state, effects)</code>.{' '}
        <Link to="/docs/concepts/events-and-effects">Events &amp; effects</Link> is the programming
        guide.
      </p>
      <p>
        Agents and DAG workflows are thread kinds on that log. You can ship a{' '}
        <code>defineAgent</code> or <code>defineWorkflow</code> and never write a reducer. The
        workflow module still records <code>workflow.node.finished</code> and folds it. Scheduling
        is the reducer. A node function runs when an effect says it should, and its outcome comes
        back as an event. Recovery folds the log through that reducer. A node whose finish event is
        already stored stays unrun. An effect whose outcome was not stored yet can run again.
      </p>
      <p>The same checkout, abbreviated. A Temporal history is an execution trace:</p>
      <CodeBlock lang="text">{`WorkflowExecutionStarted
WorkflowExecutionSignaled   decided { "decision": "approved" }
ActivityTaskScheduled       charge
ActivityTaskCompleted       { "chargeId": "ch_123", "amount": 40 }
WorkflowExecutionCompleted`}</CodeBlock>
      <p>A Looms log is the facts the application named:</p>
      <CodeBlock lang="text">{`approval.requested
approval.decided                 { "decision": "approved" }
payments.charge.requested        { "chargeId": "ch_123", "amount": 40 }
payments.charge.authorized       { "chargeId": "ch_123", "amount": 40 }`}</CodeBlock>
      <p>
        The thread sees <code>approval.decided</code> and requests the charge effect. The handler
        appends <code>payments.charge.authorized</code>. A ledger projection is a reducer over those
        events. The debugger&apos;s <code>replayTo</code> is the same fold, stopped at a sequence
        number, skipping the card network. XState is the nearest statechart cousin. You can persist
        a snapshot of a machine, and you bring the host, the waits, and recovery. Event-sourcing
        libraries give you the log and the fold, and you build the process manager. Looms is that
        manager, with the fold as the transition function.
      </p>

      <h2 id="what-you-give-up">
        What you give up
        <a className="heading-anchor" href="#what-you-give-up" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        A straight-line integration is less code as a journaled function. Fetch, sleep, charge,
        email: Temporal, Inngest, DBOS, Cloudflare Workflows, and Vercel Workflow let that be a
        function with steps. In Looms it is events, a reducer, and effect handlers, or a DAG whose
        nodes emit those events. Arbitrary control flow inside one function is what you give up.
      </p>
      <p>
        Looms is TypeScript. Temporal, Restate, DBOS, and Inngest ship several language SDKs. You
        run the host. Cloudflare Durable Objects is the production path, and Bun with SQLite is the
        local one. Looms has no control plane, visibility query language, or multi-region workflow
        service. The library is 0.0.x. The engines above have production histories Looms does not.
      </p>
      <p>
        External effects are at-least-once when the process dies after the call and before the
        outcome event is stored. Idempotency keys and reconciliation stay your job. That is the same
        gap as a Temporal activity or a DBOS step. DBOS can close it for writes to a database it
        commits with. Looms has that gap.
      </p>
      <p>
        A run records the definition version it started, and the host has to keep that
        implementation registered. Old payloads have to keep folding. Prefer optional fields or a
        new event name, and do not rewrite history so a new reducer will accept it. The migration is
        the event payloads and the reducers. On Temporal, the migration is the function&apos;s
        control flow. See <Link to="/docs/versioning">Changing deployed code</Link>.
      </p>

      <h2 id="what-the-constraints-buy">
        What the constraints buy
        <a
          className="heading-anchor"
          href="#what-the-constraints-buy"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        A control-flow bug is a reducer case. Give it a list of events and assert the next state and
        the effects it requests. You do not need a worker, and you do not need the function to take
        the same path it took last Tuesday.
      </p>
      <p>
        An effect handler reads the clock and the network. The event it appends is what every later
        fold sees. The rule you can test is that the reducer is pure. Temporal&apos;s rule is that
        the async function must schedule the same steps on every replay.
      </p>
      <p>
        <code>useProjection</code> runs the same fold in the browser. An agent, a review workflow,
        and a custom auction are threads on one log, so one debugger shows the whole operation. A
        fact you did not put in the catalog cannot sneak into state through a local variable. Two
        parts of the system agree that the card was charged when both of them have folded{' '}
        <code>payments.charge.authorized</code>.
      </p>

      <h2 id="choosing">
        Choosing
        <a className="heading-anchor" href="#choosing" aria-label="Link to this section">
          #
        </a>
      </h2>
      <ul>
        <li>
          Temporal, Azure Durable Functions, or Dapr Workflows, when the work is a long-lived
          procedure, you want several languages or a managed control plane, and the history is an
          operational concern.
        </li>
        <li>
          Restate, when you want durable RPC and per-key objects, and stored key-value state is
          enough.
        </li>
        <li>
          DBOS, when Postgres is already the system of record and you want checkpoints and
          transactional writes in-process.
        </li>
        <li>
          Inngest, Trigger.dev, Hatchet, Cloudflare Workflows, or Vercel Workflow, when you want to
          wrap steps around an app you already deploy and a step-result log is enough.
        </li>
        <li>
          Step Functions or Conductor, when the workflow has to be a declared graph operated outside
          the application process.
        </li>
        <li>
          LangGraph, when the artifact is an agent graph and a checkpointed state object, and you
          will supply the supervisor and the product read models.
        </li>
        <li>
          Looms, when execution, audit, and UI should be folds of one history, and the domain is a
          state machine fed by events over time: approvals, messages, bids, webhooks. The
          alternative is an event-sourced process manager and a workflow engine.
        </li>
      </ul>
      <p>
        <Link to="/docs/prior-art">Prior art</Link> covers the lineage: event sourcing, Flux and
        Redux, actors, and React. <Link to="/docs/when-to-use">When to use Looms</Link> covers fit,
        hosting, and the costs you take on. <Link to="/docs/reliability">Reliability</Link> covers
        retries, idempotency, and snapshots.
      </p>
    </>
  )
}
