---
'@swirls/looms': patch
---

Introduce the generic `@swirls/looms/projectors` module. Implement `Projector` or use `memory()`,
`postgres({ url })`, and `sqlite({ path })`. `createLooms({ projectors })` initializes projectors,
wraps append, and disposes them. S2 helpers now take an explicit environment bag; `serveHttp` no
longer reads `PORT`.
