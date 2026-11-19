const SAFE_TOKEN = /^[A-Za-z0-9_-]+$/
const encoder = new TextEncoder()

/**
 * Encode one subject token. Characters outside `[A-Za-z0-9_-]` become `~HH` per UTF-8 byte,
 * and the empty string becomes `~`. Raw tokens never contain `~`, so two different inputs
 * never share a token: a run's subjects can't collide with another run's.
 */
export function encodeSubjectToken(value: string): string {
  if (value.length === 0) {
    return '~'
  }

  if (SAFE_TOKEN.test(value)) {
    return value
  }

  let token = ''

  for (const char of value) {
    if (SAFE_TOKEN.test(char)) {
      token += char
      continue
    }

    for (const byte of encoder.encode(char)) {
      token += `~${byte.toString(16).toUpperCase().padStart(2, '0')}`
    }
  }

  return token
}

/** Each dot-separated part of an event type becomes its own token, so `>` and `*` filter by type. */
export function encodeEventType(type: string): string {
  return type.split('.').map(encodeSubjectToken).join('.')
}

export function isValidSubjectPrefix(prefix: string): boolean {
  return prefix.split('.').every((token) => SAFE_TOKEN.test(token))
}

/** `<prefix>.run.>`: everything this projector publishes. */
export function streamSubject(prefix: string): string {
  return `${prefix}.run.>`
}

/** `<prefix>.run.<runId>.>`: one run's events, in the order they were published. */
export function runSubjectFilter(prefix: string, runId: string): string {
  return `${prefix}.run.${encodeSubjectToken(runId)}.>`
}

export function eventSubject(prefix: string, runId: string, type: string): string {
  return `${prefix}.run.${encodeSubjectToken(runId)}.${encodeEventType(type)}`
}
