/**
 * Records production-shaped run logs into packages/testing/corpus/.
 * Run from the repo root: `bun packages/testing/scripts/record-corpus.ts`
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Option, Schema } from 'effect'

import {
  encodeLoomsEvent,
  hashRunState,
  stringifyJsonPretty,
  type EventEnvelope,
  type EventInput,
  type JsonValue,
} from '@looms/core'
import { createLooms } from '@looms/runtime'

import { corpusDefinition, corpusModule } from '../src/corpus-module'
import { assertReplayDeterministicEvents, corpusRegistry } from '../src/replay-corpus'

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'corpus')

const ChargeInputSchema = Schema.Struct({ amount: Schema.Finite })
const decodeChargeInput = Schema.decodeUnknownOption(ChargeInputSchema)

function chargeHandler(input: JsonValue): ReadonlyArray<EventInput> {
  const amount = Option.getOrElse(decodeChargeInput(input), () => ({ amount: 0 })).amount

  return [{ type: 'corpus.charged', payload: { amount, version: 'v1' } }]
}

async function record(
  name: string,
  run: (looms: ReturnType<typeof createLooms>) => Promise<{ runId: string }>,
) {
  const looms = createLooms({ modules: [corpusModule({ charge: chargeHandler })] })
  const { runId } = await run(looms)
  const events = await looms.getEvents(runId)
  const state = assertReplayDeterministicEvents(events, corpusRegistry(), runId)
  const stateHash = hashRunState(state)

  const entry = {
    name,
    runId,
    stateHash,
    events: events.map((event: EventEnvelope) => encodeLoomsEvent(event)),
  }

  writeFileSync(join(corpusDir, `${name}.json`), `${stringifyJsonPretty(entry)}\n`)
  await looms.stop()
  console.log(`recorded ${name} (${events.length} events, hash ${stateHash})`)
}

mkdirSync(corpusDir, { recursive: true })

await record('happy-path', async (looms) => {
  const started = await looms.start(corpusDefinition, 42, { runId: 'corpus_happy' })

  await looms.signal(started.runId, [
    { type: 'corpus.approved', payload: { decision: 'approve' }, threadId: started.threadId },
  ])

  return started
})

await record('rejected-approval', async (looms) => {
  const started = await looms.start(corpusDefinition, 7, { runId: 'corpus_reject' })

  await looms.signal(started.runId, [
    { type: 'corpus.approved', payload: { decision: 'reject' }, threadId: started.threadId },
  ])

  return started
})

await record('parked-for-approval', async (looms) => {
  return looms.start(corpusDefinition, 99, { runId: 'corpus_parked' })
})
