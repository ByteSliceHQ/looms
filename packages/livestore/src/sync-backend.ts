import {
  ServerAheadError,
  SyncBackend,
  UnknownError,
} from '@livestore/common'
import type { EventSequenceNumber, LiveStoreEvent } from '@livestore/common/schema'
import {
  Effect,
  Filter,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
  Option,
  Predicate,
  Schedule,
  Schema,
  Stream,
  SubscriptionRef,
} from '@livestore/utils/effect'
import type { JsonValue } from '@looms/core'
import { Sse } from 'effect/unstable/encoding'

export interface LoomsSyncBackendOptions {
  readonly endpoint?: string
  readonly ping?: {
    readonly enabled?: boolean
    readonly requestTimeout?: number
    readonly requestInterval?: number
  }
  readonly retry?: {
    readonly pull?: Schedule.Schedule<number, UnknownError>
    readonly push?: Schedule.Schedule<number, UnknownError>
  }
}

export const defaultRetry = Schedule.recurs(2).pipe(Schedule.addDelay(() => Effect.succeed(100)))

function computeNextCursor(
  lastItem: Option.Option<SyncBackend.PullResItem<Schema.Json>>,
  current: Option.Option<{
    eventSequenceNumber: EventSequenceNumber.Global.Type
    metadata: Option.Option<Schema.Json>
  }>,
) {
  return lastItem.pipe(
    Option.flatMap((item) => {
      const lastBatchItem = item.batch.at(-1)
      if (!lastBatchItem) return Option.none()
      return Option.some({
        eventSequenceNumber: lastBatchItem.eventEncoded.seqNum,
        metadata: lastBatchItem.metadata,
      })
    }),
    Option.orElse(() => current),
  )
}

