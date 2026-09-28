import { chmod } from 'node:fs/promises'
import { resolve } from 'node:path'

import { Effect, Schema } from 'effect'

import { decision } from '@swirls/looms/approval'
import { bearerAuth } from '@swirls/looms/runtime'

import { assertBridgeIdle, assertCluster, kubectl, root, run, stateDir } from './cluster'

await assertCluster()
await assertBridgeIdle()

const originalTarget = await run([
  ...kubectl,
  '-n',
  'looms-ax-test',
  'get',
  'deployment/ax-bridge',
  '-o',
  'jsonpath={.spec.template.spec.containers[0].env[?(@.name=="LOOMS_URL")].value}',
])

if (!originalTarget) {
  throw new Error('The bridge must have an explicit LOOMS_URL to restore after this test')
}

const Credentials = Schema.Struct({
  AX_HOST_TOKEN: Schema.String,
  LOOMS_READ_TOKEN: Schema.String,
  LOOMS_WRITE_TOKEN: Schema.String,
  LOOMS_WORKER_TOKEN: Schema.String,
})

const secrets = Schema.decodeUnknownSync(Credentials)(
  await Bun.file(resolve(stateDir, 'credentials.json')).json(),
)

const envFile = resolve(stateDir, 'cloudflare.env')

await Bun.write(
  envFile,
  Object.entries(secrets)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n'),
)

await chmod(envFile, 0o600)

