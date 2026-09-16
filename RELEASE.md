# Releasing Looms

`@swirls/looms` is the repository's only public npm package. The `@looms/*` workspaces remain
private build units; `packages/looms` assembles their compiled output into one package with module
subpaths.

## Version policy

Looms uses SemVer and Changesets.

- Before 1.0, use `patch` for compatible fixes and `minor` for features or breaking changes.
- From 1.0 onward, use `patch` for fixes, `minor` for compatible features, and `major` for breaking
  changes.
- Every user-visible package change needs a changeset. Internal refactors with no published effect
  do not.
- Stable releases use the npm `latest` tag. Preview releases use Changesets prerelease mode and the
  `next` tag.

Package versions are independent of durable definition, event, and protocol versions. Changing a
workflow's durable protocol may require migration even when the npm change is SemVer-compatible.

## Normal release

1. Add a changeset on the feature branch:

   ```sh
   bun run changeset
   ```

2. Merge the feature PR after CI passes.
3. The Release workflow opens or updates the `Release @swirls/looms` PR.
4. Review its changelog and version. Merging it runs the full verification and packed-package smoke
   tests, publishes to npm, creates the `@swirls/looms@x.y.z` tag, and creates a GitHub release.
5. Confirm the npm page shows provenance and install the released version in a clean project.

Do not run `changeset publish` from a developer checkout during the normal flow.

## Authentication

Publishing uses npm trusted publishing from `.github/workflows/release.yml` in the protected
`npm` GitHub environment. The workflow authenticates through GitHub OIDC and records npm
provenance. Maintainers do not need npm tokens for routine releases.

## Preview releases

Enter prerelease mode on a branch with `bun x changeset pre enter next`, add or update changesets,
and allow the release flow to publish with the `next` tag recorded by Changesets. Exit with
`bun x changeset pre exit` before preparing the next stable release. Never move `latest` to a
preview version.

## Verification and recovery

`bun run check:package` builds every internal package, assembles `@swirls/looms`, inspects the npm
tarball, installs it into a temporary external project, checks JavaScript and declarations, and
runs the CLI. It never publishes.

If a release fails before npm accepts it, fix the cause and rerun the workflow. If npm accepted the
version but tag or GitHub release creation failed, do not reuse or republish that version; create
the matching tag and release from the Version Packages commit. For a bad published version, ship a
fix and move `latest` to it. Use `npm deprecate` for a dangerous version. Avoid unpublishing except
when npm policy and incident response explicitly require it.

If the package published but `latest` points to the wrong version:

```sh
npm dist-tag add @swirls/looms@<good-version> latest
```
