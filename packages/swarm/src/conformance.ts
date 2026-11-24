import type { Attachment } from '@looms/agent'

import {
  BOARD_ACTOR,
  BoardError,
  MAX_ATTACHMENTS,
  TASK_LABEL,
  type BoardErrorCode,
  type MessageBoard,
} from './board'

/** A clock the suite advances to expire leases. A board under test must read time from it. */
export interface ConformanceClock {
  readonly now: () => number
}

type Check = (board: MessageBoard, advance: (ms: number) => void) => Promise<void>

class Mismatch extends Error {}

function expect(condition: boolean, message: string): void {
  if (!condition) {
    throw new Mismatch(message)
  }
}

async function refused(attempt: Promise<unknown>, code: BoardErrorCode): Promise<void> {
  try {
    await attempt
  } catch (error) {
    if (!(error instanceof BoardError)) {
      throw new Mismatch(`expected a BoardError with code "${code}", got ${String(error)}`)
    }

    expect(error.code === code, `expected code "${code}", got "${error.code}"`)

    return
  }

  throw new Mismatch(`expected a BoardError with code "${code}", but the call succeeded`)
}

function sameFiles(
  actual: readonly Attachment[] | undefined,
  expected: readonly Attachment[],
): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected)
}

const checks = {
  'a post is read back with its mentions': async (board) => {
    const posted = await board.post({ by: 'ada', channel: 'ops', text: 'ping @Bo and @cy, @bo' })
    const read = await board.messages({ channel: 'ops' })

    expect(read.length === 1 && read[0]?.id === posted.id, 'the post was not read back')
    expect(posted.re === null, 'a post must be a thread root')
    expect(posted.mentions.join(',') === 'bo,cy', `mentions were "${posted.mentions.join(',')}"`)
  },

  'a post is idempotent on its key': async (board) => {
    const first = await board.post({ by: 'ada', channel: 'ops', text: 'once', key: 'key-1' })
    const again = await board.post({ by: 'ada', channel: 'ops', text: 'twice', key: 'key-1' })
    const page = await board.events()

    expect(again.id === first.id && again.text === 'once', 'the retry did not return the original')
    expect(page.events.length === 1, 'the retry wrote a second event')

    await refused(
      board.post({ by: 'ada', channel: 'dev', text: 'x', key: 'key-1' }),
      'duplicate_key',
    )
  },

  'a reply attaches to the root of its thread': async (board) => {
    const root = await board.post({ by: 'ada', channel: 'ops', text: 'root' })
    const first = await board.reply({ by: 'bo', to: root.id, text: 'one' })
    const second = await board.reply({ by: 'cy', to: first.id, text: 'two' })
    const thread = await board.messages({ thread: root.id })

    expect(second.re === root.id, 'a reply to a reply must attach to the root')
    expect(second.channel === 'ops', 'a reply must take the channel of its thread')
    expect(thread.map((item) => item.text).join(',') === 'root,one,two', 'thread order is wrong')
    await refused(board.reply({ by: 'bo', to: 'missing', text: 'x' }), 'message_not_found')
  },

  'a channel filter ending in a slash selects the subtree': async (board) => {
    await board.post({ by: 'ada', channel: 'ops', text: 'a' })
    await board.post({ by: 'ada', channel: 'ops/db', text: 'b' })
    await board.post({ by: 'ada', channel: 'opsx', text: 'c' })

    const exact = await board.messages({ channel: 'ops' })
    const subtree = await board.messages({ channel: 'ops/' })

    expect(exact.length === 1, 'an exact filter matched other channels')
    expect(subtree.map((item) => item.text).join(',') === 'a,b', 'the subtree filter is wrong')
  },

  'messages page forward from a message id': async (board) => {
    const first = await board.post({ by: 'ada', channel: 'ops', text: '1' })

    await board.post({ by: 'ada', channel: 'ops', text: '2' })
    await board.post({ by: 'ada', channel: 'ops', text: '3' })

    const latest = await board.messages({ channel: 'ops', limit: 2 })
    const after = await board.messages({ channel: 'ops', after: first.id, limit: 1 })

    expect(latest.map((item) => item.text).join(',') === '2,3', 'limit must keep the latest')
    expect(after.map((item) => item.text).join(',') === '2', 'after must page forward')
  },

  'attachments are read back with their message': async (board) => {
    const shot = { id: 'files/1', mediaType: 'image/png', name: 'login.png', size: 2_048 }
    const clip = { id: 'files/2', mediaType: 'video/mp4', url: 'https://files.example/2' }

    const root = await board.post({
      by: 'ada',
      channel: 'ops',
      text: 'see these',
      attachments: [shot, clip],
    })

    const reply = await board.reply({
      by: 'bo',
      to: root.id,
      text: 'and this',
      attachments: [clip],
    })

    const plain = await board.reply({ by: 'bo', to: root.id, text: 'no files' })

    const task = await board.createTask({
      by: 'ada',
      channel: 'ops',
      text: 'fix',
      attachments: [shot],
    })

    const [read] = await board.messages({ id: root.id })
    const [taskRoot] = await board.messages({ id: task.id })
    const page = await board.events()
    const created = page.events.find((event) => event.type === 'task.created')

    expect(
      sameFiles(root.attachments, [shot, clip]),
      'a post did not return its attachments in order',
    )

    expect(
      sameFiles(read?.attachments, [shot, clip]),
      'a post was not read back with its attachments',
    )

    expect(sameFiles(reply.attachments, [clip]), 'a reply did not keep its attachments')
    expect(sameFiles(plain.attachments, []), 'a message without files must have an empty list')
    expect(sameFiles(taskRoot?.attachments, [shot]), "a task's root message lost its attachments")
    expect(sameFiles(created?.message?.attachments, [shot]), 'task.created lost the attachments')

    await refused(
      board.post({
        by: 'ada',
        channel: 'ops',
        text: 'too many',
        attachments: Array.from({ length: MAX_ATTACHMENTS + 1 }, (_, index) => ({
          id: `files/many-${index}`,
          mediaType: 'image/png',
        })),
      }),
      'invalid_input',
    )
  },

  'a message is read by its id': async (board) => {
    const root = await board.post({ by: 'ada', channel: 'ops', text: 'root' })
    const reply = await board.reply({ by: 'bo', to: root.id, text: 'reply' })
    const one = await board.messages({ id: reply.id })
    const none = await board.messages({ id: 'missing' })

    expect(one.length === 1 && one[0]?.text === 'reply', 'a reply was not read by its id')
    expect(none.length === 0, 'an unknown id must match nothing')
  },

  'labels compare and set': async (board) => {
    const message = await board.post({ by: 'ada', channel: 'ops', text: 'x' })

    await board.label({ by: 'ada', message: message.id, set: { state: 'open' } })

    await refused(
      board.label({ by: 'bo', message: message.id, set: { state: 'mine' }, if: { state: null } }),
      'label_conflict',
    )

    const moved = await board.label({
      by: 'bo',
      message: message.id,
      set: { state: 'done' },
      if: { state: 'open' },
    })

    const cleared = await board.label({ by: 'bo', message: message.id, unset: ['state'] })

    expect(moved.labels.state === 'done', 'a matching precondition must apply the change')
    expect(cleared.labels.state === undefined, 'unset must remove the label')

    await refused(
      board.label({ by: 'bo', message: message.id, set: { [TASK_LABEL]: 'ready' } }),
      'reserved_label',
    )
  },

  'the event log is ordered and resumes from a cursor': async (board) => {
    await board.post({ by: 'ada', channel: 'ops', text: '1' })
    await board.post({ by: 'ada', channel: 'ops', text: '2' })
    await board.post({ by: 'ada', channel: 'ops', text: '3' })

    const first = await board.events({ limit: 2 })
    const rest = await board.events({ after: first.cursor ?? undefined })
    const idle = await board.events({ after: rest.cursor ?? undefined })

    expect(first.events.length === 2 && first.more, 'a short page must report more')
    expect(rest.events.length === 1 && !rest.more, 'the second page must finish the log')
    expect(rest.events[0]?.message?.text === '3', 'the cursor did not resume after the page')
    expect(idle.events.length === 0, 'an idle read must return no events')
    expect(idle.cursor === rest.cursor, 'an idle read must return the cursor it was given')
  },

  'a task is a thread that carries its state as a label': async (board) => {
    const task = await board.createTask({ by: 'ada', channel: 'ops', text: 'rotate keys' })
    const root = await board.messages({ thread: task.id })
    const page = await board.events()

    expect(task.state === 'ready', 'a task with no needs must start ready')
    expect(root[0]?.labels[TASK_LABEL] === 'ready', 'the root message must carry the task label')
    expect(page.events[0]?.type === 'task.created', 'creating a task must log task.created')
    expect(page.events[0]?.message?.id === task.id, 'task.created must carry the root message')
  },

  'only one claim holds a task': async (board) => {
    const task = await board.createTask({ by: 'ada', channel: 'ops', text: 'x' })
    const claim = await board.claim({ by: 'bo', task: task.id })

    expect(claim?.task.holder === 'bo', 'the claim must name its holder')
    expect(claim?.task.state === 'claimed', 'a claimed task must be in state claimed')
    await refused(board.claim({ by: 'cy', task: task.id }), 'task_claimed')

    const queued = await board.claim({ by: 'cy', channel: 'ops' })

    expect(queued === null, 'a held task must not be handed out from the queue')
  },

  'the queue prefers tasks assigned to the caller': async (board) => {
    const open = await board.createTask({ by: 'ada', channel: 'ops', text: 'open' })
    const theirs = await board.createTask({ by: 'ada', channel: 'ops', text: 'cy', for: 'cy' })
    const mine = await board.createTask({ by: 'ada', channel: 'ops', text: 'bo', for: 'bo' })

    const first = await board.claim({ by: 'bo', channel: 'ops' })
    const second = await board.claim({ by: 'bo', channel: 'ops' })
    const third = await board.claim({ by: 'bo', channel: 'ops' })

    expect(first?.task.id === mine.id, 'an assigned task must be claimed first')
    expect(second?.task.id === open.id, 'then the oldest unassigned task')
    expect(third === null, 'a task assigned to someone else must not be handed out')
    await refused(board.claim({ by: 'bo', task: theirs.id }), 'task_assigned')
  },

  'settling records the outcome and ends the claim': async (board) => {
    const task = await board.createTask({ by: 'ada', channel: 'ops', text: 'x' })
    const claim = await board.claim({ by: 'bo', task: task.id })
    const token = claim?.token ?? ''
    const done = await board.settle({ task: task.id, token, outcome: 'completed', note: 'ok' })
    const root = await board.messages({ thread: task.id })

    expect(done.state === 'completed' && done.note === 'ok', 'the outcome was not recorded')
    expect(done.holder === null, 'a settled task must have no holder')
    expect(root[0]?.labels[TASK_LABEL] === 'completed', 'the task label must follow the state')
    await refused(board.settle({ task: task.id, token, outcome: 'failed' }), 'claim_lost')
    await refused(board.claim({ by: 'cy', task: task.id }), 'task_finished')
  },

  'a released task is ready again and the old token is dead': async (board) => {
    const task = await board.createTask({ by: 'ada', channel: 'ops', text: 'x' })
    const claim = await board.claim({ by: 'bo', task: task.id })
    const token = claim?.token ?? ''

    await board.settle({ task: task.id, token, outcome: 'released' })

    const again = await board.claim({ by: 'cy', task: task.id })

    expect(again?.task.epoch === 2, 'each claim must raise the epoch')
    await refused(board.settle({ task: task.id, token, outcome: 'completed' }), 'claim_lost')
  },

  'an expired lease returns the task to ready': async (board, advance) => {
    const task = await board.createTask({ by: 'ada', channel: 'ops', text: 'x' })
    const claim = await board.claim({ by: 'bo', task: task.id, leaseMs: 1_000 })
    const token = claim?.token ?? ''

    advance(500)
    await board.renew({ task: task.id, token, leaseMs: 1_000 })
    advance(800)

    const held = await board.tasks({ state: 'claimed' })

    expect(held.length === 1, 'a renewed lease must still hold the task')
    advance(500)

    const page = await board.events()
    const expiry = page.events.at(-1)

    expect(expiry?.type === 'task.ready', 'an expired lease must log task.ready')
    expect(expiry?.by === BOARD_ACTOR, 'the board must be the actor of an expiry')
    await refused(board.settle({ task: task.id, token, outcome: 'completed' }), 'claim_lost')
    await refused(board.renew({ task: task.id, token }), 'claim_lost')

    const next = await board.claim({ by: 'cy', channel: 'ops' })

    expect(next?.task.id === task.id, 'an expired task must be claimable again')
  },

  'a task waits for its needs': async (board) => {
    const first = await board.createTask({ by: 'ada', channel: 'ops', text: 'first' })

    const second = await board.createTask({
      by: 'ada',
      channel: 'ops',
      text: 'second',
      needs: [first.id],
    })

    expect(second.state === 'waiting', 'a task with unmet needs must wait')
    await refused(board.claim({ by: 'bo', task: second.id }), 'task_not_ready')

    await refused(
      board.createTask({ by: 'ada', channel: 'ops', text: 'x', needs: ['missing'] }),
      'invalid_needs',
    )

    const claim = await board.claim({ by: 'bo', task: first.id })

    await board.settle({ task: first.id, token: claim?.token ?? '', outcome: 'completed' })

    const ready = await board.tasks({ state: 'ready' })
    const page = await board.events()

    expect(ready.length === 1 && ready[0]?.id === second.id, 'the dependent did not become ready')
    expect(page.events.at(-1)?.type === 'task.ready', 'the dependent must log task.ready')
  },

  'a failed need readies nothing, and reopen restores the task': async (board) => {
    const first = await board.createTask({ by: 'ada', channel: 'ops', text: 'first' })

    await board.createTask({ by: 'ada', channel: 'ops', text: 'second', needs: [first.id] })

    const claim = await board.claim({ by: 'bo', task: first.id })

    await board.settle({ task: first.id, token: claim?.token ?? '', outcome: 'failed', note: 'no' })

    const waiting = await board.tasks({ state: 'waiting' })
    const reopened = await board.reopen({ by: 'ada', task: first.id })

    expect(waiting.length === 1, 'a failed need must leave its dependent waiting')
    expect(reopened.state === 'ready', 'reopen must return a failed task to ready')
  },

  'cancel ends a claim': async (board) => {
    const task = await board.createTask({ by: 'ada', channel: 'ops', text: 'x' })
    const claim = await board.claim({ by: 'bo', task: task.id })
    const canceled = await board.cancel({ by: 'ada', task: task.id, note: 'not needed' })

    expect(canceled.state === 'canceled' && canceled.holder === null, 'cancel did not take effect')

    await refused(
      board.settle({ task: task.id, token: claim?.token ?? '', outcome: 'completed' }),
      'claim_lost',
    )

    await refused(board.cancel({ by: 'ada', task: task.id }), 'task_finished')
  },
} satisfies { readonly [name: string]: Check }

/**
 * Runs the {@link MessageBoard} contract against a board implementation and returns one line per
 * failure. `make` is called for a fresh, empty board before each check and must read time from
 * the clock it is given.
 *
 * ```ts
 * expect(await boardConformance((clock) => createMemoryBoard(clock))).toEqual([])
 * ```
 */
export async function boardConformance(
  make: (clock: ConformanceClock) => MessageBoard | Promise<MessageBoard>,
): Promise<string[]> {
  const failures: string[] = []

  for (const [name, check] of Object.entries(checks)) {
    let time = 1_000_000

    try {
      const board = await make({ now: () => time })

      await check(board, (ms) => {
        time += ms
      })
    } catch (error) {
      failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return failures
}
