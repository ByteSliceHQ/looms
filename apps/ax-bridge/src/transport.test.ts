import { expect, test } from 'bun:test'
import { fileURLToPath } from 'node:url'

import {
  credentials,
  loadPackageDefinition,
  Server,
  ServerCredentials,
  status,
  type GrpcObject,
  type ServiceError,
} from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'

import type { ProtoGrpcType } from './generated/ax'
import type { AXHandlers } from './generated/ax/v1alpha1/AX'

// SAFETY: the runtime descriptor and generated types use the same checked-in protobuf.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const descriptor = loadPackageDefinition(
  loadSync(fileURLToPath(new URL('../proto/ax.proto', import.meta.url)), {
    defaults: true,
    longs: String,
    enums: String,
    oneofs: true,
  }),
) as GrpcObject & ProtoGrpcType

test('gRPC transport supports unary, streaming, deadlines and stream cancellation', async () => {
  const server = new Server()

  const handlers: Pick<AXHandlers, 'GetTask' | 'WatchTask'> = {
    GetTask: (call, callback) => {
      if (call.request.name !== 'hang') {
        callback(null, { metadata: { atespace: call.request.atespace, name: call.request.name } })
      }
    },
    WatchTask: (call) => {
      call.write({
        action: 'INITIAL',
        task: { metadata: { atespace: call.request.atespace, name: call.request.name } },
      })
    },
  }

  server.addService(descriptor.ax.v1alpha1.AX.service, handlers)

  const port = await new Promise<number>((resolve, reject) =>
    server.bindAsync('127.0.0.1:0', ServerCredentials.createInsecure(), (error, assigned) =>
      error ? reject(error) : resolve(assigned),
    ),
  )

  const client = new descriptor.ax.v1alpha1.AX(`127.0.0.1:${port}`, credentials.createInsecure())

  try {
    const name = await new Promise<string>((resolve, reject) =>
      client.getTask(
        { atespace: 'test', name: 'fixture' },
        { deadline: Date.now() + 5_000 },
        (error, task) => (error ? reject(error) : resolve(task?.metadata?.name ?? '')),
      ),
    )

    expect(name).toBe('fixture')

    const deadline = await new Promise<number>((resolve) =>
      client.getTask({ atespace: 'test', name: 'hang' }, { deadline: Date.now() + 50 }, (error) =>
        resolve(error?.code ?? 0),
      ),
    )

    expect(deadline).toBe(status.DEADLINE_EXCEEDED)
    const actions: string[] = []

    const stream = client.watchTask(
      { atespace: 'test', name: 'fixture' },
      { deadline: Date.now() + 5_000 },
    )

    const cancellation = await new Promise<number>((resolve) => {
      stream.on('data', (event: { action: string }) => {
        actions.push(event.action)
        stream.cancel()
      })

      stream.on('error', (error: ServiceError) => resolve(error.code))
    })

    expect(actions).toEqual(['INITIAL'])
    expect(cancellation).toBe(status.CANCELLED)
  } finally {
    client.close()
    server.forceShutdown()
  }
})
