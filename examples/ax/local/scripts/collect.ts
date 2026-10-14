import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

import { assertCluster, kubectl, run, stateDir } from './cluster'

await assertCluster()
const output = resolve(stateDir, 'evidence')
await mkdir(output, { recursive: true })

for (const [file, args] of [
  ['nodes.txt', ['get', 'nodes', '-o', 'wide']],
  ['pods.txt', ['get', 'pods', '-A', '-o', 'wide']],
  [
    'images.txt',
    [
      'get',
      'pods',
      '-A',
      '-o',
      'custom-columns=NAMESPACE:.metadata.namespace,NAME:.metadata.name,IMAGE:.spec.containers[*].image,DIGEST:.status.containerStatuses[*].imageID',
    ],
  ],
  ['storage.txt', ['get', 'pvc', '-A']],
] as const) {
  await Bun.write(resolve(output, file), await run([...kubectl, ...args]))
}

const receipts = await run([
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
  '-At',
  '-c',
  `SELECT coalesce(json_agg(json_build_object('jobId', id, 'runId', document->'submission'->'task'->>'runId',
  'effectId', document->'submission'->'task'->>'effectId', 'attempt', document->'submission'->'task'->'attempt',
  'launched', document->'launched', 'stopped', document->'stopped', 'delivery', document->'delivery',
  'createdAt', document->'createdAt', 'outcomeDigest', document->'outcomeDigest')), '[]') FROM looms_ax_jobs`,
])

await Bun.write(resolve(output, 'receipts.json'), receipts)

await Bun.write(
  resolve(output, 'versions.json'),
  JSON.stringify(
    {
      ax: 'f009cc81c9a571073bc1dd58cd2ed934bf2d5b1c',
      substrate: '672533541dbfcd29084e4de2475267088bda3651',
      bun: '1.3.14',
      cluster: 'k3d-looms-ax',
      architecture: 'arm64',
      substrateOverlay:
        'kind-registry:5000 replaced with looms-ax-registry:5000; no Go source changes',
    },
    null,
    2,
  ),
)

console.log(`Saved sanitized status, immutable image references, and job receipts to ${output}`)
