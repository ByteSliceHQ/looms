import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/schedules')({
  head: () => pageHead('/docs/schedules'),
  component: Page,
})

function Page() {
  return (
    <>
      <h1>Schedules</h1>
      <p>
        A schedule is a run of kind <code>schedule</code>. When it fires, it starts a new run of a
        target definition. Deploys can add, change, pause, or retire schedules without minting a new
        run id.
      </p>
      <h2 id="define-a-schedule">
        Define a schedule
        <a className="heading-anchor" href="#define-a-schedule" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        <code>cron</code>, <code>every</code>, and <code>once</code> are the three specs. The
        default <code>input</code> callback runs at fire time, so it sees the deployment that is
        active then, not the one that created the schedule. Pass the module next to the module that
        owns the target.
      </p>
      <CodeBlock lang="ts">{`import { createLooms } from '@swirls/looms/runtime'
import { cron, defineSchedule, schedule } from '@swirls/looms/schedule'
import { defineWorkflow, workflow } from '@swirls/looms/workflow'

const report = defineWorkflow({
  name: 'report',
  nodes: [{ id: 'write', run: (ctx) => ctx.input ?? null }],
})

const nightly = defineSchedule({
  name: 'nightly-report',
  target: report,
  spec: cron('0 2 * * *', { tz: 'UTC' }),
  input: ({ at }) => ({ at }),
})

const looms = createLooms({
  modules: [
    workflow({ definitions: [report] }),
    schedule({ definitions: [nightly] }),
  ],
})

await looms.start(nightly, null, { runId: 'nightly-report' })`}</CodeBlock>
      <p>
        <code>every('15m')</code> repeats from an optional anchor. <code>once(at)</code> fires one
        absolute timestamp. A cron or interval tighter than <code>minIntervalMs</code> (60 seconds
        unless you pass a lower floor) is rejected and the schedule does not arm.
      </p>
      <h2 id="when-a-fire-is-skipped">
        When a fire is skipped
        <a
          className="heading-anchor"
          href="#when-a-fire-is-skipped"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        <code>misfire: 'fire-once'</code> (the default) fires a late slot once, then plans the next
        future slot. <code>'skip'</code> drops that slot. A late alarm does not catch up a backlog.
        <code>overlap: 'skip'</code> drops a fire whose previous target run is still going;{' '}
        <code>'allow'</code> starts another one. Either skip consumes the slot and records{' '}
        <code>schedule.skipped</code>.
      </p>
      <p>
        <code>beforeFire</code> can hold a fire for a reason you choose, such as a billing hold. The
        reason is on the skipped event, so a hold is visible instead of a silent miss. Resume plans
        the next occurrence after now and does not replay what was missed.
      </p>
      <h2 id="change-a-running-schedule">
        Change a running schedule
        <a
          className="heading-anchor"
          href="#change-a-running-schedule"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Send <code>update</code>, <code>pause</code>, <code>resume</code>, <code>retire</code>, or{' '}
        <code>trigger</code>. An update that matches the current spec is a no-op.{' '}
        <code>retire</code> parks a removed schedule without cancelling it, so the same run id can
        be resumed. <code>ensureSchedule</code> starts a missing schedule, updates a changed one,
        and resumes a paused or retired one.
      </p>
      <CodeBlock lang="ts">{`import { ensureSchedule, update } from '@swirls/looms/schedule'

await ensureSchedule(looms, nightly, 'nightly-report', {
  spec: cron('0 3 * * 1-5', { tz: 'UTC' }),
})

await looms.signal('nightly-report', [update({ spec: cron('0 3 * * *', { tz: 'UTC' }) })])`}</CodeBlock>
      <p>
        The fired run id is the schedule id, <code>fire</code>, and the slot time. A manual fire
        uses the trigger id instead of the slot. Repeating the same slot starts nothing again.
      </p>
      <h2 id="audit">
        Audit fires
        <a className="heading-anchor" href="#audit" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Each fire appends <code>schedule.fired</code> with the id of the run it started, or{' '}
        <code>schedule.skipped</code> with a reason. When the target accepts the start, the
        schedule&apos;s log also gets <code>runtime.run.launched</code> with the run id, definition,
        and effect id, so listing what a schedule started reads one log. The started run&apos;s{' '}
        <code>runtime.run.started</code> payload records <code>launchedBy</code>: the schedule run,
        its thread, the fire&apos;s effect id, and the id and seq of the event that requested the
        fire. The event&apos;s origin is <code>{"{ type: 'run' }"}</code>, and its{' '}
        <code>correlationId</code> is the schedule&apos;s run id, or the schedule&apos;s own
        correlation id when another run launched the schedule. Join <code>launchedBy.effectId</code>{' '}
        to the <code>effectId</code> on <code>schedule.fired</code>; no run id needs parsing. Every
        run an effect starts through <code>RunLauncher</code> carries the same fields, and the
        runtime sets them, so a handler cannot omit or forge them.
      </p>
      <h2 id="determinism">
        Determinism
        <a className="heading-anchor" href="#determinism" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        The fold does not read the clock. Planning and firing are effects, and each one records the
        next time on <code>schedule.planned</code>, <code>schedule.fired</code>, or{' '}
        <code>schedule.skipped</code>. Replaying the log produces the same state. The schedule
        thread forgets completed effect ids, so a long-lived schedule does not accumulate one id per
        fire.
      </p>
      <h2 id="cloudflare">
        Cloudflare
        <a className="heading-anchor" href="#cloudflare" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        On Cloudflare, give each schedule its own Durable Object and pass{' '}
        <code>durableObjectLauncher</code> so a fire can start the target object. Idle objects
        hibernate and are not billed for duration. A steady fire writes about eight rows and sets
        one alarm. Pass <code>modules</code> to <code>routeToDurableObject</code> when the debugger
        should list schedule definitions.
      </p>
      <p>
        An open server-sent event stream keeps the object awake, because the runtime heartbeats
        every few seconds. Do not attach a remote projector to a schedule object. Pause and retire
        delete the alarm. A one-minute cron is the expensive case: the floor is 60 seconds so that
        cadence is opt-in, and ten thousand of them is the line item to budget, not the idle time.
      </p>
      <p>
        The <Link to="/docs/examples">examples</Link> include a one-shot that fires during start and
        exits. The same definition shape takes a cron spec in production.
      </p>
    </>
  )
}
