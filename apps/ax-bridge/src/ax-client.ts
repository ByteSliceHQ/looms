// gRPC and credential-file I/O are transport boundaries around the Effect service.
/* oxlint-disable effecttsgo/async-function */
// Rotating gRPC credential files are read at the transport boundary.
// oxlint-disable-next-line effecttsgo/node-builtin-import
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  credentials,
  loadPackageDefinition,
  Metadata,
  status,
  type GrpcObject,
  type ClientUnaryCall,
  type ServiceError,
} from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'
import { Clock, Data, Effect } from 'effect'

import type { ProtoGrpcType as SubstrateProto } from './generated/ateapi'
import type { Actor__Output } from './generated/ateapi/Actor'
import type { ProtoGrpcType as AxProto } from './generated/ax'
import type { Task__Output } from './generated/ax/v1alpha1/Task'
import { type AxControl, type Job } from './model'

class RpcError extends Data.TaggedError('RpcError')<{
  readonly message: string
  readonly code: status
}> {}

function rpc<A>(
  start: (callback: (error: ServiceError | null, value?: A) => void) => ClientUnaryCall,
): Promise<A> {
  return Effect.runPromise(
    Effect.callback<A, RpcError>((resume) => {
      const call = start((error, value) => {
        if (error) {
          resume(Effect.fail(new RpcError({ message: error.message, code: error.code })))
        } else if (value === undefined) {
          resume(
            Effect.fail(new RpcError({ message: 'Missing gRPC response', code: status.INTERNAL })),
          )
        } else {
          resume(Effect.succeed(value))
        }
      })

      return Effect.sync(() => call.cancel())
    }),
  )
}

export interface AxClientOptions {
  readonly endpoint: string
  readonly atespace: string
  readonly workerEndpoint: string
  readonly substrateEndpoint: string
  readonly substrateCaFile: string
  readonly substrateTokenFile: string
  readonly substrateAuthority: string
  readonly axCaFile?: string
  readonly allowInsecureAx?: boolean
}

const deadline = () => ({ deadline: Effect.runSync(Clock.currentTimeMillis) + 10_000 })

export function createAxControl(options: AxClientOptions): AxControl & { close(): void } {
  const loaderOptions = { longs: String, enums: String, defaults: true, oneofs: true }

  // SAFETY: generated types and runtime descriptors come from the same pinned protobuf files.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const axDescriptor = loadPackageDefinition(
    loadSync(fileURLToPath(new URL('../proto/ax.proto', import.meta.url)), loaderOptions),
  ) as GrpcObject & AxProto

  // SAFETY: generated types and runtime descriptors come from the same pinned protobuf files.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const substrateDescriptor = loadPackageDefinition(
    loadSync(fileURLToPath(new URL('../proto/ateapi.proto', import.meta.url)), loaderOptions),
  ) as GrpcObject & SubstrateProto

  if (!options.axCaFile && !options.allowInsecureAx) {
    throw new Error('AX TLS CA required unless private-cluster plaintext is explicitly enabled')
  }

  const ax = new axDescriptor.ax.v1alpha1.AX(
    options.endpoint,
    options.axCaFile
      ? credentials.createSsl(readFileSync(options.axCaFile))
      : credentials.createInsecure(),
  )

  const substrate = new substrateDescriptor.ateapi.Control(
    options.substrateEndpoint,
    credentials.createSsl(readFileSync(options.substrateCaFile)),
    {
      'grpc.ssl_target_name_override': options.substrateAuthority,
      'grpc.default_authority': options.substrateAuthority,
    },
  )

  const ref = (job: Job) => ({ atespace: options.atespace, name: job.id })

  const metadata = () => {
    const value = new Metadata()
    value.set('authorization', `Bearer ${readFileSync(options.substrateTokenFile, 'utf8').trim()}`)
    return value
  }

  const getTask = (job: Job) =>
    rpc<Task__Output>((cb) => ax.getTask(ref(job), deadline(), cb)).catch((error: Error) => {
      if (error instanceof RpcError && error.code === status.NOT_FOUND) {
        return null
      }

      throw error
    })

  const getActor = (job: Job) =>
    rpc<Actor__Output>((cb) =>
      substrate.getActor({ actor: ref(job) }, metadata(), deadline(), cb),
    ).catch((error: Error) => {
      if (error instanceof RpcError && error.code === status.NOT_FOUND) {
        return null
      }

      throw error
    })

  return {
    ready: async (job) => {
      const task = await getTask(job)
      const actor = await getActor(job)

      return (
        task?.status?.phase === 'Running' &&
        actor?.status?.state === 'ACTOR_STATE_RUNNING' &&
        task.status.conditions.some(
          (condition) => condition.type === 'GatewayReady' && condition.status === 'True',
        )
      )
    },
    ensure: async (job, token) => {
      const existing = await getTask(job)

      if (existing) {
        if (
          existing.spec?.image !== job.profile.image ||
          existing.status?.phase === 'Terminating' ||
          JSON.stringify(existing.spec.command) !== JSON.stringify(job.profile.command) ||
          existing.spec.gateway?.name !== job.profile.gateway ||
          existing.spec.debug ||
          existing.spec.env.find((entry) => entry.name === 'LOOMS_AX_JOB_ID')?.value !== job.id ||
          existing.spec.env.find((entry) => entry.name === 'LOOMS_AX_CAPABILITY')?.value !==
            token ||
          existing.spec.env.find((entry) => entry.name === 'LOOMS_AX_ENDPOINT')?.value !==
            options.workerEndpoint
        ) {
          throw new Error('AX identity is occupied by a conflicting or terminating task')
        }

        return
      }

      await rpc((cb) =>
        ax.updateTask(
          {
            task: {
              apiVersion: 'ax/v1alpha1',
              kind: 'Task',
              metadata: ref(job),
              spec: {
                image: job.profile.image,
                command: [...job.profile.command],
                gateway: { name: job.profile.gateway },
                debug: false,
                env: [
                  { name: 'LOOMS_AX_ENDPOINT', value: options.workerEndpoint },
                  { name: 'LOOMS_AX_JOB_ID', value: job.id },
                  { name: 'LOOMS_AX_CAPABILITY', value: token },
                ],
              },
            },
          },
          deadline(),
          cb,
        ),
      )
    },
    stop: async (job) => {
      const task = await getTask(job)

      if (task) {
        await rpc((cb) => ax.deleteTask(ref(job), deadline(), cb))
      }

      const actor = await getActor(job)

      // Deleting AX state alone is insufficient: Substrate deletion is asynchronous.
      if (actor) {
        await rpc((cb) =>
          substrate.deleteActor({ actor: ref(job), anyState: true }, metadata(), deadline(), cb),
        )

        return false
      }

      return (await getTask(job)) === null
    },
    close: () => {
      ax.close()
      substrate.close()
    },
  }
}
