import type { EventFamilyView } from '../plugin'

export const runtimeFamily: EventFamilyView = {
  family: 'runtime',
  prefix: 'runtime.',
  color: 'oklch(0.76 0.13 155)',
}

export const builtinFamilies: readonly EventFamilyView[] = [
  { family: 'wait', prefix: 'runtime.wait', color: 'oklch(0.8 0.14 85)' },
  runtimeFamily,
]
