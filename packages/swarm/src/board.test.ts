import { describe, expect, test } from 'bun:test'

import { channelMatches, parseMentions } from './board'
import { boardConformance } from './conformance'
import { createMemoryBoard } from './memory-board'

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
