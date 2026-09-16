import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
import { ConceptFigure } from '../illustrations/illustration'
import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/concepts/runs-and-threads')({
  head: () => pageHead('/docs/concepts/runs-and-threads'),
  component: RunsAndThreads,
})

function RunsAndThreads() {
  return (
    <>
      <h1>Runs &amp; threads</h1>
      <p>
        A <strong>run</strong> is what you start, list, and open in a debugger. Inside it,{' '}
        <strong>threads</strong> form a tree: a root agent or workflow, plus any children it
        spawned. Agents, DAG workflows, and custom kinds share the same model; nesting is normal.
      </p>

      <ConceptFigure name="threads" />

      <h2 id="run">
        Run
        <a className="heading-anchor" href="#run" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        The durability boundary and event-stream container for one logical operation. All child
        threads, signals, and events belong to one canonical log identified by <code>runId</code>.
        Crash recovery means replaying that log.
      </p>

      <h2 id="thread">
        Thread
        <a className="heading-anchor" href="#thread" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        The unit of computation inside a run. A thread owns a state machine, may have a parent, and
        has a <strong>thread kind</strong>: built-in <code>agent</code> / <code>workflow</code>, or
        a custom kind from a module.
      </p>
      <p>
        Definitions live on modules (<code>defineAgent</code>, <code>defineWorkflow</code>, or your
        own). You start work with <code>looms.start(definition, input)</code>; the runtime creates
        the root thread and begins appending events.
      </p>

      <h2 id="custom-thread-kinds">
        Custom thread kinds
        <a className="heading-anchor" href="#custom-thread-kinds" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        A custom kind is a module that registers a thread definition and implements{' '}
        <code>m.thread</code>. The definition is what you pass to <code>start</code>; the thread is
        the state machine that handles events for that kind:
      </p>
      <CodeBlock lang="ts">{`import { z } from 'zod'
import { defineEventCatalog, defineModule, type DefinitionRef } from '@swirls/looms/core'

const AuctionInput = z.object({
  item: z.string(),
  reservePrice: z.number(),
})

const auctionCatalog = defineEventCatalog('auction', {
  bid: z.object({ bidder: z.string(), amount: z.number() }),
  close: z.object({ reason: z.string().optional() }),
})

const vintageWatch = {
  kind: 'auction' as const,
  name: 'vintage-watch',
  input: AuctionInput,
} satisfies DefinitionRef

const auctionModule = defineModule(
  { namespace: 'auction', protocolVersion: '1.0.0', events: auctionCatalog },
  (m) => ({
    definitions: [vintageWatch],
    threads: {
      auction: m.thread({
        kind: 'auction',
        input: AuctionInput,
        initialState: (ctx) => ({
          item: ctx.input.item,
          reservePrice: ctx.input.reservePrice,
          highestBid: 0,
          status: 'open' as const,
        }),
        step(state, event) {
          switch (event.type) {
            case 'auction.bid':
              return event.payload.amount > state.highestBid
                ? { ...state, highestBid: event.payload.amount }
                : state
            case 'auction.close':
              return { ...state, status: 'closed' as const }
            default:
              return state
          }
        },
      }),
    },
  }),
)`}</CodeBlock>
      <p>
        Start the definition on a host that includes the module. The input type follows the
        definition&apos;s schema:
      </p>
      <CodeBlock lang="ts">{`import { createLooms } from '@swirls/looms/runtime'

const looms = createLooms({ modules: [auctionModule] })

const { runId } = await looms.start(vintageWatch, {
  item: '1968 Chronograph',
  reservePrice: 250,
})`}</CodeBlock>
      <p>
        Wait handling, signaling, and a bids projection live in{' '}
        <code>examples/custom-thread.ts</code> (
        <code>bun run --filter @looms/examples custom-thread</code>).
      </p>

      <h2 id="status">
        Status
        <a className="heading-anchor" href="#status" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>A run (and each thread) is in one of:</p>
      <ul>
        <li>
          <code>running</code> — actively reducing or dispatching effects
        </li>
        <li>
          <code>waiting</code> — parked on a timer, approval, child completion, or matching event
        </li>
        <li>
          Terminal: <code>completed</code>, <code>failed</code>, or <code>cancelled</code>
        </li>
      </ul>

      <h2 id="three-orthogonal-structures">
        Three orthogonal structures
        <a
          className="heading-anchor"
          href="#three-orthogonal-structures"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        A run coordinates heterogeneous work by keeping structure, history, and causation separate:
      </p>

      <div className="my-8 mb-14 grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-x-14">
        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3 id="thread-tree">
            Thread tree
            <a className="heading-anchor" href="#thread-tree" aria-label="Link to this section">
              #
            </a>
          </h3>
          <p>
            Parent/child invocation hierarchy (agent &rarr; checkout workflow &rarr; approval gate).
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3 id="run-stream">
            Run stream
            <a className="heading-anchor" href="#run-stream" aria-label="Link to this section">
              #
            </a>
          </h3>
          <p>One append-only chronological log across all threads in the run.</p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3 id="causation-graph">
            Causation graph
            <a className="heading-anchor" href="#causation-graph" aria-label="Link to this section">
              #
            </a>
          </h3>
          <p>
            Provenance via <code>causationId</code> and <code>effectId</code> linking events to the
            effects that produced them.
          </p>
        </article>
      </div>

      <p>
        Hierarchy lives in metadata on the same log, so arbitrary nesting stays on one coherent
        timeline. Formal treatment: <Link to="/docs/math">Math</Link>. Next:{' '}
        <Link to="/docs/concepts/events-and-effects">Events &amp; effects</Link>.
      </p>
    </>
  )
}
