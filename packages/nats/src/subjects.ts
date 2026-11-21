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

/**
 * The tokens between `run` and the run id: one per name, in order, from the run's attributes.
 * An attribute the run does not have is the empty token, `~`.
 */
export function attributeTokens(
  names: readonly string[],
  attributes: { readonly [key: string]: string } | undefined,
): readonly string[] {
  return names.map((name) => encodeSubjectToken(attributes?.[name] ?? ''))
}

/**
 * The attribute tokens of a subject this projector published, given how many it carries.
 * `undefined` when the subject is not one of them.
 */
export function attributeTokensOf(
  subject: string,
  prefix: string,
  count: number,
): readonly string[] | undefined {
  const head = `${prefix}.run.`

  if (!subject.startsWith(head)) {
    return undefined
  }

  const tokens = subject.slice(head.length).split('.')

  // The attributes, the run id, and at least one token of the event type.
  return tokens.length >= count + 2 ? tokens.slice(0, count) : undefined
}

/** `count` tokens that match any attribute: `*` for each. */
export function anyAttributeTokens(count: number): readonly string[] {
  return Array.from({ length: count }, () => '*')
}

/**
 * One run's events, in the order they were published.
 *
 * `scope` is the run's attribute tokens: `<prefix>.run.<tokens>.<runId>.>`. With
 * `anyAttributeTokens` it finds the run whatever its attributes: `<prefix>.run.*.*.<runId>.>`.
 * With no attributes in the subject it is `<prefix>.run.<runId>.>`.
 */
export function runSubjectFilter(
  prefix: string,
  runId: string,
  scope: readonly string[] = [],
): string {
  return [prefix, 'run', ...scope, encodeSubjectToken(runId), '>'].join('.')
}

/** `<prefix>.run.<attribute tokens>.<runId>.<type tokens>`. */
export function eventSubject(
  prefix: string,
  runId: string,
  type: string,
  scope: readonly string[] = [],
): string {
  return [prefix, 'run', ...scope, encodeSubjectToken(runId), encodeEventType(type)].join('.')
}
