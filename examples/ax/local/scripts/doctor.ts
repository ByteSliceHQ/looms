import { assertCluster, kubectl, run } from './cluster'

for (const binary of ['docker', 'kubectl', 'k3d', 'go', 'bun']) {
  console.log(`${binary}: ${Bun.which(binary) ?? 'MISSING'}`)
}

console.log(
  await run([
    'docker',
    'info',
    '--format',
    'Docker: {{.Architecture}}, {{.MemTotal}} bytes memory',
  ]),
)

await assertCluster()
console.log(await run([...kubectl, 'get', 'nodes', '-o', 'wide']))
console.log(await run([...kubectl, 'api-resources', '--api-group=certificates.k8s.io']))
console.log(await run([...kubectl, 'get', 'pods', '-A', '-o', 'wide']))
