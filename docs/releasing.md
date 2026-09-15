# Releasing

Looms uses [Changesets](https://github.com/changesets/changesets) for versioning. Packages under `packages/*` are publishable; `apps/*` are private and ignored by changesets.

## Workflow

1. Develop on a branch; add a changeset when the public API or published behavior changes:

   ```bash
   bun run changeset
   ```

2. Merge the PR. CI runs `bun run verify`.

3. On `main`, create a Version Packages PR via Changesets (or locally):

   ```bash
   bun run version-packages
   ```

4. Publish from a clean checkout (maintainers only). Workspace packages resolve TypeScript `src/` locally; `build` emits `dist/` and `publishConfig` rewrites exports for npm:

   ```bash
   bun run --filter './packages/*' build
   # bunx changeset publish   # do not run unless intentionally releasing
   ```

Linked packages (`@looms/core`, `@looms/s2`, `@looms/runtime`, `@looms/agent`, `@looms/workflow`, `@looms/client`, `@looms/react`, `@looms/cli`, `@looms/projectors`) share versions.

## First release (0.1.0)

Initial versions are already set to `0.1.0` in package.json files. The opening changeset documents the OSS surface. Publishing is intentional and manual — this repo does not auto-publish from CI.
