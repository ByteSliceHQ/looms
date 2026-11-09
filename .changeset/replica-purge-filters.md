---
'@swirls/looms': minor
---

Declare your own run attributes and give them replica columns, and clear Durable Object storage for terminal runs.

**Breaking:** the replica and `postgresEventLog` no longer have built-in `tenant`, `project`, and `org` columns. Declare the attributes you need with `defineRunAttributes` and pass them as `additionalFields`:

```ts
const attributes = defineRunAttributes({ tenantId: { required: true, index: true } })

createLooms({ modules, attributes })
postgresReplica({ url, additionalFields: attributes })
loomsReplicaTables({ additionalFields: attributes })
```

- Each attribute is a text column named in snake_case unless `fieldName` is set. `index: true` adds an index. Each column and index is its own migration, and a new column is backfilled from the `attributes` JSON. `postgresEventLog` records these migrations in `looms_schema_migrations` and applies each one once.
- Once attributes are declared, `start`, `startRun`, `launchRun`, and the client only accept declared keys, and `required` keys must be passed. The host refuses other starts with `InvalidRunAttributesError`, which `POST /runs` reports as 400.
- `replica.purge({ finishedBefore, where })` filters on declared attributes.
- `looms replica generate`, `migrate`, and `status` take `--config <module>` to read the declaration.
- `deleteTerminalRunStorage` deletes a terminal run's Durable Object storage once the listed projectors attached to the object have caught up.

Replicas created by an earlier version keep their `tenant`, `project`, and `org` columns, and Looms stops writing them. On Postgres, declaring an attribute with one of those column names reuses the column. On SQLite, use another `fieldName` or drop the old column first.
