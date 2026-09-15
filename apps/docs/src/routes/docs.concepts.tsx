import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
import { FlowChain } from '../components/flow-chain'

export const Route = createFileRoute('/docs/concepts')({
  component: Concepts,
})

function Concepts() {
  return (
    <>
      <h1>Concepts &amp; Execution Model</h1>
      <p>
        Looms is an <strong>event-sourced execution runtime</strong> for durable, long-running
        agentic systems. A <strong>Run</strong> is the durability boundary. Inside it,{' '}
        <strong>Threads</strong> are the universal unit of computation — agents, DAG workflows, and
        custom kinds share the same tree. <strong>Events</strong> are immutable facts. Pure{' '}
        <strong>Reducers</strong> reconstruct state and request <strong>Effects</strong>, which
        cross into the outside world and return as new events.
      </p>
      <p>
        This page is the mental model. If you only remember one thing: progress lives in the log.
        Processes, workers, and UI caches are disposable.
      </p>

      <FlowChain steps={['Event', 'Pure Reducer', 'State + Effects', 'World', 'Event']} />

      <div className="border-line text-body [&_strong]:text-foreground my-8 border-l-2 py-1 pl-5 text-[0.95rem] leading-relaxed [&_strong]:font-semibold">
        <strong>Core Invariant:</strong> The only way logical runtime state changes is by processing
        an Event.
      </div>

      <p className="text-muted text-sm">
        Looking for the formal algebraic specifications and proofs? See{' '}
        <Link to="/docs/math">Math</Link>.
      </p>

      <h2>Core Vocabulary</h2>

      <div className="my-8 mb-14 grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-x-14">
        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>Run</h3>
          <p>
            The durability boundary and event-stream container for one logical operation. All child
            threads, signals, and events belong to one canonical log identified by{' '}
            <code>runId</code>.
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>Thread</h3>
          <p>
            The universal runtime unit of computation. Belongs to a Run, owns a state machine, has
            an optional parent thread, and has a specific thread kind.
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>Thread Kind</h3>
          <p>
            The behavioral specialization of a thread. Built-in kinds are <code>agent</code> and{' '}
            <code>workflow</code>; runtime modules can register arbitrary custom kinds.
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>State</h3>
          <p>
            Durable logical state reconstructed by folding events through reducers. State is a
            derived projection, not canonical storage.
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>Event</h3>
          <p>
            An immutable fact appended to the Run log. It describes something that already happened
            in the past (e.g. <code>approval.decided</code>, <code>payments.charge.authorized</code>
            ).
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>Signal</h3>
          <p>
            An externally originated Event injected into the stream (user messages, human approvals,
            webhooks) to steer, wake, pause, or resume parked threads.
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>Reducer</h3>
          <p>
            Pure, deterministic logic. Behavioral reducers map State + Event to next State +
            Effects. Projection reducers map State + Event to next State without effects.
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>Effect</h3>
          <p>
            A requested consequence or intent: an instruction to the host to interact with the
            outside world (call an LLM, charge a card, spawn a thread, or wait).
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>Projection</h3>
          <p>
            A derived read model folded from the event stream: reactive UI views (chat, ledgers,
            approvals), debugger timelines, and analytics indexes.
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>Thread Tree</h3>
          <p>
            The parent/child invocation hierarchy answering <em>&ldquo;Who spawned whom?&rdquo;</em>{' '}
            (e.g., Root Agent &rarr; Child Workflow &rarr; Sub-Agent).
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>Causation Graph</h3>
          <p>
            The event relationship answering <em>&ldquo;Why did this happen?&rdquo;</em>, tracked
            via <code>causationId</code> and <code>effectId</code> metadata.
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>Durable Wait</h3>
          <p>
            A parked condition where a thread consumes zero worker or CPU resources until a matching
            event, child completion, or timer arrives.
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>Replay</h3>
          <p>
            Reconstructing thread state or views by re-running pure reducers over historical events
            without re-executing nondeterministic effects.
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>Snapshot</h3>
          <p>
            A persisted projection checkpoint that accelerates state reconstruction for long event
            streams.
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>Runtime Module</h3>
          <p>
            A composable package contributing namespaced events, effect handlers, thread
            definitions, and projections (e.g. <code>@looms/agent</code>,{' '}
            <code>@looms/approval</code>, custom payment modules).
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>Projector</h3>
          <p>
            A background worker that observes the event stream to maintain persistent, cross-run
            queryable tables (SQLite, Postgres) or fan out to external systems.
          </p>
        </article>
      </div>

      <h2>The Event / Effect Boundary: Facts vs. Intent</h2>
      <p>
        A core architectural principle in Looms is the strict separation between what{' '}
        <em>has occurred</em> and what the runtime <em>should cause</em>:
      </p>

      <div className="my-8 grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-14">
        <div className="[&_h3]:text-foreground [&_p]:text-muted [&_ul]:text-body m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-2 [&_h3]:text-[1.05rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-3 [&_p]:text-[0.9rem] [&_p]:leading-snug [&_ul]:mb-0 [&_ul]:pl-[1.1rem] [&_ul]:text-[0.88rem] [&_ul]:leading-relaxed">
          <span className="text-muted mb-1.5 block text-[0.72rem] font-semibold tracking-widest uppercase">
            Event: Immutable Fact
          </span>
          <h3>Something already happened</h3>
          <p>Events are past-tense, durable records written to the log.</p>
          <ul>
            <li>
              <code>agent.turnStarted</code>
            </li>
            <li>
              <code>workflow.nodeCompleted</code>
            </li>
            <li>
              <code>approval.decided</code>
            </li>
            <li>
              <code>payments.charge.authorized</code>
            </li>
          </ul>
        </div>

        <div className="[&_h3]:text-foreground [&_p]:text-muted [&_ul]:text-body m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-2 [&_h3]:text-[1.05rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-3 [&_p]:text-[0.9rem] [&_p]:leading-snug [&_ul]:mb-0 [&_ul]:pl-[1.1rem] [&_ul]:text-[0.88rem] [&_ul]:leading-relaxed">
          <span className="text-muted mb-1.5 block text-[0.72rem] font-semibold tracking-widest uppercase">
            Effect: Requested Consequence
          </span>
          <h3>Something the runtime should cause</h3>
          <p>Effects are imperative intents returned by pure reducers.</p>
          <ul>
            <li>
              <code>invoke(&apos;llm.generate&apos;)</code>
            </li>
            <li>
              <code>spawn(&apos;specialist-agent&apos;)</code>
            </li>
            <li>
              <code>emit(&apos;payments.charge.requested&apos;)</code>
            </li>
            <li>
              <code>wait(&#123; on: &#123; type: &apos;approval.decided&apos; &#125; &#125;)</code>
            </li>
          </ul>
        </div>
      </div>

      <FlowChain steps={['Event', 'Reducer', 'State + Effects']} />
      <FlowChain steps={['Effect', 'World (IO)', 'Event']} />

      <p>
        This boundary is what guarantees <strong>safe replay and crash recovery</strong>. During
        replay or debugging, reducers re-run over historical events to reconstruct state, but the
        runtime skips effect dispatch. You never accidentally re-charge a customer or invoke an LLM
        when recovering from a crash.
      </p>

      <h2>The Three Orthogonal Structures</h2>
      <p>
        A Run coordinates heterogeneous computation by separating three distinct dimensions rather
        than tangling them into separate silos:
      </p>

      <div className="my-8 mb-14 grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-x-14">
        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>1. Thread Tree (Structure)</h3>
          <p>
            <strong>&ldquo;Who belongs to whom?&rdquo;</strong> The parent-child invocation
            hierarchy stored in thread metadata (e.g., an agent invoking a checkout workflow, which
            invokes a human approval gate).
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>2. Run Stream (History)</h3>
          <p>
            <strong>&ldquo;What happened?&rdquo;</strong> The single canonical, append-only
            chronological log of events across all threads in the run.
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>3. Causation Graph (Reason)</h3>
          <p>
            <strong>&ldquo;Why did it happen?&rdquo;</strong> The causal provenance graph linking
            each event to the effect and trigger event that produced it via <code>causationId</code>{' '}
            and <code>effectId</code>.
          </p>
        </article>
      </div>

      <p>
        Because structural hierarchy lives in event and thread metadata rather than separate storage
        files, arbitrary nesting (agents spawning workflows spawning agents) remains unified in one
        coherent timeline.
      </p>

      <h2>The Effect Instruction Set</h2>
      <p>
        Rather than introducing an unbounded set of ad-hoc primitives, all high-level module effects
        lower into a small runtime instruction set:
      </p>

      <div className="my-7 grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-x-14">
        <div className="[&_code]:text-foreground [&_p]:text-muted m-0 p-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[0.92rem] [&_code]:font-semibold [&_p]:mt-1.5 [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <code>Invoke</code>
          <p>
            Execute external computation with side-effects in reality (e.g., call an LLM API, fetch
            an HTTP endpoint, charge a credit card).
          </p>
        </div>

        <div className="[&_code]:text-foreground [&_p]:text-muted m-0 p-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[0.92rem] [&_code]:font-semibold [&_p]:mt-1.5 [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <code>Spawn</code>
          <p>
            Create and start a child Thread (an agent, a DAG workflow, or a custom thread kind)
            within the same Run.
          </p>
        </div>

        <div className="[&_code]:text-foreground [&_p]:text-muted m-0 p-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[0.92rem] [&_code]:font-semibold [&_p]:mt-1.5 [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <code>Emit</code>
          <p>Communicate outward by appending an event or signal to the Run stream.</p>
        </div>

        <div className="[&_code]:text-foreground [&_p]:text-muted m-0 p-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[0.92rem] [&_code]:font-semibold [&_p]:mt-1.5 [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <code>Wait</code>
          <p>
            Suspend thread execution until a matching event, payload pattern, child completion, or
            timer fires.
          </p>
        </div>
      </div>

      <CodeBlock lang="ts">{`// Domain effects compile down to the instruction set:
CallLLM(...)             → Invoke('ai.generate', ...)
DelegateToWorker(...)    → Spawn('researcher', ...)
RequestApproval(...)     → Emit('approval.requested', ...) + Wait('approval.decided')
SleepUntil(...)          → Wait('timer.fired')`}</CodeBlock>

      <h2>Durable Waiting &amp; Parking</h2>
      <p>
        In traditional runtimes, waiting for an approval, child job, or webhook ties up an in-memory
        process or call stack. In Looms:
      </p>
      <FlowChain
        steps={['WAITING', 'persist state to log', '0 compute / no worker held', 'matching event arrives', 'RUNNING']}
      />
      <p>
        When a thread registers a <code>Wait</code>, its state is checkpointed to the log and the
        host releases all worker resources. Days or weeks later, when someone approves the request
        or a webhook posts a signal, the runtime re-awakens the thread and resumes execution with
        complete state fidelity.
      </p>

      <h2>Mental Model: The React Analogy</h2>
      <p>
        A helpful mental model for Looms is to think of it as a declarative runtime for agentic
        execution, analogous to how React structures UI rendering:
      </p>

      <table>
        <thead>
          <tr>
            <th>React</th>
            <th>Looms</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Component</td>
            <td>
              <strong>Thread</strong> (Agent, Workflow, or Custom Kind)
            </td>
          </tr>
          <tr>
            <td>Props &amp; State</td>
            <td>
              <strong>Thread Input &amp; Derived State</strong>
            </td>
          </tr>
          <tr>
            <td>Render Function</td>
            <td>
              <strong>Pure Reducer / Transition Function</strong>
            </td>
          </tr>
          <tr>
            <td>
              Side Effects (<code>useEffect</code>)
            </td>
            <td>
              <strong>Runtime Effects</strong> (<code>ctx.effects</code>)
            </td>
          </tr>
          <tr>
            <td>Renderer (React DOM / Native)</td>
            <td>
              <strong>Runtime &amp; Adapters</strong> (Durable Objects, Bun SQLite, LiveStore)
            </td>
          </tr>
          <tr>
            <td>npm Ecosystem</td>
            <td>
              <strong>Runtime Modules</strong> (Agent, Workflow, Approval, Stripe)
            </td>
          </tr>
        </tbody>
      </table>

      <div className="border-line text-body [&_strong]:text-foreground my-8 border-l-2 py-1 pl-5 text-[0.95rem] leading-relaxed [&_strong]:font-semibold">
        <strong>The North Star:</strong> User code describes computation declaratively; the runtime
        controls durability, scheduling, recovery, and replay.
      </div>

      <h2>Projections &amp; Custom UIs</h2>
      <p>
        Because all facts exist in the append-only event stream, UIs do not need to poll ad-hoc CRUD
        endpoints or manage custom WebSocket protocols. Projections fold the event stream directly
        into reactive UI state in the browser via LiveStore and SSE.
      </p>
      <p>
        Learn how to build real-time reactive interfaces, ledgers, and time-travel debuggers in{' '}
        <Link to="/docs/projectors">Projectors &amp; Custom UIs</Link>.
      </p>

      <h2>Where the log lives</h2>
      <p>
        Durability is an actor-cell concern: one writer per <code>runId</code>, with embedded SQLite
        on Cloudflare Durable Objects (recommended), celld, or local Bun. Committed events can also
        stream downstream to databases or data lakes. Learn how in{' '}
        <Link to="/docs/durability">Durability &amp; Hosting</Link>.
      </p>

      <h2>Next steps</h2>
      <p>
        Explore hosting in <Link to="/docs/durability">Durability</Link>, composable packages in{' '}
        <Link to="/docs/modules">Modules</Link>, algebraic foundations in{' '}
        <Link to="/docs/math">Math</Link>, custom reactive interfaces in{' '}
        <Link to="/docs/projectors">Projectors</Link>, or follow the{' '}
        <Link to="/docs/quickstart">Quickstart</Link> to spin up a host.
      </p>
    </>
  )
}
