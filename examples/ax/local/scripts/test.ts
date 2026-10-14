import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

import { Clock, DateTime, Effect, Schema } from 'effect'

import { decision, pendingApprovals } from '@swirls/looms/approval'
import { axJobId } from '@swirls/looms/ax'
import { createLooms } from '@swirls/looms/runtime'

import { modules, repository, review } from '../../definition'
import { assertCluster, kubectl, stateDir, run as runCommand } from './cluster'

const Credentials = Schema.Struct({
  LOOMS_READ_TOKEN: Schema.String,
  LOOMS_WRITE_TOKEN: Schema.String,
  AX_HOST_TOKEN: Schema.String,
})

const credentials = Schema.decodeUnknownSync(Credentials)(
  await Bun.file(resolve(stateDir, 'credentials.json')).json(),
)

const State = Schema.Struct({
  runId: Schema.String,
  state: Schema.Struct({ status: Schema.String }),
})

const Events = Schema.Struct({
  events: Schema.Array(
    Schema.Struct({ type: Schema.String, payload: Schema.Json, seq: Schema.Finite }),
  ),
})

const Approval = Schema.Struct({ approvalId: Schema.String })
const Identity = Schema.Struct({ effectId: Schema.String, attempt: Schema.Finite })

const Job = Schema.Struct({
  id: Schema.String,
  stopped: Schema.Boolean,
  delivery: Schema.String,
  launched: Schema.Boolean,
  lastError: Schema.NullOr(Schema.String),
})

const decodeEvents = Schema.decodeUnknownSync(Events)
const decodeState = Schema.decodeUnknownSync(State)
const decodeJob = Schema.decodeUnknownSync(Job)

const report: {
  name: string
  runId: string
  jobId: string
  durationMs: number
  passed: boolean
}[] = []

const command = (args: string[]) => runCommand([...kubectl, ...args])

await assertCluster()

let hostForward = Bun.spawn(
  [
    ...kubectl,
    '-n',
    'looms-ax-test',
    'port-forward',
    'service/looms',
    '18790:8790',
    '--address=127.0.0.1',
  ],
  { stdout: 'ignore', stderr: 'ignore' },
)

let bridgeForward = Bun.spawn(
  [
    ...kubectl,
    '-n',
    'looms-ax-test',
    'port-forward',
    'service/ax-bridge',
    '18789:8789',
    '--address=127.0.0.1',
  ],
  { stdout: 'ignore', stderr: 'ignore' },
)

async function request(path: string, body?: string, bridge = false) {
  const response = await fetch(`http://127.0.0.1:${bridge ? 18789 : 18790}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    body,
    headers: {
      authorization: `Bearer ${bridge ? credentials.AX_HOST_TOKEN : body === undefined ? credentials.LOOMS_READ_TOKEN : credentials.LOOMS_WRITE_TOKEN}`,
      'content-type': 'application/json',
    },
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${path}: ${await response.text()}`)
  }

  return response.json()
}

