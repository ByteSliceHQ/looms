import type { EventFamilyView } from '../plugin'

export const RUNTIME_COLOR = 'oklch(0.76 0.13 155)'
export const WAIT_COLOR = 'oklch(0.8 0.14 85)'

export const builtinFamilies: readonly EventFamilyView[] = [
  { family: 'wait', prefix: 'runtime.wait', color: WAIT_COLOR },
  { family: 'runtime', prefix: 'runtime.', color: RUNTIME_COLOR },
]
