import { fileURLToPath } from 'node:url'

import { credentials, loadPackageDefinition, type GrpcObject } from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'
import { Clock, Effect } from 'effect'

import type { ProtoGrpcType } from '../src/generated/ax'

// SAFETY: this descriptor is generated from the pinned proto loaded on this line.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const descriptor = loadPackageDefinition(
  loadSync(fileURLToPath(new URL('../proto/ax.proto', import.meta.url))),
) as GrpcObject & ProtoGrpcType

const client = new descriptor.ax.v1alpha1.AX(
  process.env.AX_ENDPOINT ?? 'ax-server.ax-system.svc:8080',
  credentials.createInsecure(),
)

await Effect.runPromise(
  Effect.callback<void, Error>((resume) => {
    client.updateGateway(
      {
        gateway: {
          apiVersion: 'ax/v1alpha1',
          kind: 'Gateway',
          metadata: { atespace: 'looms-ax-test', name: 'looms-fixture' },
          spec: {
            egress: {
              allowlist: {
                hosts: [{ host: 'ax-bridge.looms-ax-test.svc.cluster.local', port: 8789 }],
              },
            },
          },
        },
      },
      { deadline: Effect.runSync(Clock.currentTimeMillis) + 10_000 },
      (error) => resume(error ? Effect.fail(error) : Effect.void),
    )
  }),
)

client.close()