const forward = Bun.spawn(
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

await Bun.write(resolve(stateDir, 'cloudflare.log'), '')
await Bun.write(resolve(stateDir, 'cloudflare-error.log'), '')

const emulator = Bun.spawn(
  [
    'bun',
    'x',
    'wrangler',
    'dev',
    '--config',
    'examples/ax/cloudflare/wrangler.jsonc',
    '--ip',
    '127.0.0.1',
    '--port',
    '8791',
    '--local',
    '--persist-to',
    resolve(stateDir, 'cloudflare'),
    '--env-file',
    envFile,
  ],
  {
    cwd: root,
    stdout: Bun.file(resolve(stateDir, 'cloudflare.log')),
    stderr: Bun.file(resolve(stateDir, 'cloudflare-error.log')),
  },
)

// Only the authenticated callback routes are reachable from K3s; workerd stays on loopback.
const authorizeRelay = bearerAuth({
  read: secrets.LOOMS_READ_TOKEN,
  worker: secrets.LOOMS_WORKER_TOKEN,
})

const relay = Bun.serve({
  hostname: '0.0.0.0',
  port: 18791,
  fetch(incoming) {
    const path = new URL(incoming.url).pathname
    const read = incoming.method === 'GET' && /^\/runs\/[^/]+(?:\/events)?$/.test(path)

    const callback =
      incoming.method === 'POST' &&
      /^\/runs\/[^/]+\/effects\/[^/]+\/[1-9]\d*\/(started|heartbeat|complete|fail|cancelled)$/.test(
        path,
      )

    if (!read && !callback) {
      return new Response('Not Found', { status: 404 })
    }

    return Effect.runPromise(
      authorizeRelay(incoming, {
        access: read ? 'read' : 'worker',
        name: 'fixture.callback-relay',
      }),
    ).then((auth) =>
      auth.allowed
        ? fetch(new Request(`http://127.0.0.1:8791${path}`, incoming), { redirect: 'manual' }).then(
            (response) => {
              // Fetch has decoded the upstream body; don't forward its compressed framing.
              const headers = new Headers(response.headers)
              headers.delete('content-encoding')
              headers.delete('content-length')
              return new Response(response.body, { status: response.status, headers })
            },
          )
        : new Response(auth.error, { status: auth.status }),
    )
  },
})

const Run = Schema.Struct({ runId: Schema.String, state: Schema.Struct({ status: Schema.String }) })

const History = Schema.Struct({
  events: Schema.Array(Schema.Struct({ type: Schema.String, payload: Schema.Json })),
})

const Approval = Schema.Struct({ approvalId: Schema.String })

async function request(path: string, body?: string) {
  const response = await fetch(`http://127.0.0.1:8791${path}`, {
    method: body ? 'POST' : 'GET',
    body,
    headers: {
      authorization: `Bearer ${body ? secrets.LOOMS_WRITE_TOKEN : secrets.LOOMS_READ_TOKEN}`,
      'content-type': 'application/json',
    },
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    throw new Error(`Cloudflare fixture HTTP ${response.status}`)
  }

  return response.json()
}

try {
  let ready = false

  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      await request('/health')
      ready = true
      break
    } catch {
      await Bun.sleep(1_000)
    }
  }

  if (!ready) {
    throw new Error(
      'Local Cloudflare emulator did not start; inspect .ax-local/cloudflare-error.log',
    )
  }

  await run([
    ...kubectl,
    '-n',
    'looms-ax-test',
    'set',
    'env',
    'deployment/ax-bridge',
    'LOOMS_URL=http://host.docker.internal:18791',
  ])

  await run([
    ...kubectl,
    '-n',
    'looms-ax-test',
    'rollout',
    'status',
    'deployment/ax-bridge',
    '--timeout=120s',
  ])

  // The deployment restart closes the original forwarding stream.
  forward.kill()
  await forward.exited

  const activeForward = Bun.spawn(
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

  try {
    await Bun.sleep(1_000)

    const started = Schema.decodeUnknownSync(Run)(
      await request(
        '/runs',
        JSON.stringify({
          kind: 'workflow',
          definitionName: 'ax-repository-review',
          input: { revision: 'fixture-v1' },
        }),
      ),
    )

    console.log(`Cloudflare run ${started.runId}`)
    let approvalId: string | undefined

    for (let attempt = 0; attempt < 180; attempt++) {
      const history = Schema.decodeUnknownSync(History)(
        await request(`/runs/${started.runId}/events`),
      )

      const event = history.events.find((item) => item.type === 'approval.requested')

      if (event) {
        approvalId = Schema.decodeUnknownSync(Approval)(event.payload).approvalId
        break
      }

      await Bun.sleep(1_000)
    }

    if (!approvalId) {
      throw new Error(`AX callback did not advance Cloudflare run ${started.runId}`)
    }

    await request(
      `/runs/${started.runId}/events`,
      JSON.stringify({ events: [decision(approvalId, 'approve')] }),
    )

    const completed = Schema.decodeUnknownSync(Run)(await request(`/runs/${started.runId}`))

    const history = Schema.decodeUnknownSync(History)(
      await request(`/runs/${started.runId}/events`),
    )

    if (
      completed.state.status !== 'completed' ||
      history.events.filter((event) => event.type === 'repository.analyzed').length !== 1
    ) {
      throw new Error('Cloudflare fixture did not complete exactly one analysis')
    }

    // Drain the outbox before restoring the target; a committed callback may still need a receipt.
    for (let attempt = 0; ; attempt++) {
      try {
        await assertBridgeIdle()
        break
      } catch (error) {
        if (attempt >= 60) {
          throw error
        }

        await Bun.sleep(1_000)
      }
    }

    const result = {
      emulator: 'local workerd via Wrangler',
      cluster: 'k3d-looms-ax',
      runId: started.runId,
      status: 'completed',
      domainResults: 1,
    }

    await Bun.write(resolve(stateDir, 'evidence/cloudflare.json'), JSON.stringify(result, null, 2))
    console.log(JSON.stringify(result))
  } finally {
    activeForward.kill()
    await activeForward.exited
  }
} finally {
  try {
    await run([
      ...kubectl,
      '-n',
      'looms-ax-test',
      'set',
      'env',
      'deployment/ax-bridge',
      `LOOMS_URL=${originalTarget}`,
    ])

    await run([
      ...kubectl,
      '-n',
      'looms-ax-test',
      'rollout',
      'status',
      'deployment/ax-bridge',
      '--timeout=120s',
    ])
  } finally {
    await relay.stop(true)
    forward.kill()
    emulator.kill()
    await Promise.all([forward.exited, emulator.exited])
  }
}
