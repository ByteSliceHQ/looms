import type { ShipmentKind } from '@looms/northline/catalog'
import type { CaseStatus } from '@looms/northline/http'

const dollars = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const opened = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const clockFormat = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
})

export function money(value: number): string {
  return dollars.format(value)
}

export function openedLabel(at: number): string {
  if (at <= 0) {
    return ''
  }

  return opened.format(at)
}

export function clock(at: number): string {
  return clockFormat.format(at)
}

export function kindLabel(kind: ShipmentKind): string {
  switch (kind) {
    case 'late':
      return 'Late'
    case 'damage':
      return 'Damage'
    case 'shortage':
      return 'Shortage'

    default: {
      const unreachable: never = kind
      return unreachable
    }
  }
}

export function statusLabel(status: CaseStatus): string {
  switch (status) {
    case 'running':
      return 'In progress'
    case 'waiting':
      return 'Needs a person'
    case 'completed':
      return 'Done'
    case 'failed':
      return 'Failed'
    case 'cancelled':
      return 'Cancelled'

    default: {
      const unreachable: never = status
      return unreachable
    }
  }
}
