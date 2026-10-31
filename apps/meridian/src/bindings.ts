import type { DailyFill } from './modules/ledger/events'

export interface LiveCredentials {
  readonly apiKey: string
  readonly privateKey: string
}

export interface SessionStart {
  readonly symbol: string
  readonly strategy: 'momentum' | 'mean-revert'
  readonly venue: 'sim' | 'robinhood'
  readonly cycles: number
  readonly intervalMs: number
}

export interface DeskBook {
  readonly killed: boolean
  readonly position: number
  readonly realizedPnl: number
  readonly openOrders: number
  readonly lastOrder: string
}

interface SessionControl {
  start(input: SessionStart): Promise<{ runId: string } | { reason: string }>
  halt(runId: string): Promise<{ halted: boolean; reason: string }>
  book(): Promise<DeskBook>
}

let credentials: LiveCredentials | undefined
let readKill: () => Promise<boolean> = () => Promise.resolve(false)
let readFills: (at: number) => Promise<readonly DailyFill[]> = () => Promise.resolve([])

let control: SessionControl = {
  start: () => Promise.resolve({ reason: 'the desk is not attached' }),
  halt: () => Promise.resolve({ halted: false, reason: 'the desk is not attached' }),
  book: () =>
    Promise.resolve({
      killed: false,
      position: 0,
      realizedPnl: 0,
      openOrders: 0,
      lastOrder: 'none',
    }),
}

export function bindLiveCredentials(next: LiveCredentials | undefined): void {
  credentials = next
}

export function liveCredentials(): LiveCredentials | undefined {
  return credentials
}

export function bindKillReader(reader: () => Promise<boolean>): void {
  readKill = reader
}

export function readKillSwitch(): Promise<boolean> {
  return readKill()
}

export function bindDailyFills(reader: (at: number) => Promise<readonly DailyFill[]>): void {
  readFills = reader
}

export function readDailyFills(at: number): Promise<readonly DailyFill[]> {
  return readFills(at)
}

export function bindSessionControl(next: SessionControl): void {
  control = next
}

export function sessionControl(): SessionControl {
  return control
}
