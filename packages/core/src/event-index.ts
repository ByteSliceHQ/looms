import type { EventEnvelope } from './envelope'

/** Thread bucket key used by run-tree counts (`threadId` or `'run'` for run-scoped). */
export function eventThreadKey(event: { threadId?: string | null }): string {
  return event.threadId ?? 'run'
}

/**
 * Append-only indexes over an event log. Thread/count snapshots are rebuilt
 * lazily on read so coalesced applies avoid repeated O(n) freezes.
 */
export class EventIndex<TEvent extends EventEnvelope = EventEnvelope> {
  private counts = new Map<string, number>()
  private countsSnapshot: ReadonlyMap<string, number> = new Map()
  private countsDirty = false
  private byThread = new Map<string, TEvent[]>()
  private byThreadSnapshots = new Map<string, readonly TEvent[]>()
  private dirtyThreads = new Set<string>()
  private bySeqMap = new Map<number, TEvent>()
  private latestByType = new Map<string, TEvent>()
  private startedAtTimestamp: number | undefined = undefined

  append(batch: readonly TEvent[]): void {
    if (batch.length === 0) {
      return
    }

    for (const event of batch) {
      this.bySeqMap.set(event.seq, event)
      this.latestByType.set(event.type, event)

      if (this.startedAtTimestamp === undefined && event.type === 'runtime.run.started') {
        this.startedAtTimestamp = event.ts
      }

      const threadKey = eventThreadKey(event)
      this.counts.set(threadKey, (this.counts.get(threadKey) ?? 0) + 1)
      this.dirtyThreads.add(threadKey)
      this.countsDirty = true

      let threadList = this.byThread.get(threadKey)

      if (!threadList) {
        threadList = []
        this.byThread.set(threadKey, threadList)
      }

      threadList.push(event)
    }
  }

  private publish(): void {
    if (this.dirtyThreads.size > 0) {
      for (const threadKey of this.dirtyThreads) {
        const list = this.byThread.get(threadKey)

        if (list) {
          this.byThreadSnapshots.set(threadKey, Object.freeze(list.slice()))
        }
      }

      this.dirtyThreads.clear()
    }

    if (this.countsDirty) {
      this.countsSnapshot = new Map(this.counts)
      this.countsDirty = false
    }
  }

  getCounts(): ReadonlyMap<string, number> {
    this.publish()
    return this.countsSnapshot
  }

  getByThread(threadId: string): readonly TEvent[] {
    this.publish()
    return this.byThreadSnapshots.get(threadId) ?? []
  }

  getBySeq(seq: number): TEvent | undefined {
    return this.bySeqMap.get(seq)
  }

  getStartedAt(): number | undefined {
    return this.startedAtTimestamp
  }

  getLatest(type: string): TEvent | undefined {
    return this.latestByType.get(type)
  }

  clear(): void {
    this.counts.clear()
    this.countsSnapshot = new Map()
    this.countsDirty = false
    this.byThread.clear()
    this.byThreadSnapshots.clear()
    this.dirtyThreads.clear()
    this.bySeqMap.clear()
    this.latestByType.clear()
    this.startedAtTimestamp = undefined
  }
}