async function until<A>(
  read: () => Promise<A>,
  done: (value: A) => boolean,
  timeout = 300_000,
): Promise<A> {
  const beganAt = Effect.runSync(Clock.currentTimeMillis)
  let lastError = ''

  while (Effect.runSync(Clock.currentTimeMillis) - beganAt < timeout) {
    try {
      const value = await read()

      if (done(value)) {
        return value
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Request failed'
    }

    await Bun.sleep(1_000)
  }

  throw new Error(`Timed out: ${lastError}`)
}

const events = (id: string) =>
  request(`/runs/${id}/events`)
    .then(decodeEvents)
    .then((value) => value.events)

async function start(delayMs = 0, failAttempts = 0, networkProbe = false) {
  const run = decodeState(
    await request(
      '/runs',
      JSON.stringify({
        kind: 'workflow',
        definitionName: review.name,
        input: { revision: 'fixture-v1', delayMs, failAttempts, networkProbe },
      }),
    ),
  )

  const history = await events(run.runId)
  const queued = history.find((event) => event.type === 'runtime.effect.queued')

  if (!queued) {
    throw new Error('No external AX effect was queued')
  }

  const identity = Schema.decodeUnknownSync(Identity)(queued.payload)

  const jobId = await axJobId('ax-example', {
    ...identity,
    runId: run.runId,
    type: 'repository.analyze.v1',
    input: {},
  })

  return { ...run, jobId }
}

async function approve(runId: string) {
  const history = await until(
    () => events(runId),
    (items) => items.some((event) => event.type === 'approval.requested'),
  )

  const approval = history.find((event) => event.type === 'approval.requested')

  if (!approval) {
    throw new Error('No approval')
  }

  const { approvalId } = Schema.decodeUnknownSync(Approval)(approval.payload)

  await request(
    `/runs/${runId}/events`,
    JSON.stringify({
      events: [decision(approvalId, 'approve')],
      idempotencyKey: `approve-${runId}`,
    }),
  )

  const done = decodeState(await request(`/runs/${runId}`))

  if (done.state.status !== 'completed') {
    throw new Error(`Workflow did not complete: ${done.state.status}`)
  }
}

try {
  await until(
    () => request('/health'),
    () => true,
    30_000,
  )

  const startedAt = Effect.runSync(Clock.currentTimeMillis)
  const run = await start()
  console.log(`Real AX run ${run.runId}, job ${run.jobId}`)

  await until(
    () => events(run.runId),
    (items) => items.some((event) => event.type === 'approval.requested'),
  )

  const cleaned = await until(
    () => request(`/v1/jobs/${run.jobId}`, undefined, true).then(decodeJob),
    (job) => job.stopped,
  )

  if (!cleaned.launched || cleaned.delivery !== 'applied') {
    throw new Error(`AX delivery not confirmed: ${JSON.stringify(cleaned)}`)
  }

  if (process.argv.includes('--recovery')) {
    hostForward.kill()
    await hostForward.exited
    await command(['-n', 'looms-ax-test', 'rollout', 'restart', 'deployment/looms'])

    await command([
      '-n',
      'looms-ax-test',
      'rollout',
      'status',
      'deployment/looms',
      '--timeout=120s',
    ])

    hostForward = Bun.spawn(
      [
        ...kubectl,
        '-n',
        'looms-ax-test',
        'port-forward',
        'service/looms',
        '18790:8790',
        '--address=127.0.0.1',
      ],
      { stdout: 'ignore', stderr: 'ignore' },
    )

    await until(
      () => request('/health'),
      () => true,
      30_000,
    )
  }

  await approve(run.runId)
  const domain = (await events(run.runId)).filter((event) => event.type === 'repository.analyzed')

  if (domain.length !== 1) {
    throw new Error('Analysis was duplicated')
  }

  const local = createLooms({ modules })

  try {
    const localRun = await local.start(review, {
      revision: 'fixture-v1',
      networkProbe: false,
      delayMs: 0,
      failAttempts: 0,
    })

    const pending = (await local.project(localRun.runId, pendingApprovals)).items.find(
      (item) => item.status === 'pending',
    )

    if (!pending) {
      throw new Error('Local workflow did not wait for approval')
    }

    await local.signal(localRun.runId, [decision(pending.approvalId, 'approve')])
    const projection = await local.project(localRun.runId, repository.projections.report)

    if (
      JSON.stringify(projection.analyses) !== JSON.stringify(domain.map((event) => event.payload))
    ) {
      throw new Error('Local and AX business outcomes differ')
    }
  } finally {
    await local.stop()
  }

  report.push({
    name: 'real AX execution, approval, local parity and confirmed cleanup',
    runId: run.runId,
    jobId: run.jobId,
    durationMs: Effect.runSync(Clock.currentTimeMillis) - startedAt,
    passed: true,
  })

  if (process.argv.includes('--faults')) {
    const retryStarted = Effect.runSync(Clock.currentTimeMillis)
    const retried = await start(0, 1)
    await approve(retried.runId)
    const retryHistory = await events(retried.runId)
    const attempts = retryHistory.filter((event) => event.type === 'runtime.effect.worker.started')

    if (
      attempts.length !== 2 ||
      retryHistory.filter((event) => event.type === 'repository.analyzed').length !== 1
    ) {
      throw new Error('Expected exactly two worker attempts and one successful business result')
    }

    await until(
      () => request(`/v1/jobs/${retried.jobId}`, undefined, true).then(decodeJob),
      (job) => job.stopped && job.delivery === 'applied',
    )

    report.push({
      name: 'Looms-owned retry after real worker failure',
      runId: retried.runId,
      jobId: retried.jobId,
      durationMs: Effect.runSync(Clock.currentTimeMillis) - retryStarted,
      passed: true,
    })

    const restartStarted = Effect.runSync(Clock.currentTimeMillis)
    const restarted = await start(40_000)

    await until(
      () => events(restarted.runId),
      (items) => items.some((event) => event.type === 'runtime.effect.worker.started'),
    )

    bridgeForward.kill()
    await bridgeForward.exited

    for (const [namespace, deployment] of [
      ['ax-system', 'ax-controller'],
      ['ax-system', 'ax-redis'],
      ['looms-ax-test', 'bridge-postgres'],
      ['looms-ax-test', 'ax-bridge'],
    ]) {
      await command(['-n', namespace ?? '', 'rollout', 'restart', `deployment/${deployment}`])

      await command([
        '-n',
        namespace ?? '',
        'rollout',
        'status',
        `deployment/${deployment}`,
        '--timeout=120s',
      ])
    }

    bridgeForward = Bun.spawn(
      [
        ...kubectl,
        '-n',
        'looms-ax-test',
        'port-forward',
        'service/ax-bridge',
        '18789:8789',
        '--address=127.0.0.1',
      ],
      { stdout: 'ignore', stderr: 'ignore' },
    )

    await approve(restarted.runId)

    await until(
      () => request(`/v1/jobs/${restarted.jobId}`, undefined, true).then(decodeJob),
      (job) => job.stopped,
    )

    const recoveredEvents = await events(restarted.runId)

    if (
      recoveredEvents.filter((event) => event.type === 'repository.analyzed').length !== 1 ||
      recoveredEvents.filter((event) => event.type === 'runtime.effect.worker.started').length > 2
    ) {
      throw new Error('Control-plane restart duplicated a result or exceeded one recovery retry')
    }

    report.push({
      name: 'AX controller, Redis, PostgreSQL and bridge restart during execution',
      runId: restarted.runId,
      jobId: restarted.jobId,
      durationMs: Effect.runSync(Clock.currentTimeMillis) - restartStarted,
      passed: true,
    })

    const cancelStarted = Effect.runSync(Clock.currentTimeMillis)
    const cancelled = await start(120_000)

    await until(
      () => events(cancelled.runId),
      (items) => items.some((event) => event.type === 'runtime.effect.worker.started'),
    )

    await request(`/demo/runs/${cancelled.runId}/cancel`, '{}')

    await until(
      () => request(`/v1/jobs/${cancelled.jobId}`, undefined, true).then(decodeJob),
      (job) => job.stopped,
    )

    const cancelledEvents = await until(
      () => events(cancelled.runId),
      (items) => items.some((event) => event.type === 'runtime.effect.cancelled'),
    )

    if (cancelledEvents.some((event) => event.type === 'repository.analyzed')) {
      throw new Error('Cancelled analysis produced a business result')
    }

    report.push({
      name: 'running cancellation acknowledged after AX and Substrate teardown',
      runId: cancelled.runId,
      jobId: cancelled.jobId,
      durationMs: Effect.runSync(Clock.currentTimeMillis) - cancelStarted,
      passed: true,
    })
  }

  if (process.argv.includes('--egress')) {
    const probeStarted = Effect.runSync(Clock.currentTimeMillis)
    const probed = await start(0, 0, true)
    await approve(probed.runId)
    const event = (await events(probed.runId)).find((item) => item.type === 'repository.analyzed')

    const network = Schema.decodeUnknownSync(
      Schema.Struct({
        network: Schema.Struct({ allowed: Schema.Boolean, denied: Schema.Boolean }),
      }),
    )(event?.payload).network

    await until(
      () => request(`/v1/jobs/${probed.jobId}`, undefined, true).then(decodeJob),
      (job) => job.stopped,
    )

    report.push({
      name: 'sandbox allows bridge HTTP and denies a controlled Looms health endpoint',
      runId: probed.runId,
      jobId: probed.jobId,
      durationMs: Effect.runSync(Clock.currentTimeMillis) - probeStarted,
      passed: network.allowed && network.denied,
    })

    if (!network.allowed || !network.denied) {
      throw new Error(`Gateway egress qualification failed: ${JSON.stringify(network)}`)
    }
  }
} finally {
  hostForward.kill()
  bridgeForward.kill()
  await Promise.all([hostForward.exited, bridgeForward.exited])

  await mkdir(resolve(stateDir, 'evidence'), { recursive: true })

  await Bun.write(
    resolve(
      stateDir,
      'evidence',
      process.argv.includes('--egress') ? 'isolation-qualification.json' : 'live-test.json',
    ),
    JSON.stringify(
      {
        at: DateTime.formatIso(Effect.runSync(DateTime.now)),
        context: 'k3d-looms-ax',
        scenarios: report,
      },
      null,
      2,
    ),
  )

  console.log(JSON.stringify(report, null, 2))
}
