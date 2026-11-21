---
'@swirls/looms': minor
---

Raise the optional `drizzle-orm` peer range to `^0.45.2`, so the Postgres replica adapter and its consumers no longer accept the versions affected by CVE-2026-39356.

This is a minor release because the narrowed peer range drops compatibility with `drizzle-orm` 0.44.x, which has no fixed release and carries the SQL injection advisory. Applications that install `drizzle-orm` should upgrade it to 0.45.2 or later before they take this version.
