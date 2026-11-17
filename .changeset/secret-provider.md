---
'@swirls/looms': minor
---

Decide what a run holds and what each attempt receives with a secret provider. Pass `secretProvider` to `createLooms`, `createRuntime`, an actor host, or the Cloudflare Durable Object. `provision` decides what a run holds when it starts, `forAttempt` decides what one attempt receives and can replace what the run holds, `forChild` decides what a launched or forked run is supplied with, and `revoke` is called when the run finishes. A `forAttempt` failure fails the attempt under its retry policy, and a worker that asks for its secrets is told `unavailable`. The observer is told `secrets.issued` and `secrets.failed`.

`secretSealer({ key })` encrypts what a run holds before it is stored. Pass it as `secretSealer`.

Breaking changes:

- What a run holds is deleted when the run finishes.
- A run launched from an effect, and a fork, no longer inherit the parent's secrets. Pass `secrets` on the launch or the fork, or return them from `forChild`. To keep the old behavior for launches, use `secretProvider: { forChild: ({ held }) => held }`.
- `RunSecretStore` needs a `delete` method.
- `EffectAdmissionContext.secrets` and `ctx.secrets` are the attempt's secrets, which differ from what the run holds when a provider has `forAttempt`.
