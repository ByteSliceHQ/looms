export const DEFAULT_FAMILIES = [
  'runtime',
  'agent',
  'workflow',
  'approval',
  'payments',
  'wait',
] as const

export type EventFamily = (typeof DEFAULT_FAMILIES)[number]

export type EventSummary = {
  title: string
  detail?: string
}

export function familyFromPrefix(type: string): EventFamily {
  if (type.startsWith('agent.')) {
    return 'agent'
  }

  if (type.startsWith('workflow.')) {
    return 'workflow'
  }

  if (type.startsWith('approval.')) {
    return 'approval'
  }

  if (type.startsWith('payments.')) {
    return 'payments'
  }

  if (type.startsWith('runtime.wait')) {
    return 'wait'
  }

  return 'runtime'
}

export function familyClass(family: string): string {
  switch (family) {
    case 'agent':
      return 'bg-family-agent'
    case 'workflow':
      return 'bg-family-workflow'
    case 'approval':
      return 'bg-family-approval'
    case 'payments':
      return 'bg-family-payments'
    case 'wait':
      return 'bg-family-wait'
    case 'runtime':
      return 'bg-family-runtime'
    default:
      return 'bg-family-runtime'
  }
}
