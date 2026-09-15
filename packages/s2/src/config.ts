import { Schema } from 'effect'

/**
 * Configuration for the S2-backed EventStore.
 *
 * `endpoint` is optional and typically used for local s2-lite:
 *   `{ account: "http://localhost:8080", basin: "http://localhost:8080" }`
 */
export const S2ConfigSchema = Schema.Struct({
  basin: Schema.String,
  accessToken: Schema.String,
  endpoint: Schema.optional(
    Schema.Union([
      Schema.String,
      Schema.Struct({
        account: Schema.optional(Schema.String),
        basin: Schema.optional(Schema.String),
      }),
    ]),
  ),
  streamConfig: Schema.optional(
    Schema.Struct({
      retentionPolicy: Schema.optional(
        Schema.Union([
          Schema.Struct({ ageSecs: Schema.Number }),
          Schema.Struct({ infinite: Schema.Struct({}) }),
        ]),
      ),
      storageClass: Schema.optional(Schema.Literals(['standard', 'express'])),
    }),
  ),
  snapshotPrefix: Schema.optional(Schema.String),
})

export type S2Config = Schema.Schema.Type<typeof S2ConfigSchema>

export function streamNameForRun(runId: string): string {
  return `runs/${runId}`
}

export function s2ConfigFromEnv(env: Record<string, string | undefined>): S2Config {
  const basin = env.LOOMS_S2_BASIN ?? env.S2_BASIN ?? 'looms-demo'

  const accessToken =
    env.LOOMS_S2_ACCESS_TOKEN ??
    env.LOOMS_S2_AUTH_TOKEN ??
    env.S2_ACCESS_TOKEN ??
    env.S2_AUTH_TOKEN ??
    's2_local'

  const endpoint =
    env.LOOMS_S2_ENDPOINT ??
    env.S2_ENDPOINT ??
    ((env.LOOMS_S2_PORT ?? env.S2_PORT ?? env.S2_LITE_PORT)
      ? `http://127.0.0.1:${env.LOOMS_S2_PORT ?? env.S2_PORT ?? env.S2_LITE_PORT}`
      : undefined)

  const config: S2Config = {
    basin,
    accessToken,
  }

  if (endpoint !== undefined) {
    return {
      basin,
      accessToken,
      endpoint,
    }
  }

  return config
}
