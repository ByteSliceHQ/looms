import { cn } from './cn'

export type StatusKind = 'running' | 'waiting' | 'completed' | 'failed' | 'cancelled'

/** The colour a status reads as. Statuses a module names itself map onto these five. */
function statusKind(status: string): StatusKind {
  switch (status) {
    case 'running':
    case 'active':
    case 'claimed':
      return 'running'
    case 'waiting':
    case 'blocked':
    case 'paused':
    case 'stopping':
      return 'waiting'
    case 'completed':
    case 'approved':
    case 'authorized':
      return 'completed'
    case 'failed':
    case 'rejected':
    case 'declined':
    case 'halted':
      return 'failed'
    default:
      return 'cancelled'
  }
}

const textClass: Record<StatusKind, string> = {
  running: 'text-status-running',
  waiting: 'text-status-waiting',
  completed: 'text-status-completed',
  failed: 'text-status-failed',
  cancelled: 'text-status-cancelled',
}

export function statusClass(status: string): string {
  return textClass[statusKind(status)]
}

export function statusDotClass(status: string): string {
  const kind = statusKind(status)

  return cn(
    'inline-block size-1.5 shrink-0 rounded-full',
    kind === 'running' && 'bg-status-running animate-pulse',
    kind === 'waiting' && 'bg-status-waiting',
    kind === 'completed' && 'bg-status-completed',
    kind === 'failed' && 'bg-status-failed',
    kind === 'cancelled' && 'bg-status-cancelled',
  )
}
