---
'@swirls/looms': minor
---

Move to Effect 4.1 and make `effect` a peer dependency (`^4.1.4`) instead of an exact dependency. Apps that use Effect themselves now share one copy with Looms instead of being forced onto Looms' exact version. Bun, npm, and pnpm install it automatically; Yarn users add `effect` themselves. `@effect/platform-bun` is now a caret range and `@effect/platform-node-shared` is no longer listed.
