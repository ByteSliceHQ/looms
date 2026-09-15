import { cn } from './cn'

export type StatusKind = 'running' | 'waiting' | 'completed' | 'failed' | 'cancelled'

export function statusClass(status: string): string {
  switch (status) {
    case 'running':
      return 'text-status-running'
    case 'waiting':
      return 'text-status-waiting'
    case 'completed':
    case 'approved':
    case 'authorized':
      return 'text-status-completed'
    case 'failed':
    case 'rejected':
    case 'declined':
      return 'text-status-failed'
    default:
      return 'text-status-cancelled'
  }
}

export function statusDotClass(status: string): string {
  return cn(
    'inline-block size-1.5 shrink-0 rounded-full',
    status === 'running' && 'bg-status-running animate-pulse',
    status === 'waiting' && 'bg-status-waiting',
    (status === 'completed' || status === 'approved' || status === 'authorized') &&
      'bg-status-completed',
    (status === 'failed' || status === 'rejected' || status === 'declined') && 'bg-status-failed',
    status !== 'running' &&
      status !== 'waiting' &&
      status !== 'completed' &&
      status !== 'approved' &&
      status !== 'authorized' &&
      status !== 'failed' &&
      status !== 'rejected' &&
      status !== 'declined' &&
      'bg-status-cancelled',
  )
}
