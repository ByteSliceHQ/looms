import type { CaseStatus } from '@looms/northline/http'
import { completedRunStatus, type JsonValue } from '@swirls/looms/core'
import type { Projector } from '@swirls/looms/projectors'

interface DeskStub {
  fetch(request: Request): Promise<Response>
}

interface DeskNamespace {
  getByName(name: string): DeskStub
}

/** Map a run event onto the board. Anything else leaves the row alone. */
export function caseStatusForEvent(event: {
  readonly type: string
  readonly payload: JsonValue
}): CaseStatus | undefined {
  if (event.type === 'approval.requested') {
    return 'waiting'
  }

  if (event.type === 'approval.decided') {
    return 'running'
  }

  if (event.type === 'runtime.run.cancelled') {
    return 'cancelled'
  }

  if (event.type === 'runtime.run.completed') {
    return completedRunStatus(event.payload)
  }

  return undefined
}

/**
 * One board for every run. A Durable Object cannot list its siblings, so case
 * status is projected here. Updates are idempotent: a redelivered batch writes
 * the same status, and a run that is not a case matches no row.
 */
export function deskStatusProjector(desk: DeskNamespace): Projector {
  return {
    name: 'northline-desk',
    version: '1',
    project(events) {
      let chain = Promise.resolve()

      for (const event of events) {
        const status = caseStatusForEvent(event)

        if (!status) {
          continue
        }

        const update = { runId: event.runId, status }
        chain = chain.then(() => postStatus(desk, update))
      }

      return chain
    },
  }
}

function postStatus(
  desk: DeskNamespace,
  update: { readonly runId: string; readonly status: CaseStatus },
): Promise<void> {
  return desk
    .getByName('board')
    .fetch(
      new Request('https://northline.internal/internal/cases/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(update),
      }),
    )
    .then((response) => {
      if (response.ok) {
        return Promise.resolve()
      }

      return response.text().then((text) => {
        throw new Error(text || `Desk status update failed (${response.status})`)
      })
    })
}
