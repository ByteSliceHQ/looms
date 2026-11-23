import { Context, Data, Effect, Layer } from 'effect'

import type { DefinitionStore } from '@looms/core'

import { BoardError, type BoardResolver, type MessageBoard } from './board'
import type { SwarmDefinition } from './definitions'
import { createMemoryBoard } from './memory-board'

export type SwarmDefinitionStore = DefinitionStore<SwarmDefinition>

export class SwarmDefinitionsTag extends Context.Service<
  SwarmDefinitionsTag,
  SwarmDefinitionStore
>()('looms/SwarmDefinitions') {}

/** The board could not be reached or threw something other than a refusal. Retried. */
export class BoardFaultError extends Data.TaggedError('BoardFaultError')<{
  readonly message: string
  readonly cause: unknown
}> {}

export interface Boards {
  /** Run one call against a board. Refusals fail with `BoardError`, faults with `BoardFaultError`. */
  readonly call: <A>(
    boardId: string,
    run: (board: MessageBoard) => Promise<A>,
  ) => Effect.Effect<A, BoardError | BoardFaultError>
}

export class BoardsTag extends Context.Service<BoardsTag, Boards>()('looms/SwarmBoards') {}

function fault(cause: unknown): BoardError | BoardFaultError {
  return cause instanceof BoardError
    ? cause
    : new BoardFaultError({
        message: cause instanceof Error ? cause.message : String(cause),
        cause,
      })
}

export function makeBoards(resolve: BoardResolver): Boards {
  return {
    call: (boardId, run) =>
      Effect.tryPromise({
        try: () => Promise.resolve(resolve(boardId)).then(run),
        catch: fault,
      }),
  }
}

/** One in-memory board per id, created on first use. */
export function memoryBoards(): BoardResolver {
  const boards = new Map<string, MessageBoard>()

  return (boardId) => {
    const existing = boards.get(boardId)

    if (existing) {
      return existing
    }

    const created = createMemoryBoard()

    boards.set(boardId, created)

    return created
  }
}

export const SwarmServicesLive = (definitions: SwarmDefinitionStore, boards: BoardResolver) =>
  Layer.merge(
    Layer.succeed(SwarmDefinitionsTag, definitions),
    Layer.succeed(BoardsTag, makeBoards(boards)),
  )
