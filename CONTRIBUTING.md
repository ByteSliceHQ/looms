# Contributing to Looms

Thanks for helping improve Looms. We welcome code, documentation, examples, bug reproductions, and reviews from people at every experience level. You do not need to be a regular contributor to take part.

Read the [documentation](https://looms.sh/docs) for the project concepts and the [code of conduct](./CODE_OF_CONDUCT.md) for community expectations.

## Choose a contribution

Search [issues](https://github.com/ByteSliceHQ/looms/issues) and [pull requests](https://github.com/ByteSliceHQ/looms/pulls) before starting, so you can build on existing work.

Small fixes and documentation improvements can go straight to a pull request. For a new public API, adapter, or substantial change in behavior, open an issue first. Describe the problem, a concrete use case, and alternatives you have considered. Discussing the approach early can save you work on a change that does not fit the project.

If you are unsure where to begin, open an issue describing the area you would like to help with. Questions and incomplete investigations are welcome when you explain what you know and where you are stuck.

## Report a bug or ask for help

Use the bug report form for a reproducible problem. Include the affected packages and versions, runtime and storage backend, steps to reproduce, and expected versus actual behavior. A small repository or self-contained example is more useful than a large application dump.

For usage questions, check the [troubleshooting guide](https://looms.sh/docs/troubleshooting), then open an issue with enough context for someone else to follow your setup.

Remove API keys, customer data, private prompts, and other sensitive event content before sharing logs or examples. Report suspected vulnerabilities privately to [security@swirls.ai](mailto:security@swirls.ai); see [SECURITY.md](./SECURITY.md).

## Local development

Install Git and [Bun](https://bun.sh). Use the Bun version in the root `package.json` (`1.3.14` at the time of writing). Fork the repository on GitHub, clone your fork, and create a branch for your change:

```bash
git clone https://github.com/YOUR_USERNAME/looms.git
cd looms
git switch -c your-change
bun install --frozen-lockfile
```

Existing development commands:

```bash
bun run verify          # build, type checks, tests, lint, and formatting checks
bun run fmt             # oxfmt (write)
bun run fmt:check       # oxfmt --check
bun run demo            # demo at http://127.0.0.1:8787
bun run docs            # docs at http://127.0.0.1:8788
```

### Useful turbo filters

```bash
bun run build                                  # all packages
bunx turbo run build --filter=@looms/runtime... # runtime + dependencies
bunx turbo run test --filter=@looms/core
bunx turbo run dev --filter=@looms/demo
```

### Optional tools

[Flox](https://flox.dev) provides the repository's configured development environment:

```bash
flox activate
bun install
bun run verify
```

Flox installs the S2 CLI on first activation. Without Flox, use `bun run setup:s2` if you need local S2 support, then follow the command's PATH instructions. See the [S2 CLI installation guide](https://s2.dev/docs/cli/installation) for alternatives. The smaller in-memory examples and SQLite quickstart do not require an S2 account or a model API key.

To run the existing React Doctor audit with the Node runtime provided by Flox:

```bash
flox activate -- bun run doctor
```

## Find your way around

| Path               | Role                                                        |
| ------------------ | ----------------------------------------------------------- |
| `packages/*`       | Libraries in the `@looms/*` namespace                       |
| `apps/demo`        | Interactive demo application                                |
| `apps/demo-worker` | Cloudflare demo backend                                     |
| `apps/docs`        | Source for [looms.sh](https://looms.sh)                     |
| `examples/`        | Small runnable examples and the persisted-review quickstart |
| `docs/`            | Supplementary architecture and protocol notes               |
| `tools/oxlint/`    | Repository lint rules                                       |
| `turbo.json`       | Existing workspace task graph                               |

The [concepts guide](https://looms.sh/docs/concepts) explains runs, threads, events, and effects. For implementation changes, also read the [module guide](https://looms.sh/docs/modules) and [architecture notes](./docs/architecture.md).

## Prepare a change for review

Keep a pull request focused on one problem. Follow the surrounding code conventions and explain any change to public behavior. For work involving persistence or execution, describe the effect on existing event histories, snapshots, and the one-writer-per-run assumption. The [versioning guide](https://looms.sh/docs/versioning) describes those compatibility concerns.

Use the PR template to explain the problem, the resulting behavior, and how a reviewer can evaluate the change. Link related issues and call out uncertainties or tradeoffs. Draft pull requests are welcome if you want feedback before the work is complete.

You are responsible for understanding and being able to explain the changes you submit, whatever tools you use. Keep descriptions and discussions in your own words and grounded in the work.

### Existing PR checklist

- [ ] `bun run verify` passes
- [ ] Changeset added if publishing packages change (`bun run changeset`)
- [ ] Docs updated for API / architecture changes

## Review and participation

Maintainers review contributions for project fit, correctness, compatibility, and clarity. They may request changes or suggest a smaller approach. If a proposal is declined, maintainers should explain the reason so the discussion remains useful to future contributors.

Keep technical decisions in the issue or pull request where others can follow them. Respectful disagreement is welcome. Explain your reasoning, ask questions, and allow room for people to learn or correct a mistake. Review timing depends on maintainer availability; a concise follow-up on the original thread is welcome if it has gone quiet.

## Contribution terms

By intentionally submitting a contribution for inclusion in Looms, you agree to license it under the project's [Apache-2.0 license](./LICENSE), unless a separate agreement explicitly applies. Only submit work you have the right to contribute. Preserve applicable copyright and license notices and identify the source of any code or assets you bring into the repository.
