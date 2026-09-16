# Looms

Apache-2.0 durable actor runtime for agents and workflows.

## Local

```bash
bun install
bun run verify          # turbo run build / check-types / test / verify + lint + fmt:check
bun run fmt             # oxfmt (write)
bun run fmt:check       # oxfmt --check
bun run demo            # turbo run dev --filter=@looms/demo (auto-starts s2-lite)
```

### Useful turbo filters

```bash
bun run build                              # all packages
turbo run build --filter=@looms/runtime... # internal runtime + deps
turbo run test --filter=@looms/core
turbo run dev --filter=@looms/demo
```

### Flox (optional)

```bash
flox activate          # installs S2 CLI into $FLOX_ENV_CACHE/s2 on first activate
bun install
bun run verify
```

Without Flox, install the S2 CLI with `bun run setup:s2` (or see https://s2.dev/docs/cli/installation).

### React Doctor

To audit React codebase health and performance diagnostics (Node runtime provided via Flox):

```bash
flox activate -- bun run doctor
```

## PR checklist

- [ ] `bun run verify` passes
- [ ] Changeset added if `@swirls/looms` behavior changes (`bun run changeset`)
- [ ] Docs updated for API / architecture changes

See [`RELEASE.md`](./RELEASE.md) for versioning and publishing.

## Layout

| Path             | Role                                                       |
| ---------------- | ---------------------------------------------------------- |
| `packages/*`     | Private module workspaces (`@looms/*`)                     |
| `packages/looms` | Assembled public package (`@swirls/looms`)                 |
| `apps/*`         | Private apps (demo UI, docs)                               |
| `examples/`      | Small runnable `createLooms` scripts (`bun run examples`)  |
| `turbo.json`     | Task graph (`build` → `^build`, cached outputs in `dist/`) |
