import { resolve } from 'node:path'

export const root = resolve(import.meta.dirname, '../../../..')
export const stateDir = resolve(root, '.ax-local')
export const kubeconfig = process.env.AX_KUBECONFIG ?? resolve(stateDir, 'kubeconfig')
export const kubectl = ['kubectl', `--kubeconfig=${kubeconfig}`, '--context=k3d-looms-ax']

export async function run(args: readonly string[], cwd = root, input?: string): Promise<string> {
  const child = Bun.spawn([...args], {
    cwd,
    stdin: input ? new Blob([input]) : 'ignore',
    stdout: 'pipe',
    stderr: 'inherit',
  })

  const output = await new Response(child.stdout).text()

  if ((await child.exited) !== 0) {
    throw new Error(`Command failed: ${args[0]} ${args[1]}`)
  }

  return output.trim()
}

export async function assertCluster(): Promise<void> {
  const expected = (await Bun.file(resolve(stateDir, 'cluster-uid')).text()).trim()

  const actual = await run([
    ...kubectl,
    'get',
    'namespace',
    'kube-system',
    '-o',
    'jsonpath={.metadata.uid}',
  ])

  const node = await run([...kubectl, 'get', 'node', 'k3d-looms-ax-server-0', '-o', 'name'])

  if (!expected || actual !== expected || node !== 'node/k3d-looms-ax-server-0') {
    throw new Error('Cluster ownership differs from .ax-local/cluster-uid; refusing mutation')
  }
}

export async function assertBridgeIdle(): Promise<void> {
  const pending = await run([
    ...kubectl,
    '-n',
    'looms-ax-test',
    'exec',
    'deployment/bridge-postgres',
    '--',
    'psql',
    '-U',
    'looms',
    '-d',
    'looms',
    '-Atc',
    "SELECT count(*) FROM looms_ax_jobs WHERE document->>'stopped' = 'false' OR document->>'delivery' IN ('pending', 'uncertain')",
  ])

  if (pending !== '0') {
    throw new Error('Finish pending AX jobs before changing the fixture callback target')
  }
}
