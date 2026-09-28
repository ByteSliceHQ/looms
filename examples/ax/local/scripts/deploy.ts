import { randomBytes } from 'node:crypto'
import { chmod, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

import { Schema } from 'effect'

import type { JsonValue } from '@looms/core'

import { assertCluster, kubectl, root, run, stateDir } from './cluster'

const namespace = 'looms-ax-test'
const labels = { 'app.kubernetes.io/part-of': 'looms-ax' }

await assertCluster()

await mkdir(stateDir, { recursive: true })
const secretsPath = resolve(stateDir, 'credentials.json')
const secretFile = Bun.file(secretsPath)

const Credentials = Schema.Struct({
  AX_HOST_TOKEN: Schema.String,
  AX_CAPABILITY_SECRET: Schema.String,
  LOOMS_READ_TOKEN: Schema.String,
  LOOMS_WRITE_TOKEN: Schema.String,
  LOOMS_WORKER_TOKEN: Schema.String,
  POSTGRES_PASSWORD: Schema.String,
})

const secrets = (await secretFile.exists())
  ? Schema.decodeUnknownSync(Credentials)(await secretFile.json())
  : {
      AX_HOST_TOKEN: randomBytes(32).toString('hex'),
      AX_CAPABILITY_SECRET: randomBytes(32).toString('hex'),
      LOOMS_READ_TOKEN: randomBytes(32).toString('hex'),
      LOOMS_WRITE_TOKEN: randomBytes(32).toString('hex'),
      LOOMS_WORKER_TOKEN: randomBytes(32).toString('hex'),
      POSTGRES_PASSWORD: randomBytes(32).toString('hex'),
    }

await Bun.write(secretsPath, JSON.stringify(secrets))
await chmod(secretsPath, 0o600)

async function image(name: string): Promise<string> {
  const ref = await run([
    'docker',
    'image',
    'inspect',
    '--format',
    '{{index .RepoDigests 0}}',
    `localhost:5007/looms-ax-${name}:dev`,
  ])

  if (!/^localhost:5007\/looms-ax-[a-z]+@sha256:[a-f0-9]{64}$/.test(ref)) {
    throw new Error(`Image ${name} needs pushing to the fixture registry`)
  }

  return ref
}

const images = {
  host: await image('host'),
  bridge: await image('bridge'),
  worker: await image('worker'),
}

await Bun.write(resolve(stateDir, 'images.json'), JSON.stringify(images, null, 2))

const resources: JsonValue[] = []

for (const name of [namespace, 'ax-system']) {
  resources.push({ apiVersion: 'v1', kind: 'Namespace', metadata: { name, labels } })
}

function volume(name: string, ns: string, size = '1Gi') {
  resources.push({
    apiVersion: 'v1',
    kind: 'PersistentVolumeClaim',
    metadata: { name, namespace: ns, labels },
    spec: { accessModes: ['ReadWriteOnce'], resources: { requests: { storage: size } } },
  })
}

function deployment(
  name: string,
  ns: string,
  imageRef: string,
  port: number,
  env: Record<string, string>,
  extra: Record<string, JsonValue> = {},
  container: Record<string, JsonValue> = {},
) {
  resources.push({
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: { name, namespace: ns, labels },
    spec: {
      replicas: 1,
      strategy: { type: 'Recreate' },
      selector: { matchLabels: { app: name } },
      template: {
        metadata: { labels: { ...labels, app: name } },
        spec: {
          terminationGracePeriodSeconds: 5,
          ...extra,
          containers: [
            {
              name,
              image: imageRef,
              imagePullPolicy: 'IfNotPresent',
              ports: [{ containerPort: port }],
              env: Object.entries(env).map(([key, value]) => ({ name: key, value })),
              resources: {
                requests: { cpu: '100m', memory: '128Mi' },
                limits: { cpu: '2', memory: '1Gi' },
              },
              ...container,
            },
          ],
        },
      },
    },
  })

  resources.push({
    apiVersion: 'v1',
    kind: 'Service',
    metadata: { name, namespace: ns, labels },
    spec: { selector: { app: name }, ports: [{ port, targetPort: port }] },
  })
}

volume('redis', 'ax-system')

deployment(
  'ax-redis',
  'ax-system',
  'redis:7.4.2-alpine',
  6379,
  {},
  { volumes: [{ name: 'data', persistentVolumeClaim: { claimName: 'redis' } }] },
  {
    args: ['redis-server', '--appendonly', 'yes', '--appendfsync', 'always'],
    volumeMounts: [{ name: 'data', mountPath: '/data' }],
  },
)

const controlImage = await run([
  'docker',
  'image',
  'inspect',
  '--format',
  '{{index .RepoDigests 0}}',
  'localhost:5007/looms-ax-control:f009cc8',
])

deployment(
  'ax-server',
  'ax-system',
  controlImage,
  8080,
  {},
  {},
  {
    command: ['/ax-server'],
    args: ['--addr=:8080', '--redis-addr=ax-redis.ax-system.svc:6379'],
    readinessProbe: { httpGet: { path: '/healthz', port: 8080 } },
  },
)

const certVolumes = [
  {
    name: 'ate-token',
    projected: {
      sources: [
        {
          serviceAccountToken: {
            audience: 'api.ate-system.svc',
            expirationSeconds: 7200,
            path: 'token',
          },
        },
      ],
    },
  },
  {
    name: 'ate-ca',
    projected: {
      sources: [
        {
          clusterTrustBundle: {
            signerName: 'servicedns.podcert.ate.dev/identity',
            labelSelector: { matchLabels: { 'podcert.ate.dev/canarying': 'live' } },
            path: 'ca.pem',
          },
        },
      ],
    },
  },
]

const certMounts = [
  { name: 'ate-token', mountPath: '/run/ate-token', readOnly: true },
  { name: 'ate-ca', mountPath: '/run/ate-ca', readOnly: true },
]

deployment(
  'ax-controller',
  'ax-system',
  controlImage,
  9090,
  {
    ATENET_ROUTER_ADDR: 'atenet-router.ate-system.svc:80',
    AX_SNAPSHOTS_BUCKET: 'gs://ate-snapshots/looms-ax/',
  },
  { volumes: certVolumes },
  {
    command: ['/ax-controller'],
    volumeMounts: certMounts,
    args: [
      '--redis-addr=ax-redis.ax-system.svc:6379',
      '--substrate-endpoint=api.ate-system.svc:443',
      '--substrate-authority=api.ate-system.svc',
      '--substrate-token-file=/run/ate-token/token',
      '--substrate-ca-file=/run/ate-ca/ca.pem',
      '--template=sandbox-template',
      '--template-atespace=ate-demo-sandbox',
    ],
  },
)

for (const [name, keys] of [
  [
    'bridge-credentials',
    [
      'AX_HOST_TOKEN',
      'AX_CAPABILITY_SECRET',
      'LOOMS_READ_TOKEN',
      'LOOMS_WORKER_TOKEN',
      'POSTGRES_PASSWORD',
    ],
  ],
  [
    'looms-credentials',
    ['AX_HOST_TOKEN', 'LOOMS_READ_TOKEN', 'LOOMS_WRITE_TOKEN', 'LOOMS_WORKER_TOKEN'],
  ],
  ['postgres-credentials', ['POSTGRES_PASSWORD']],
] as const) {
  resources.push({
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: { name, namespace, labels },
    stringData: Object.fromEntries(keys.map((key) => [key, secrets[key]])),
  })
}

volume('bridge-postgres', namespace)

deployment(
  'bridge-postgres',
  namespace,
  'postgres:17.4-alpine',
  5432,
  { POSTGRES_DB: 'looms', POSTGRES_USER: 'looms' },
  { volumes: [{ name: 'data', persistentVolumeClaim: { claimName: 'bridge-postgres' } }] },
  {
    envFrom: [{ secretRef: { name: 'postgres-credentials' } }],
    volumeMounts: [{ name: 'data', mountPath: '/var/lib/postgresql/data' }],
    readinessProbe: { exec: { command: ['pg_isready', '-U', 'looms', '-d', 'looms'] } },
  },
)

volume('looms-data', namespace)

deployment(
  'looms',
  namespace,
  images.host,
  8790,
  {
    PORT: '8790',
    LOOMS_DB: '/data/looms.sqlite',
    AX_BRIDGE_URL: `http://ax-bridge.${namespace}.svc.cluster.local:8789`,
    AX_ALLOW_INSECURE: 'true',
  },
  { volumes: [{ name: 'data', persistentVolumeClaim: { claimName: 'looms-data' } }] },
  {
    envFrom: [{ secretRef: { name: 'looms-credentials' } }],
    volumeMounts: [{ name: 'data', mountPath: '/data' }],
    readinessProbe: { httpGet: { path: '/health', port: 8790 } },
  },
)

const profiles = [
  {
    id: 'repository-analyzer-v1',
    effectType: 'repository.analyze.v1',
    image: images.worker,
    command: ['bun', '/app/src/worker.js'],
    gateway: 'looms-fixture',
    allowedEvents: ['repository.analyzed'],
    maxDurationMs: 1_200_000,
  },
]

deployment(
  'ax-bridge',
  namespace,
  images.bridge,
  8789,
  {
    PORT: '8789',
    AX_ENDPOINT: 'ax-server.ax-system.svc:8080',
    AX_ATESPACE: namespace,
    AX_WORKER_ENDPOINT: `http://ax-bridge.${namespace}.svc.cluster.local:8789`,
    AX_ALLOW_INSECURE: 'true',
    SUBSTRATE_ENDPOINT: 'api.ate-system.svc:443',
    SUBSTRATE_CA_FILE: '/run/ate-ca/ca.pem',
    SUBSTRATE_TOKEN_FILE: '/run/ate-token/token',
    AX_SCOPE: 'ax-example',
    LOOMS_CALLBACK_TARGET: 'ax-example',
    LOOMS_URL: `http://looms.${namespace}.svc:8790`,
    AX_PROFILES: JSON.stringify(profiles),
    DATABASE_URL: 'postgres://looms:$(POSTGRES_PASSWORD)@bridge-postgres:5432/looms',
  },
  { volumes: certVolumes },
  {
    envFrom: [{ secretRef: { name: 'bridge-credentials' } }],
    volumeMounts: certMounts,
    readinessProbe: { httpGet: { path: '/health', port: 8789 } },
  },
)

// AX has no application authentication. Restrict access to its trusted bridge and controllers.
for (const [name, ns, callers] of [
  ['ax-server', 'ax-system', ['ax-bridge']],
  ['ax-redis', 'ax-system', ['ax-server', 'ax-controller']],
  ['bridge-postgres', namespace, ['ax-bridge']],
] as const) {
  resources.push({
    apiVersion: 'networking.k8s.io/v1',
    kind: 'NetworkPolicy',
    metadata: { name, namespace: ns, labels },
    spec: {
      podSelector: { matchLabels: { app: name } },
      policyTypes: ['Ingress'],
      ingress: [
        {
          from: callers.map((app) => ({
            namespaceSelector: { matchLabels: labels },
            podSelector: { matchLabels: { app } },
          })),
        },
      ],
    },
  })
}

await run(
  [...kubectl, 'apply', '-f', '-'],
  root,
  JSON.stringify({ apiVersion: 'v1', kind: 'List', items: resources }),
)

for (const [ns, name] of [
  ['ax-system', 'ax-server'],
  [namespace, 'bridge-postgres'],
  [namespace, 'looms'],
  [namespace, 'ax-bridge'],
]) {
  await run([
    ...kubectl,
    '-n',
    ns ?? namespace,
    'rollout',
    'status',
    `deployment/${name}`,
    '--timeout=180s',
  ])
}

await run([
  ...kubectl,
  '-n',
  namespace,
  'exec',
  'deployment/ax-bridge',
  '--',
  'bun',
  '/app/src/configure.js',
])

console.log(
  'AX example deployed to k3d-looms-ax. Credentials remain in .ax-local/credentials.json.',
)
