import type { RunState } from '@swirls/looms/core'

export function rootOutput(state: RunState) {
  return state.rootThreadId ? state.threads[state.rootThreadId]?.output : undefined
}

export async function waitForStatus(
  looms: { getRun(runId: string): Promise<RunState> },
  runId: string,
  status: RunState['status'],
  timeoutMs = 10_000,
): Promise<RunState> {
  const deadline = Date.now() + timeoutMs
  let state = await looms.getRun(runId)

  while (state.status !== status && Date.now() < deadline) {
    await Bun.sleep(5)
    state = await looms.getRun(runId)
  }

  return state
}

export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeoutMs = 10_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs

  while (!(await condition())) {
    if (Date.now() > deadline) {
      throw new Error('condition not met in time')
    }

    await Bun.sleep(5)
  }
}

/** True when `needle` appears in an already-serialized payload. */
export function containsSecret(serialized: string, needle: string): boolean {
  return serialized.includes(needle)
}
