---
'@swirls/looms': minor
---

`createLooms({ blobStore })` and `LoomsDurableObject` `blobs` store strings over 64 KiB by SHA-256 and keep a reference in the event or snapshot. A payload that is still over the 1 MiB event limit is stored as one blob. Reads, subscribers, folds, projections, and snapshot loads resolve the reference, so a run can complete with a payload larger than that limit. Trim removes a blob body once nothing retained still points at it. `memoryBlobStore`, `filesystemBlobStore`, and `r2BlobStore` are the included stores. Without a blob store, events over 1 MiB and snapshots over 8 MiB are still rejected.
