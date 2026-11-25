import { describe, expect, test } from 'bun:test'

import { BoardError, channelMatches, parseMentions } from './board'
import { boardConformance } from './conformance'
import { createMemoryBoard } from './memory-board'
import { answerBoardCall, boardHandler, remoteBoard } from './remote-board'

describe('message board', () => {
  test('the memory board keeps the board contract', async () => {
    expect(await boardConformance((clock) => createMemoryBoard(clock))).toEqual([])
  })

  test('conformance reports a board that breaks the contract', async () => {
    const failures = await boardConformance((clock) => {
      const board = createMemoryBoard(clock)

      // A board that hands a held task to a second member.
      return {
        ...board,
        claim: (input) =>
          board.claim(input).catch(() =>
            board.tasks().then((tasks) => {
              const task = tasks[0]

              return task ? { task, token: 'forged', until: clock.now() } : null
            }),
          ),
      }
    })

    expect(failures.some((failure) => failure.startsWith('only one claim holds a task'))).toBe(true)
  })

  test('mentions ignore email addresses and repeat names once', () => {
    expect(parseMentions('mail dana@example.com, then @triage and (@Fixer) @triage')).toEqual([
      'triage',
      'fixer',
    ])
  })

  test('a trailing slash selects a channel subtree', () => {
    expect(channelMatches('support', 'support')).toBe(true)
    expect(channelMatches('support', 'support/billing')).toBe(false)
    expect(channelMatches('support/', 'support')).toBe(true)
    expect(channelMatches('support/', 'support/billing')).toBe(true)
    expect(channelMatches('support/', 'supportive')).toBe(false)
  })
})

function served(clock: { now: () => number }) {
  const board = createMemoryBoard(clock)

  return remoteBoard({ url: 'http://board.test/', fetch: boardHandler(() => board) })
}

describe('remote board', () => {
  test('a board served over HTTP keeps the board contract', async () => {
    expect(await boardConformance(served)).toEqual([])
  })

  test('input the board cannot read is refused, not a fault', async () => {
    const reply = await answerBoardCall(createMemoryBoard(), { method: 'post', input: { by: 1 } })

    expect(reply).toEqual({ ok: false, code: 'invalid_input', message: 'Invalid input for "post"' })

    expect(await answerBoardCall(createMemoryBoard(), { method: 'drop', input: {} })).toMatchObject(
      { ok: false, code: 'invalid_input' },
    )
  })

  test('a resolver that denies the board refuses the call', async () => {
    const board = remoteBoard({
      url: 'http://board.test/',
      fetch: boardHandler(() => {
        throw new BoardError({ code: 'board_denied', message: 'Not your board' })
      }),
    })

    const code = await board.tasks().then(
      () => 'answered',
      (error: BoardError) => error.code,
    )

    expect(code).toBe('board_denied')
  })

  test('a board that faults is a fault for the caller, with headers sent on every call', async () => {
    const seen: (string | null)[] = []

    const board = remoteBoard({
      url: 'http://board.test/',
      headers: () => ({ authorization: 'Bearer t' }),
      fetch: (request) => {
        seen.push(request.headers.get('authorization'))

        return boardHandler(() => ({
          ...createMemoryBoard(),
          tasks: () => Promise.reject(new Error('store down')),
        }))(request)
      },
    })

    const failure = await board.tasks().then(
      () => 'answered',
      (error: Error) => error.message,
    )

    expect(failure).toBe('The board answered 500 to "tasks"')
    expect(seen).toEqual(['Bearer t'])
  })
})
