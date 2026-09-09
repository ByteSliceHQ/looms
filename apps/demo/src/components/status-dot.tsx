import { statusDotClass } from '@/lib/status'

export function StatusDot({ status }: { status: string }) {
  return <span className={statusDotClass(status)} aria-hidden />
}
