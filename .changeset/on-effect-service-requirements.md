---
'@swirls/looms': patch
---

`onEffect` and `onAdmit` accept an effect definition that requires host services. Wrapping `callLlmEffect` in middleware, as in `onEffect(callLlmEffect, handler)`, was a type error because the definition's service requirements did not match the parameter's default. The functions now infer those requirements from the definition.
