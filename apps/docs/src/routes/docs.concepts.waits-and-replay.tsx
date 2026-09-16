import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
import { FlowChain } from '../components/flow-chain'
import { ConceptFigure } from '../illustrations/illustration'
import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/concepts/waits-and-replay')({
  head: () => pageHead('/docs/concepts/waits-and-replay'),
  component: WaitsAndReplay,
})

function WaitsAndReplay() {
  return (
    <>
      <h1>Waits &amp; replay</h1>
      <p>
        Progress lives in the log. Processes, workers, and UI caches are disposable. When a thread
        needs to pause for a human, webhook, child, or timer, it parks with its progress preserved
        until a matching event arrives. Host scheduling, storage, and connected clients determine
        resource usage.
      </p>

      <ConceptFigure name="wait" />

      <h2 id="waiting-and-parking">
        Waiting &amp; parking
        <a className="heading-anchor" href="#waiting-and-parking" aria-label="Link to this section">
          #
        </a>
      </h2>
      <FlowChain
        steps={[
          'WAITING',
          'persist state to log',
          '0 compute / no worker held',
          'matching event arrives',
          'RUNNING',
        ]}
      />
      <p>
        Registering a <code>Wait</code> checkpoints state to the log and releases worker resources.
        Days or weeks later, an approval or webhook signal wakes the thread with the same state.
        Matching is by event <code>type</code> plus an optional payload subset (e.g.{' '}
        <code>match: &#123; approvalId &#125;</code>).
      </p>
      <CodeBlock lang="ts">{`import { wait } from '@looms/core'

// Wait for a matching domain event (optional payload subset):
wait({
  waitId: 'appr_1',
  on: { type: 'approval.decided', match: { approvalId: 'appr_1' } },
})

// Wait until a wall-clock time (sleep / deadline):
wait({
  waitId: 'sleep_1',
  on: { timerAt: Date.now() + 60_000 },
})`}</CodeBlock>
      <p>
        Workflows and approvals compose the same primitive: charge, then wait for{' '}
        <code>payments.charge.authorized</code>; gate a human, then wait for{' '}
        <code>approval.decided</code>. See <Link to="/docs/modules">Modules</Link> and{' '}
        <Link to="/docs/examples">Examples</Link>.
      </p>

      <h2 id="wake">
        Wake
        <a className="heading-anchor" href="#wake" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        After a signal or timer lands, the host <strong>wakes</strong> the run: load snapshot +
        delta, reduce outstanding events, dispatch effects, then park again if still waiting. Actor
        cells enforce a single writer per <code>runId</code>, so wake cycles stay simple: no
        distributed locks inside the execution loop.
      </p>

      <h2 id="replay">
        Replay
        <a className="heading-anchor" href="#replay" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        State is derived by folding events through pure reducers. Replay reconstructs thread state
        or views without re-executing nondeterministic effects. <code>replayTo(runId, seq)</code>{' '}
        returns state before and after that event. The debugger and <code>@looms/testing</code> use
        it.
      </p>

      <h2 id="snapshots">
        Snapshots
        <a className="heading-anchor" href="#snapshots" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        A <strong>snapshot</strong> is a persisted projection checkpoint that accelerates
        reconstruction for long streams. On cold start the cell loads the latest snapshot, then
        applies the delta of events since that point.
      </p>

      <p>
        How and where the log lives in production:{' '}
        <Link to="/docs/hosting-and-storage">Hosting &amp; storage</Link>. Authoring waits and
        effects: <Link to="/docs/modules">Modules</Link>. The systems behind these ideas are listed
        in <Link to="/docs/prior-art">Prior art</Link>.
      </p>
    </>
  )
}
