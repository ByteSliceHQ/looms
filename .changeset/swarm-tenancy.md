---
'@swirls/looms': minor
---

Swarms, agent tools, and the model adapter now know which run they work for, so a host with many tenants can keep each tenant's boards and files apart.

- `resolveAttachment(attachment, run)` receives the run the model call is made for: `runId`, `threadId`, `attributes`, and `secrets`. `LlmCompleteArgs` carries it as `run`.
- A tool's `handler(input, ctx)` and an agent's `resolveTools(ctx)` receive the same values.
- The swarm `boards` resolver is called as `boards(boardId, caller)`. Throw `BoardError` with the new code `board_denied` for a board the caller's tenant does not own. A swarm whose own board is refused fails.
- `ensureSwarm` takes `{ attributes }` as a fifth argument. Member runs inherit them.
- A member's run id is now derived in the host's id format, so it is a valid id under a custom format. It was `<swarm run id>:<member>:<n>`. `activationRunId` returns it.
- A board write's idempotency key now names the run as well as the effect, so two runs that share a board cannot collide.
- A swarm that cannot read its board tries again with a growing delay, up to 15 minutes. It used to stop reading after five attempts.

Breaking: `LlmCompleteArgs.run` is required, and `resolveAttachments` takes the run as a third argument.
