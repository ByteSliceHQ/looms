import { Effect, Option, Stream } from 'effect'

export interface S2ReadBatchLike<T> {
  readonly records: ReadonlyArray<T>
  readonly tail?: { readonly seqNum: number } | null
}

export interface ReadAllPagesOptions {
  readonly fromSeq?: number
  readonly limit?: number
  readonly maxPageSize?: number
}

export function paginateS2Stream<T extends { readonly seqNum: number }, E>(
  fetchPage: (cursor: number, count: number) => Effect.Effect<S2ReadBatchLike<T> | null, E>,
  options?: ReadAllPagesOptions,
): Stream.Stream<T, E> {
  const fromSeq = options?.fromSeq ?? 0
  const userLimit = options?.limit
  const maxPageSize = options?.maxPageSize ?? 1000

  if (userLimit !== undefined && userLimit <= 0) {
    return Stream.empty
  }

  interface PaginatorState {
    readonly cursor: number
    readonly remaining?: number
  }

  const baseStream = Stream.paginate<PaginatorState, T, E>(
    { cursor: fromSeq, remaining: userLimit },
    (state) =>
      Effect.gen(function* () {
        if (state.remaining !== undefined && state.remaining <= 0) {
          return [[], Option.none()] as const
        }

        const count =
          state.remaining !== undefined ? Math.min(maxPageSize, state.remaining) : maxPageSize

        const page = yield* fetchPage(state.cursor, count)

        if (!page || page.records.length === 0) {
          return [[], Option.none()] as const
        }

        const records = page.records.filter((record) => record.seqNum >= fromSeq)

        const nextRemaining =
          state.remaining !== undefined ? state.remaining - records.length : undefined

        const lastRecord = page.records[page.records.length - 1]

        if (!lastRecord || (nextRemaining !== undefined && nextRemaining <= 0)) {
          return [records, Option.none()] as const
        }

        const nextCursor = Math.max(state.cursor + 1, lastRecord.seqNum + 1)

        if (nextCursor <= state.cursor) {
          return [records, Option.none()] as const
        }

        // Byte-capped pages can be shorter than requested while more records remain.
        const shortPage = page.records.length < count

        const reachedTail =
          !shortPage && page.tail?.seqNum !== undefined && nextCursor >= page.tail.seqNum

        return reachedTail
          ? [records, Option.none()]
          : [records, Option.some({ cursor: nextCursor, remaining: nextRemaining })]
      }),
  )

  return userLimit !== undefined ? baseStream.pipe(Stream.take(userLimit)) : baseStream
}
