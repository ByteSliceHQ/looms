import { withAssignedSeq, type AppendableEvent, type EventEnvelope } from './envelope'
import { foldEvent, type FoldRegistry } from './fold'
import { emptyRunState, type RunState } from './state'
import type { AppendResult } from './store'

export interface RunCursor {
  readonly state: RunState
  readonly seq: number
  readonly durableSinceSnapshot: number
}

export function emptyCursor(runId: string): RunCursor {
  return {
    state: emptyRunState(runId),
    seq: 0,
    durableSinceSnapshot: 0,
  }
}

/**
 * Folds events into the cursor. Ephemeral events are skipped by `foldEvent`
 * (no RunState change) but still advance `seq`.
 */
export function advanceCursor(
  cursor: RunCursor,
  events: readonly EventEnvelope[],
  registry: FoldRegistry,
): RunCursor {
  let state = cursor.state
  let seq = cursor.seq
  let durableSinceSnapshot = cursor.durableSinceSnapshot

  for (const event of events) {
    if (event.seq > seq) {
      seq = event.seq
    }

    if (!event.ephemeral) {
      if (event.type === 'runtime.snapshot.taken') {
        durableSinceSnapshot = 0
      } else {
        durableSinceSnapshot += 1
      }
    }

    state = foldEvent(state, event, registry)
  }

  return { state, seq, durableSinceSnapshot }
}

export function assignSequences(
  batch: readonly AppendableEvent[],
  result: AppendResult,
): EventEnvelope[] {
  if (batch.length !== result.sequences.length) {
    throw new Error(
      `assignSequences length mismatch: batch has ${batch.length} events but append returned ${result.sequences.length} sequences`,
    )
  }

  return batch.map((partial, index) => {
    const seq = result.sequences[index]

    if (seq === undefined) {
      throw new Error(`assignSequences missing sequence at index ${index}`)
    }

    return withAssignedSeq(partial, partial.runId, seq)
  })
}
