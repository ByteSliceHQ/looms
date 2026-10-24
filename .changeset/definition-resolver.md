---
'@swirls/looms': minor
---

Definitions can be loaded at start, spawn, and recovery through `definitionResolver`, with registered definitions checked first and an LRU cache in front. A missing definition fails the start before any event is written, and the accepted version stays pinned on the run. Evaluator definitions now include `version`, defaulting to `v1`, and lookup takes the name and version.

BREAKING CHANGE: `EvaluatorDefinition` requires `version`, and evaluator lookup is `(name, version)` instead of `(name)`. `defineEvaluator` still defaults the version to `v1`.
