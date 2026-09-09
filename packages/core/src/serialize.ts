/**
 * FIFO serializer keyed by arbitrary identifier (stream / run / key).
 * - Guarantees sequential execution of async tasks for the same key.
 * - Independent keys execute concurrently.
 * - A failed task does not reject or block the chain for subsequent tasks.
 * - Automatically evicts completed chains from memory when idle.
 */
export function createKeyedSerializer() {
  const tails = new Map<string, Promise<unknown>>()

  const run = <T>(key: string, task: () => Promise<T>): Promise<T> => {
    const prev = tails.get(key) ?? Promise.resolve()
    let cleanup: Promise<unknown>
    const next = prev.then(task, task)
    cleanup = next.then(
      () => {
        if (tails.get(key) === cleanup) tails.delete(key)
      },
      () => {
        if (tails.get(key) === cleanup) tails.delete(key)
      },
    )
    tails.set(key, cleanup)
    return next
  }

  const drain = async (key: string): Promise<void> => {
    const pending = tails.get(key)
    if (pending) await pending
  }

  const clear = (key?: string): void => {
    if (key !== undefined) {
      tails.delete(key)
    } else {
      tails.clear()
    }
  }

  const size = (): number => tails.size

  return { run, drain, clear, size }
}

export type KeyedSerializer = ReturnType<typeof createKeyedSerializer>
