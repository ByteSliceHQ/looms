import { ClientOnly, createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
import { FlowChain } from '../components/flow-chain'
import { LandingDebugger, LandingDebuggerFallback } from '../components/landing-debugger'
import { Illustration } from '../illustrations/illustration'
import { docsNav } from '../nav'

export const Route = createFileRoute('/')({
  component: Landing,
})

function Landing() {
  return (
    <div className="mx-auto max-w-[68rem] px-5 py-14 pb-12 md:px-8 md:pt-24 md:pb-20">
      {/* Hero: one composition — brand, pitch, CTA, live run */}
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-foreground mt-0 mb-5 text-[2.4rem] leading-none font-semibold tracking-tighter md:text-5xl">
            Looms
          </p>
          <h2 className="text-body mt-0 mb-4 text-[1.35rem] leading-snug font-normal">
            Durable agents, workflows, and human approvals — composed like packages.
          </h2>
          <p className="text-muted mb-6 leading-relaxed">
            Each run is an append-only event log. Restart the host, replay history, park for a human
            decision, then resume — without reinventing durability for every agent or DAG.
          </p>

          <FlowChain steps={['Event', 'Reducer', 'State + Effects', 'World', 'Event']} />

          <div className="my-6 flex flex-wrap items-center gap-3">
            <Link
              to="/docs"
              className="bg-foreground text-background inline-block rounded-[5px] px-[1.1rem] py-[0.55rem] text-sm font-medium no-underline transition-colors hover:bg-neutral-700 hover:no-underline dark:hover:bg-slate-300"
            >
              Read the docs
            </Link>
            <Link
              to="/docs/quickstart"
              className="text-muted hover:text-foreground text-sm no-underline"
            >
              Quickstart &rarr;
            </Link>
          </div>
        </div>

        <ClientOnly fallback={<LandingDebuggerFallback />}>
          <LandingDebugger />
        </ClientOnly>
      </div>

      {/* Story: durable execution */}
      <section className="border-line-subtle mt-20 border-t pt-14 md:mt-28 md:pt-20">
        <p className="text-muted mb-3 text-[0.72rem] font-semibold tracking-widest uppercase">
          Durable execution
        </p>
        <h2 className="text-foreground mt-0 mb-4 text-[1.5rem] leading-snug font-semibold tracking-tight md:text-[1.75rem]">
          Progress is the log — not the process.
        </h2>
        <p className="text-body mb-0 max-w-[40rem] leading-relaxed">
          When an agent runs multi-step tool calls, a workflow sleeps for days, or a human approval
          pauses execution, relying on server memory breaks down. Deployments restart workers,
          retries trigger duplicate charges, and client state drifts from reality. Looms replaces
          brittle process memory with an append-only event log: pure reducers transition state,
          while side-effects execute in the world and append back as new facts. Replaying history
          never re-runs external IO. In production, each run executes in an isolated actor cell with
          dedicated local storage.
        </p>

        <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-12">
          <div>
            <Illustration name="log" className="mb-5 h-auto w-full" />
            <h3 className="text-foreground mt-0 mb-2 text-[0.95rem] font-semibold tracking-tight">
              Runs
            </h3>
            <p className="text-muted mb-0 text-[0.9rem] leading-snug">
              One durability boundary. Every child thread, signal, and effect outcome appends to the
              same canonical stream.
            </p>
          </div>
          <div>
            <Illustration name="threads" className="mb-5 h-auto w-full" />
            <h3 className="text-foreground mt-0 mb-2 text-[0.95rem] font-semibold tracking-tight">
              Threads
            </h3>
            <p className="text-muted mb-0 text-[0.9rem] leading-snug">
              Agents, DAG workflows, and custom kinds share one unit of computation — nest freely
              without separate runtimes.
            </p>
          </div>
          <div>
            <Illustration name="wait" className="mb-5 h-auto w-full" />
            <h3 className="text-foreground mt-0 mb-2 text-[0.95rem] font-semibold tracking-tight">
              Waits
            </h3>
            <p className="text-muted mb-0 text-[0.9rem] leading-snug">
              Park until an approval, webhook, or timer. Zero worker held. Resume with full state
              fidelity days later.
            </p>
          </div>
        </div>

        <FlowChain
          className="mt-10"
          steps={['WAITING', 'persist', '0 compute', 'matching event', 'RUNNING']}
        />
      </section>

      {/* Story: packages */}
      <section className="border-line-subtle mt-16 border-t pt-14 md:mt-24 md:pt-20">
        <p className="text-muted mb-3 text-[0.72rem] font-semibold tracking-widest uppercase">
          Composable packages
        </p>
        <h2 className="text-foreground mt-0 mb-4 text-[1.5rem] leading-snug font-semibold tracking-tight md:text-[1.75rem]">
          Capabilities install like modules — including yours.
        </h2>
        <p className="text-body mb-0 max-w-[40rem] leading-relaxed">
          The kernel does not know what an agent or a payment is. Modules contribute namespaced
          events, effects, thread kinds, and projections. Ship only what the app needs; compose
          first-party packages with domain modules without forking the runtime.
        </p>

        <CodeBlock lang="ts">{`import { agent } from '@looms/agent'
import { approval } from '@looms/approval'
import { workflow } from '@looms/workflow'
import { createLooms } from '@looms/runtime'
import { payments } from './modules/payments'

export const looms = createLooms({
  definitions: [assistant, checkout],
  modules: [agent({ llm }), workflow(), approval(), payments()],
})

await looms.start(assistant, 'Charge $40 after approval')
await looms.start(checkout, { amount: 150, currency: 'USD' })`}</CodeBlock>

        <p className="text-muted mb-0 max-w-[40rem] text-[0.9rem] leading-relaxed">
          An agent can spawn that checkout workflow as a tool. The workflow can <code>gate()</code>{' '}
          for a human, then <code>invoke(&apos;payments.charge&apos;)</code>. Same run. Same log.
          See <Link to="/docs/modules">Modules</Link>.
        </p>
      </section>

      {/* Story: projectors */}
      <section className="border-line-subtle mt-16 border-t pt-14 md:mt-24 md:pt-20">
        <p className="text-muted mb-3 text-[0.72rem] font-semibold tracking-widest uppercase">
          Projections &amp; projectors
        </p>
        <h2 className="text-foreground mt-0 mb-4 text-[1.5rem] leading-snug font-semibold tracking-tight md:text-[1.75rem]">
          Close the gap between execution and UI.
        </h2>
        <p className="text-body mb-0 max-w-[40rem] leading-relaxed">
          Traditional stacks invent REST, websockets, and cache invalidation for every agent surface
          — then watch the UI drift from the worker. In Looms, read models are pure folds over the
          same events. Chat, debuggers, ledgers, and approval badges share one stream; projectors
          materialize cross-run indexes in SQLite or Postgres.
        </p>

        <FlowChain
          className="mt-8"
          steps={['Run stream', 'Pure fold', 'UI projections', 'DB projectors']}
        />

        <CodeBlock lang="tsx">{`import { useRunStore, useProjection } from '@looms/react'
import { conversation, userMessage } from '@looms/agent'
import { pendingApprovals, decision } from '@looms/approval'
import { ledger } from './modules/payments'

function RunView({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const convo = useProjection(store, conversation)
  const approvals = useProjection(store, pendingApprovals)
  const charges = useProjection(store, ledger)

  return (
    <>
      {convo.lines.map((m, i) => (
        <p key={i}>{m.role}: {m.content}</p>
      ))}
      {approvals.items.map((a) => (
        <button key={a.approvalId} onClick={() => store.commit(decision(a.approvalId, 'approve'))}>
          {a.title}
        </button>
      ))}
    </>
  )
}`}</CodeBlock>

        <p className="text-muted mb-0 max-w-[40rem] text-[0.9rem] leading-relaxed">
          The same projection reducers run on the host and in the browser. Time-travel is folding a
          prefix of the log — no special backend. Deep dive:{' '}
          <Link to="/docs/projectors">Projections &amp; Projectors</Link>.
        </p>
      </section>

      {/* Close */}
      <section className="border-line-subtle mt-16 border-t pt-14 md:mt-24 md:pt-20">
        <h2 className="text-foreground mt-0 mb-4 text-[1.5rem] leading-snug font-semibold tracking-tight md:text-[1.75rem]">
          Built on a small, inspectable kernel.
        </h2>
        <p className="text-body mb-8 max-w-[40rem] leading-relaxed">
          Clear boundaries between facts and intent. Pure state transitions. Isolated actor cells on
          Cloudflare Durable Objects, celld, or local SQLite. Stream replication for downstream data
          lakes. Grounded in mathematical formalism and backed by open-source code you can inspect.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/docs"
            className="bg-foreground text-background inline-block rounded-[5px] px-[1.1rem] py-[0.55rem] text-sm font-medium no-underline transition-colors hover:bg-neutral-700 hover:no-underline dark:hover:bg-slate-300"
          >
            Start with the introduction
          </Link>
          <Link
            to="/docs/durability"
            className="text-muted hover:text-foreground text-sm no-underline"
          >
            Durability &rarr;
          </Link>
          <Link
            to="/docs/concepts"
            className="text-muted hover:text-foreground text-sm no-underline"
          >
            Concepts &rarr;
          </Link>
          <Link to="/docs/math" className="text-muted hover:text-foreground text-sm no-underline">
            Math &rarr;
          </Link>
        </div>

        <ul className="mt-12 mb-0 flex list-none flex-wrap gap-x-7 gap-y-5 p-0">
          {docsNav.map((item) => (
            <li key={item.to} className="m-0">
              <Link to={item.to} className="text-muted hover:text-foreground text-sm no-underline">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
