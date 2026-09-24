import type { Effect } from 'effect'

import type { RouteAccess } from './auth'

export type ParamValue = string | number

/** Decodes one path segment, or returns null when the segment does not match. */
export interface ParamDecoder<T extends ParamValue> {
  decode(raw: string): T | null
}

export const text: ParamDecoder<string> = {
  decode: (raw) => {
    try {
      return decodeURIComponent(raw)
    } catch {
      return null
    }
  },
}

export const integer: ParamDecoder<number> = {
  decode: (raw) => (/^\d+$/.test(raw) ? Number(raw) : null),
}

export function oneOf<const T extends string>(values: readonly T[]): ParamDecoder<T> {
  return { decode: (raw) => values.find((value) => value === raw) ?? null }
}

type PathParamNames<TPath extends string> = TPath extends `${string}:${infer Param}/${infer Rest}`
  ? Param | PathParamNames<`/${Rest}`>
  : TPath extends `${string}:${infer Param}`
    ? Param
    : never

type ParamDecoders<TPath extends string> = {
  readonly [K in PathParamNames<TPath>]?: ParamDecoder<ParamValue>
}

type DecodedParams<TPath extends string, TDecoders> = {
  readonly [K in PathParamNames<TPath>]: K extends keyof TDecoders
    ? TDecoders[K] extends ParamDecoder<infer T>
      ? T
      : string
    : string
}

export interface RouteContext<TParams> {
  readonly req: Request
  readonly url: URL
  readonly params: TParams
}

export interface RouteDefinition<TPath extends string, TDecoders extends ParamDecoders<TPath>> {
  readonly method: 'GET' | 'POST'
  /** Path pattern such as `/runs/:runId/effects/:effectId`; parameters decode as text by default. */
  readonly path: TPath
  readonly name: string
  readonly access: RouteAccess
  readonly params?: TDecoders
  handle(context: RouteContext<DecodedParams<TPath, TDecoders>>): Effect.Effect<Response, Error>
}

type Segment =
  | { readonly kind: 'literal'; readonly value: string }
  | { readonly kind: 'param'; readonly name: string; readonly decoder: ParamDecoder<ParamValue> }

export type RouteParams = Readonly<Record<string, ParamValue>>

export interface Route {
  readonly method: 'GET' | 'POST'
  readonly name: string
  readonly access: RouteAccess
  readonly segments: readonly Segment[]
  handle(context: RouteContext<RouteParams>): Effect.Effect<Response, Error>
}

export function route<
  const TPath extends string,
  const TDecoders extends ParamDecoders<TPath> = Record<never, never>,
>(definition: RouteDefinition<TPath, TDecoders>): Route {
  const decoders: Partial<Record<string, ParamDecoder<ParamValue>>> = definition.params ?? {}

  const segments = definition.path
    .split('/')
    .slice(1)
    .map((part): Segment => {
      if (!part.startsWith(':')) {
        return { kind: 'literal', value: part }
      }

      const name = part.slice(1)
      return { kind: 'param', name, decoder: decoders[name] ?? text }
    })

  // SAFETY: matchRoute only calls a route with every path parameter decoded by its decoders.
  return {
    method: definition.method,
    name: definition.name,
    access: definition.access,
    segments,
    handle: (context) =>
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      definition.handle(context as RouteContext<DecodedParams<TPath, TDecoders>>),
  }
}

export interface MatchedRoute {
  readonly route: Route
  readonly params: RouteParams
}

function matchSegments(segments: readonly Segment[], parts: readonly string[]): RouteParams | null {
  if (segments.length !== parts.length) {
    return null
  }

  const params: Record<string, ParamValue> = {}

  for (const [index, segment] of segments.entries()) {
    const part = parts[index]!

    if (segment.kind === 'literal') {
      if (segment.value !== part) {
        return null
      }

      continue
    }

    const value = segment.decoder.decode(part)

    if (value === null) {
      return null
    }

    params[segment.name] = value
  }

  return params
}

/** First route, in table order, whose method and path match. */
export function matchRoute(
  routes: readonly Route[],
  method: string,
  pathname: string,
): MatchedRoute | null {
  const parts = pathname.split('/').slice(1)

  for (const candidate of routes) {
    if (candidate.method !== method) {
      continue
    }

    const params = matchSegments(candidate.segments, parts)

    if (params) {
      return { route: candidate, params }
    }
  }

  return null
}
