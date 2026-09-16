# Agent instructions

## Commits

Every commit must follow the [Conventional Commits](https://www.conventionalcommits.org/)
specification:

```text
<type>(optional-scope): <imperative summary>
```

Use one of these types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`,
`revert`, `style`, or `test`.

- Keep the summary concise, lowercase, and free of a trailing period.
- Use `feat` for new user-facing behavior and `fix` for user-facing bug fixes.
- Use `!` before the colon and a `BREAKING CHANGE:` footer for breaking changes.
- Do not create commits such as `Update files`, `WIP`, or `Release package`.
- Give pull requests a Conventional Commit title so squash merges remain compliant.
- Run the repository's verification commands before committing.
