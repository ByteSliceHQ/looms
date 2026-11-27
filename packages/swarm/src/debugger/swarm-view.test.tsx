import { beforeAll, describe, expect, test } from 'bun:test'

import { renderToStaticMarkup } from 'react-dom/server'

import { foldLive } from '@looms/react'

import { swarmBoard, type SwarmBoard } from './board-fold'
import { followBoard, type LiveBoard } from './board-reader'
import { recordSwarmRun, type RecordedSwarmRun } from './recorded-run.fixture'
import { SwarmPanels, type SwarmPane } from './swarm-view'

let recorded: RecordedSwarmRun
let board: SwarmBoard

beforeAll(async () => {
  recorded = await recordSwarmRun()
  board = foldLive(swarmBoard, recorded.events)
})

function render(pane: SwarmPane, onOpenRun?: (runId: string) => void): string {
  return renderToStaticMarkup(
    <SwarmPanels status={recorded.status} board={board} initialPane={pane} onOpenRun={onOpenRun} />,
  )
}

describe('SwarmPanels', () => {
  test('shows the swarm and a tab per pane with its count', () => {
    const html = render('members')

    expect(html).toContain('running')
    expect(html).toContain('ops')
    expect(html).toMatch(/Members<span[^>]*>2</)
    expect(html).toMatch(/Threads<span[^>]*>3</)
    expect(html).toMatch(/Tasks<span[^>]*>1</)
    expect(html).toMatch(/Timeline<span[^>]*>5</)
  })

  test('lists members with their status, activations and run to open', () => {
    const html = render('members', () => undefined)
    const fixerRun = recorded.status.members.fixer?.runId ?? ''

    expect(fixerRun).not.toBe('')
    expect(html).toContain('fixer')
    expect(html).toContain('triage')
    expect(html).toContain('1 activation')
    expect(html).toContain('last completed')
    expect(html).toContain(`<button type="button" class="text-foreground`)
    expect(html).toContain(fixerRun)
  })

  test('shows threads by channel with replies, labels and mentions', () => {
    const html = render('threads')

    expect(html).toContain('#support')
    expect(html).toContain('@triage nobody can log in')
    expect(html).toContain('Looking into it')
    expect(html).toContain('priority=high')
    expect(html).toContain('→ @triage')
    expect(html.indexOf('nobody can log in')).toBeLessThan(html.indexOf('Looking into it'))
  })

  test('shows tasks grouped by state with their facts and note', () => {
    const html = render('tasks')

    expect(html).toContain('aria-label="completed"')
    expect(html).toContain('fix the login page')
    expect(html).toContain('for fixer')
    expect(html).toContain('#support by triage')
    expect(html).toContain('patched')
  })

  test('renders the timeline pane', () => {
    const html = render('timeline')

    expect(html).toContain('aria-label="Timeline"')
    expect(html).not.toContain('No board events yet')
  })
})

describe('SwarmPanels with a board read live', () => {
  let live: RecordedSwarmRun
  let whole: LiveBoard

  beforeAll(async () => {
    live = await recordSwarmRun({
      history: [{ by: 'olu', channel: 'announcements', text: 'board opened before this run' }],
    })

    const controller = new AbortController()
    let latest: LiveBoard | undefined

    const done = followBoard(live.board, 'ops', {
      pollMs: 60_000,
      signal: controller.signal,
      whenVisible: () => Promise.resolve(),
      onChange: (next) => {
        latest = next

        if (next.board.events.length >= 6) {
          controller.abort()
        }
      },
    })

    await done

    if (!latest) {
      throw new Error('the board was never read')
    }

    whole = latest
  })

  function renderLive(pane: SwarmPane): string {
    return renderToStaticMarkup(
      <SwarmPanels status={live.status} board={whole.board} source="live" initialPane={pane} />,
    )
  }

  test('the run pulled only what came after it started', () => {
    expect(foldLive(swarmBoard, live.events).events.length).toBe(5)
  })

  test('shows posts from before the run and says the board is live', () => {
    const html = renderLive('threads')

    expect(html).toContain('whole board · live')
    expect(html).not.toContain('as this run pulled it')
    expect(html).toContain('#announcements')
    expect(html).toContain('board opened before this run')
    expect(html).toContain('Looking into it')
    expect(html).toMatch(/Threads<span[^>]*>4</)
    expect(html).toMatch(/Timeline<span[^>]*>6</)
  })

  test('says the board is as the run pulled it, with the read error, when falling back', () => {
    const html = renderToStaticMarkup(
      <SwarmPanels
        status={live.status}
        board={foldLive(swarmBoard, live.events)}
        source="pulled"
        boardError="board offline"
        initialPane="threads"
      />,
    )

    expect(html).toContain('as this run pulled it')
    expect(html).toContain('board unreadable: board offline')
    expect(html).not.toContain('board opened before this run')
  })
})
