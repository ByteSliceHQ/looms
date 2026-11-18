---
'@swirls/looms': patch
---

A wake that reaches `maxWakeIterations` no longer fails and leaves its run with nothing driving
it. It starts nothing new, waits for the effects it already started, parks, and asks its
scheduler to wake the run again at once, as the hosting guide describes. A long agent session
whose workers kept calling tools could reach the limit inside one wake and then sit idle until
an unrelated request woke it. `MaxWakeIterationsError` is no longer raised and is deprecated.
