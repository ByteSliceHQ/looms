---
'@swirls/looms': minor
---

`@swirls/looms/react` can keep a run's events on the device. Pass `cache={indexedDbEventCache()}` to `LoomsProvider`, or `cache` to `createLoomsStore`: the store keeps the run's durable events, starts from them the next time it opens, and downloads only what was appended since. Ephemeral events are never kept, and a cache that turns out to be ahead of the host's log is dropped. `EventCache` is the interface to implement for other storage, and `memoryEventCache()` is one for tests.

The store also reports timings. Pass an `observer` to `LoomsProvider` or `createLoomsStore` to be told when a store has caught up (`store.synced`, with how long it took and how many events came from the cache), when its connection status changes, and how long each commit took to be acknowledged, confirmed, or to fail.
