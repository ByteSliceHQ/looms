---
"@looms/projectors": minor
"@looms/runtime": minor
"@looms/s2": minor
---

Replace `@looms/postgres` with a generic `@looms/projectors` package. Implement `Projector` or use `memory()`, `postgres({ url })`, and `sqlite({ path })`. `createLooms({ projectors })` inits, wraps append, and disposes. S2 helpers now take an explicit env bag; `serveHttp` no longer reads `PORT`.
