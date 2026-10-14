import { chmod, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

import { assertCluster, kubeconfig, kubectl, root, run, stateDir } from './cluster'

const axCommit = 'f009cc81c9a571073bc1dd58cd2ed934bf2d5b1c'
const substrateCommit = '672533541dbfcd29084e4de2475267088bda3651'
await mkdir(stateDir, { recursive: true })

for (const binary of ['docker', 'kubectl', 'k3d', 'git', 'go', 'bun']) {
  if (!Bun.which(binary)) {
    throw new Error(`Install ${binary} before running this fixture`)
  }
}

const architecture = await run(['docker', 'info', '--format', '{{.Architecture}}'])

if (!['aarch64', 'arm64'].includes(architecture)) {
  throw new Error('This qualified fixture currently requires an ARM64 Docker daemon')
}

const clusters = await run(['k3d', 'cluster', 'list', '--no-headers'])
const exists = clusters.split('\n').some((line) => line.split(/\s+/)[0] === 'looms-ax')
const marker = Bun.file(resolve(stateDir, 'cluster-uid'))

if (exists && !(await marker.exists())) {
  throw new Error(
    'Existing looms-ax cluster has no ownership marker; refusing to adopt it automatically',
  )
}

if (exists) {
  await run(['k3d', 'cluster', 'start', 'looms-ax'])
} else {
  if (await marker.exists()) {
    throw new Error(
      'Ownership marker exists but cluster is missing; inspect retained data before creating another cluster',
    )
  }

  await run(['docker', 'volume', 'create', 'looms-ax-sandbox'])
  await run(['k3d', 'cluster', 'create', '--config', resolve(root, 'examples/ax/local/k3d.yaml')])
}

await Bun.write(kubeconfig, await run(['k3d', 'kubeconfig', 'get', 'looms-ax']))
await chmod(kubeconfig, 0o600)

if (!exists) {
  await Bun.write(
    marker,
    await run([...kubectl, 'get', 'namespace', 'kube-system', '-o', 'jsonpath={.metadata.uid}']),
  )
}

await assertCluster()

await run([
  'docker',
  'exec',
  'k3d-looms-ax-server-0',
  'sysctl',
  '-w',
  'net.ipv4.conf.default.proxy_arp=1',
  'net.ipv4.conf.all.proxy_arp=1',
])

async function source(name: string, url: string, commit: string): Promise<string> {
  const path = resolve(stateDir, name)

  if (!(await Bun.file(resolve(path, '.git/HEAD')).exists())) {
    await run(['git', 'clone', '--filter=blob:none', '--no-checkout', url, path])
    await run(['git', 'checkout', '--detach', commit], path)
  }

  if ((await run(['git', 'rev-parse', 'HEAD'], path)) !== commit) {
    throw new Error(`${name} checkout does not match the pinned revision`)
  }

  return path
}

const substrate = await source(
  'substrate',
  'https://github.com/agent-substrate/substrate.git',
  substrateCommit,
)

const ax = await source('ax', 'https://github.com/google/ax.git', axCommit)
const overlay = Bun.file(resolve(substrate, 'manifests/ate-install/kind/atelet/kustomization.yaml'))

await Bun.write(
  overlay,
  (await overlay.text()).replaceAll('kind-registry:5000', 'looms-ax-registry:5000'),
)

console.log(
  'Building and installing pinned Substrate; first run downloads Go toolchains and gVisor.',
)

await run(
  [
    'env',
    `KUBECONFIG=${kubeconfig}`,
    'KUBECTL_CONTEXT=k3d-looms-ax',
    'KO_DOCKER_REPO=localhost:5007',
    'GOMAXPROCS=4',
    'GOFLAGS=-p=4',
    'bash',
    'hack/install-ate-kind.sh',
    '--deploy-ate-system',
    '--deploy-demo-sandbox',
    '--rollout-timeout',
    '300s',
  ],
  substrate,
)

const bin = resolve(stateDir, 'bin')
await mkdir(bin, { recursive: true })

await run(
  [
    'env',
    'GOOS=linux',
    'GOARCH=arm64',
    'CGO_ENABLED=0',
    'GOMAXPROCS=4',
    'go',
    'build',
    '-p=4',
    '-trimpath',
    '-o',
    `${bin}/`,
    './cmd/ax-server',
    './cmd/ax-controller',
    './cmd/ax-task-runner',
  ],
  ax,
)

await Bun.write(resolve(stateDir, 'ax-task-runner'), Bun.file(resolve(bin, 'ax-task-runner')))

await run([
  'docker',
  'build',
  '-f',
  resolve(root, 'examples/ax/local/Dockerfile.ax'),
  '-t',
  'localhost:5007/looms-ax-control:f009cc8',
  bin,
])

await run(['docker', 'push', 'localhost:5007/looms-ax-control:f009cc8'])

for (const target of ['host', 'bridge', 'worker']) {
  console.log(`Building ${target}`)
  const image = `localhost:5007/looms-ax-${target}:dev`

  await run([
    'docker',
    'build',
    '-f',
    'examples/ax/Dockerfile',
    '--target',
    target,
    '-t',
    image,
    '.',
  ])

  await run(['docker', 'push', image])
}

console.log(await run(['bun', 'examples/ax/local/scripts/deploy.ts']))
