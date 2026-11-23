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
        <code>m.thread</code>. Stamp the startable definition with <code>createKind</code> (the same
        shape <code>defineAgent</code> and <code>defineWorkflow</code> already produce). The
        definition is what you pass to <code>start</code>; the thread is the state machine that
        handles events for that kind:
      </p>
      <CodeBlock lang="ts">{`import { z } from 'zod'
import { createKind, defineEventCatalog, defineModule } from '@swirls/looms/core'

const AuctionInput = z.object({
  item: z.string(),
  reservePrice: z.number(),
})

const auctionCatalog = defineEventCatalog('auction', {
  bid: z.object({ bidder: z.string(), amount: z.number() }),
  close: z.object({ reason: z.string().optional() }),
})

const auction = createKind('auction')
const vintageWatch = auction.define({
  name: 'vintage-watch',
  input: AuctionInput,
})

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

      <h2 id="ids">
        Ids
        <a className="heading-anchor" href="#ids" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Runs, threads, events, and waits are named by an <strong>id format</strong>. The default is{' '}
        <a href="https://github.com/jetify-com/typeid">TypeID</a>: a prefix, an underscore, and 26
        characters that encode a UUID.
      </p>
      <ul>
        <li>
          <code>run_01k7z3m2v8f4xtq9c0e5hn6b1d</code> for a run, <code>thr_</code> for a thread,{' '}
          <code>evt_</code> for an event, <code>wait_</code> for a wait
        </li>
        <li>
          Ids Looms draws carry a UUIDv7, so they sort by creation time within a process and index
          well as a primary key
        </li>
        <li>
          Ids a reducer derives for a child carry a UUIDv8 hashed from the parent and the
          child&apos;s position, so replay names the same child every time
        </li>
      </ul>
      <p>
        Effect ids are not drawn. They are <code>{'<threadId>:<tag>'}</code>, and a wait a reducer
        names with <code>createWaitId(scope, tag)</code> is <code>{'wait_<scope>_<tag>'}</code>.
      </p>
      <p>
        You can always pass your own <code>runId</code> or <code>threadId</code> to a start, launch,
        or fork. To change what Looms draws when you do not, pass an id format.
      </p>

      <h3 id="bring-your-own-ids">
        Bring your own id format
        <a className="heading-anchor" href="#bring-your-own-ids" aria-label="Link to this section">
          #
        </a>
      </h3>
      <p>
        An id format is two synchronous functions. <code>create</code> draws a fresh id.{' '}
        <code>derive</code> turns a list of parts into the same id on every call. Use one when run
        data is replicated into a system that already has an id convention, such as a Postgres
        schema keyed by UUID.
      </p>
      <CodeBlock>{`import { createHash, randomUUID } from 'node:crypto'
import { createLooms } from '@swirls/looms'
import type { LoomsIds } from '@swirls/looms/core'

const uuids: LoomsIds = {
  create: () => randomUUID(),
  derive: (kind, parts) => {
    const hex = createHash('sha256').update(JSON.stringify([kind, ...parts])).digest('hex')
    return [hex.slice(0, 8), hex.slice(8, 12), '8' + hex.slice(13, 16), 'a' + hex.slice(17, 20), hex.slice(20, 32)].join('-')
  },
}

const looms = createLooms({ ids: uuids, modules })`}</CodeBlock>
      <p>
        A format must keep two rules, checked when you pass it and again for every id it returns. A
        format that breaks one throws <code>InvalidIdFormatError</code>, which names the rule.
      </p>
      <ul>
        <li>An id is a non-empty string.</li>
        <li>
          An id contains no <code>:</code>, because effect ids are <code>{'<threadId>:<tag>'}</code>
          .
        </li>
      </ul>
      <p>
        A third rule cannot be checked: <code>derive</code> must be a pure function of its{' '}
        <code>kind</code> and <code>parts</code>. Reducers call it on every replay, in every
        process, and must get the same child id each time. Do not read a clock, a counter, or random
        bytes in it.
      </p>
      <p>
        Use one format per deployment and pass it everywhere ids are drawn: <code>createLooms</code>
        , <code>createRuntime</code>, <code>createActorCell</code>,{' '}
        <code>createLocalActorHost</code>, the Durable Object config,{' '}
        <code>routeToDurableObject</code>, the queue consumer, <code>createLoomsClient</code>,{' '}
        <code>LoomsProvider</code> or <code>createLoomsStore</code>, and <code>DebuggerShell</code>.
        Reducers and effect handlers read the configured format as <code>ctx.ids</code>:
      </p>
      <CodeBlock>{`effects: (state, ctx) => [
  spawn({
    // Derived, never drawn: this reducer runs again on every replay.
    childThreadId: ctx.ids.derive('thread', [ctx.threadId, 'review', state.round]),
    kind: 'agent',
    definitionName: 'reviewer',
  }),
]`}</CodeBlock>
      <p>
        Changing the format, or upgrading across a release that changes the default, renames every
        derived child. A run that is in flight across the change asks for children under new names
        and no longer matches the ones in its log, so it will not replay. Let in-flight runs finish
        on the old format first; see <Link to="/docs/versioning">versioning</Link>.
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
