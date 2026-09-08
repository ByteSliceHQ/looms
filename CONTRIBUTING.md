# Looms

Apache-2.0 durable actor runtime for agents and workflows.

## Local

```bash
bun install
bun run verify          # turbo run build / check-types / test / verify
bun run demo            # turbo run dev --filter=@looms/demo (auto-starts s2-lite)
```

### Useful turbo filters

```bash
bun run build                              # all packages
turbo run build --filter=@looms/runtime... # runtime + deps
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

## PR checklist

- [ ] `bun run verify` passes
- [ ] Changeset added if publishing packages change (`bun run changeset`)
- [ ] Docs updated for API / architecture changes

## Layout

| Path | Role |
|---|---|
| `packages/*` | Publishable libraries (`@looms/*`) |
| `apps/*` | Private apps (demo UI) |
| `turbo.json` | Task graph (`build` → `^build`, cached outputs in `dist/`) |