export const createLoomsSyncBackend =
  ({
    endpoint = '/api/livestore',
    ping: pingOptions,
    retry,
  }: LoomsSyncBackendOptions = {}): SyncBackend.SyncBackendConstructor<Schema.Json> =>
  ({ storeId }) =>
    Effect.gen(function* () {
      const isConnected = yield* SubscriptionRef.make(false)
      const pullEndpoint = endpoint
      const pushEndpoint = endpoint
      const pingEndpoint = endpoint

      const httpClient = yield* HttpClient.HttpClient
      const pingTimeout = pingOptions?.requestTimeout ?? 10_000

      const ping: SyncBackend.SyncBackend<Schema.Json>['ping'] = Effect.gen(function* () {
        yield* httpClient.pipe(HttpClient.filterStatusOk).head(pingEndpoint)
        yield* SubscriptionRef.set(isConnected, true)
      }).pipe(
        UnknownError.mapToUnknownError,
        Effect.timeout(pingTimeout),
        Effect.catchTag('TimeoutError', () => SubscriptionRef.set(isConnected, false)),
      )

      const pingInterval = pingOptions?.requestInterval ?? 10_000
      if (pingOptions?.enabled !== false) {
        yield* ping.pipe(
          Effect.repeat(Schedule.spaced(pingInterval)),
          Effect.tapCauseLogPretty,
          Effect.forkScoped,
        )
      }

      const runPullSse = (
        cursor: Option.Option<{
          eventSequenceNumber: EventSequenceNumber.Global.Type
          metadata: Option.Option<Schema.Json>
        }>,
        live: boolean,
      ): Stream.Stream<SyncBackend.PullResItem<Schema.Json>, UnknownError> => {
        const fromSeq = Option.isSome(cursor) ? cursor.value.eventSequenceNumber : 0

        const url = `${pullEndpoint}?storeId=${encodeURIComponent(storeId)}&cursor=${fromSeq}${live ? '&live=1' : ''}`

        return httpClient
          .execute(
            HttpClientRequest.get(url).pipe(
              HttpClientRequest.setHeaders({ accept: 'text/event-stream' }),
            ),
          )
          .pipe(
            HttpClientResponse.stream,
            Stream.decodeText({ encoding: 'utf8' }),
            Stream.pipeThroughChannel(Sse.decode()),
            Stream.mapEffect(
              Effect.fnUntraced(function* (msg) {
                const evt = msg.event.toLowerCase()
                if (evt === 'ping') return Option.none()
                if (evt === 'error') {
                  return yield* Effect.fail(
                    new UnknownError({
                      cause: new Error(`SSE error: ${msg.data}`),
                    }),
                  )
                }
                if (evt === 'batch') {
                  const parsed = yield* Schema.decodeEffect(
                    Schema.fromJsonString(
                      Schema.Struct({
                        batch: Schema.Array(Schema.Unknown),
                        head: Schema.optional(Schema.Number),
                      }),
                    ),
                  )(msg.data).pipe(
                    Effect.mapError(
                      (cause) => new UnknownError({ cause }),
                    ),
                  )

                  const items: Array<{
                    eventEncoded: LiveStoreEvent.Global.Encoded
                    metadata: Option.Option<Schema.Json>
                  }> = []

                  for (const item of parsed.batch) {
                    // SAFETY: batch elements are encoded LiveStore events.
                    items.push({
                      eventEncoded: item as LiveStoreEvent.Global.Encoded,
                      metadata: Option.none(),
                    })
                  }

                  const resItem: SyncBackend.PullResItem<Schema.Json> = {
                    batch: items,
                    pageInfo: SyncBackend.pageInfoNoMore,
                  }
                  return Option.some(resItem)
                }
                if (evt === 'message' && msg.data === '[DONE]') {
                  return Option.none()
                }
                return Option.none()
              }),
            ),
            Stream.filterMap(Filter.fromPredicateOption((item) => item)),
            Stream.mapError((cause) =>
              cause instanceof UnknownError ? cause : new UnknownError({ cause }),
            ),
            Stream.retry(retry?.pull ?? defaultRetry),
          )
      }

      const ssePull = (
        startCursor: Option.Option<{
          eventSequenceNumber: EventSequenceNumber.Global.Type
          metadata: Option.Option<Schema.Json>
        }>,
      ): Stream.Stream<SyncBackend.PullResItem<Schema.Json>, UnknownError> => {
        const loop = (
          cursor: Option.Option<{
            eventSequenceNumber: EventSequenceNumber.Global.Type
            metadata: Option.Option<Schema.Json>
          }>,
          isFirst: boolean,
        ): Stream.Stream<SyncBackend.PullResItem<Schema.Json>, UnknownError> => {
          const sseStream = (live: boolean) =>
            runPullSse(cursor, live).pipe(
              Stream.emitIfEmpty({
                // SAFETY: empty pull result matches PullResItem shape.
                batch: [] as any,
                pageInfo: SyncBackend.pageInfoNoMore,
              }),
            )

          const stream = isFirst ? sseStream(false) : sseStream(true)

          return stream.pipe(
            Stream.concatWithLastElement((lastItem) =>
              loop(computeNextCursor(lastItem, cursor), false),
            ),
          )
        }

        return loop(startCursor, true)
      }

      const runPullHttp = (
        cursor: Option.Option<{
          eventSequenceNumber: EventSequenceNumber.Global.Type
          metadata: Option.Option<Schema.Json>
        }>,
      ): Stream.Stream<SyncBackend.PullResItem<Schema.Json>, UnknownError> => {
        const fromSeq = Option.isSome(cursor) ? cursor.value.eventSequenceNumber : 0
        const url = `${pullEndpoint}?storeId=${encodeURIComponent(storeId)}&cursor=${fromSeq}`

        return Stream.fromEffect(
          Effect.gen(function* () {
            const res = yield* httpClient.execute(HttpClientRequest.get(url)).pipe(
              Effect.mapError((cause) => new UnknownError({ cause })),
              Effect.retry(retry?.pull ?? defaultRetry),
            )
            const jsonBody = yield* res.json.pipe(
              Effect.mapError((cause) => new UnknownError({ cause })),
            )
            // SAFETY: jsonBody verified to be a JSON object.
            const record: Record<string, JsonValue> = Predicate.isReadonlyObject(jsonBody)
              ? (jsonBody as Record<string, JsonValue>)
              : {}
            const rawBatch = Array.isArray(record.batch) ? record.batch : []
            const items: Array<{
              eventEncoded: LiveStoreEvent.Global.Encoded
              metadata: Option.Option<Schema.Json>
            }> = []
            for (const item of rawBatch) {
              // SAFETY: rawBatch items are encoded LiveStore global events.
              items.push({
                eventEncoded: item as LiveStoreEvent.Global.Encoded,
                metadata: Option.none(),
              })
            }
            const resItem: SyncBackend.PullResItem<Schema.Json> = {
              batch: items,
              pageInfo: SyncBackend.pageInfoNoMore,
            }
            return resItem
          }),
        )
      }

      const push: SyncBackend.SyncBackend<Schema.Json>['push'] = (batch) =>
        Effect.gen(function* () {
          const res = yield* httpClient.execute(
            HttpClientRequest.post(pushEndpoint).pipe(
              HttpClientRequest.setHeaders({ 'content-type': 'application/json' }),
              HttpClientRequest.bodyText(
                JSON.stringify({
                  storeId,
                  batch,
                }),
              ),
            ),
          ).pipe(
            Effect.mapError((cause) => new UnknownError({ cause })),
            Effect.retry(retry?.push ?? defaultRetry),
          )

          if (res.status === 409) {
            const body = yield* res.json.pipe(
              Effect.orElseSucceed(() => ({})),
            )
            // SAFETY: 409 response JSON body verified to be an object.
            const parsed: Record<string, JsonValue> = Predicate.isReadonlyObject(body)
              ? (body as Record<string, JsonValue>)
              : {}
            // SAFETY: LiveStore sequence numbers are integers branded as GlobalEventSequenceNumber.
            const minimumExpectedNum = (
              Predicate.isNumber(parsed.minimumExpectedNum)
                ? parsed.minimumExpectedNum
                : (Predicate.isNumber(parsed.head) ? parsed.head : 0)
            ) as any
            // SAFETY: LiveStore sequence numbers are integers branded as GlobalEventSequenceNumber.
            const providedNum = (
              Predicate.isNumber(parsed.providedNum)
                ? parsed.providedNum
                : (batch[0]?.seqNum ?? 0)
            ) as any

            return yield* Effect.fail(
              new ServerAheadError({
                minimumExpectedNum,
                providedNum,
              }),
            )
          }

          if (res.status < 200 || res.status >= 300) {
            return yield* Effect.fail(
              new UnknownError({
                cause: new Error(`Push failed with HTTP ${res.status}`),
              }),
            )
          }
        })

      return SyncBackend.of({
        connect: Effect.void,
        pull: (cursor, options) => {
          if (options?.live === true) {
            return ssePull(cursor)
          }
          return runPullHttp(cursor)
        },
        push,
        ping,
        isConnected,
        metadata: {
          name: '@looms/livestore',
          description: 'Looms LiveStore sync backend',
          protocol: 'http',
          endpoint,
        },
        supports: {
          pullPageInfoKnown: false,
          pullLive: true,
        },
      })
    })
