import { unlink } from 'node:fs/promises'
import { resolve } from 'node:path'

import { assertCluster, run, stateDir } from './cluster'

await assertCluster()

if (process.argv.includes('--destroy')) {
  await run(['k3d', 'cluster', 'delete', 'looms-ax'])
  await unlink(resolve(stateDir, 'cluster-uid'))

  if (process.argv.includes('--purge-data')) {
    await run(['docker', 'volume', 'rm', 'looms-ax-sandbox'])
  }

  console.log(
    'Deleted only the owned looms-ax cluster. Evidence and credentials retained in .ax-local.',
  )
} else {
  await run(['k3d', 'cluster', 'stop', 'looms-ax'])
  console.log('Stopped looms-ax; data retained. Use ax:local:up to restart.')
}
