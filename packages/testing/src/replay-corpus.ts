import { Schema } from 'effect'

import {
  composeModules,
  EventEnvelopeSchema,
  foldRun,
  fromWireEvent,
  hashRunState,
  stringifyJson,
  type AnyRuntimeModule,
  type EventEnvelope,
  type FoldRegistry,
  type JsonValue,
  type RunState,
} from '@looms/core'

import { corpusModule } from './corpus-module'

const CorpusEntrySchema = Schema.Struct({
  name: Schema.String,
  runId: Schema.String,
  events: Schema.Array(EventEnvelopeSchema),
  /** Hash of the folded state when the log was recorded. */
  stateHash: Schema.String,
})

export type CorpusEntry = {
  readonly name: string
  readonly runId: string
  readonly events: ReadonlyArray<EventEnvelope>
  readonly stateHash: string
}

const decodeEntry = Schema.decodeUnknownSync(CorpusEntrySchema)

/** Modules every corpus fixture was recorded against. Keep them stable across releases. */
export function corpusRegistry(
  modules: ReadonlyArray<AnyRuntimeModule> = [corpusModule()],
): FoldRegistry {
  return composeModules(modules)
}

/**
 * Fold the same log twice and require a byte-identical {@link RunState}. Use this in CI against a
 * recorded corpus so a fold or protocol change that breaks replay fails before release.
 */
export function assertReplayDeterministicEvents(
  events: ReadonlyArray<EventEnvelope>,
  registry: FoldRegistry,
  runId: string,
): RunState {
  const first = foldRun(events, registry, { runId })
  const second = foldRun(events, registry, { runId })

  if (stringifyJson(first) !== stringifyJson(second)) {
    throw new Error(`Replay is not deterministic for run ${runId}`)
  }

  return first
}

/** Parse one recorded corpus JSON document. */
export function readCorpusEntry(raw: JsonValue): CorpusEntry {
  const entry = decodeEntry(raw)

  return {
    name: entry.name,
    runId: entry.runId,
    stateHash: entry.stateHash,
    events: entry.events.map(fromWireEvent),
  }
}

/**
 * Replay one recorded log: fold must be deterministic and must match the hash taken when the
 * fixture was written. A changed hash means the fold or a domain reducer moved under a recorded
 * production-shaped log.
 */
export function assertCorpusEntry(
  entry: CorpusEntry,
  registry: FoldRegistry = corpusRegistry(),
): RunState {
  const state = assertReplayDeterministicEvents(entry.events, registry, entry.runId)
  const actual = hashRunState(state)

  if (actual !== entry.stateHash) {
    throw new Error(
      `Corpus "${entry.name}" folded to ${actual}, expected ${entry.stateHash}. Re-record only after confirming the change is intentional.`,
    )
  }

  return state
}
