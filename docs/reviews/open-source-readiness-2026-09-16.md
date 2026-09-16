# Looms open-source readiness assessment

Research and verification date: **September 16, 2026**

Repository: **ByteSliceHQ/looms**

Audited commit: **9a93d1acd48d5310325e51885882386684f06766**

[Machine-readable evidence](./open-source-readiness-evidence-2026-09-16.json)

## Reading this assessment

The findings below describe the audited commit, before the community-documentation updates included alongside this report. Those updates expand the README, contribution guide, and security policy, and add a code of conduct, issue forms, and a PR template. Security and community-conduct reports now use `security@swirls.ai`. The audit evidence remains a record of the original checks; testing, CI, and release-process changes are outside this follow-up. Source links are pinned to the audited commit so the original observations remain reviewable.

## Assessment

**Looms has a credible engineering foundation, but I would not announce a general public release yet.** The largest gaps are the package distribution path, repository access controls, an actionable security contact, and the promises made to first-time users. Adding community files alone would not resolve these.

The codebase already has a license, substantial documentation, automated checks, deterministic examples, persistence tests, and useful security guidance. The verification run succeeded: 54 Turbo tasks, 253 passing tests reported, no failing tests. Sixteen tasks were cached; this is not a claim that every task was freshly executed. GitHub CI also passed on the audited commit.

The most consequential findings are:

1. **The documented release path produces packages that fail an external npm installation.** All 15 inspected npm tarballs retain source entry points; 14 retain `workspace:*` runtime dependencies. Installing the runtime tarball in an isolated directory fails with `EUNSUPPORTEDPROTOCOL`.
2. **None of those 15 tarballs contains a LICENSE, NOTICE, or README.** Repository-level licensing is present; artifact-level distribution is incomplete.
3. **The authoritative branch is unprotected.** GitHub reports no rulesets, no branch protection, no organization-wide 2FA requirement, and write permissions as the Actions default. The production environment has no protection rules.
4. **Security reporting needed an actionable contact.** The audited commit supplied neither an email address nor a direct reporting link. During this review, the project owner selected `security@swirls.ai`, and SECURITY.md was updated accordingly. Mailbox operation and hosted private reporting remain unverified.
5. **The README overstates default durability.** Its example uses the default in-memory store, while its opening promise says restarting the host preserves progress.
6. **Release and community expectations remain unsettled.** The pending Changesets plan produces mixed versions, despite instructions to keep packages on matching versions. There is no code of conduct, public roadmap, maintainer guide, or structured issue/PR intake.

These findings support a controlled developer-preview launch after remediation. They do not establish production readiness, security certification, or a guarantee of adoption.

## What a professional open-source repository needs

There is no single universal repository checklist that ensures success. Three different questions matter: may people legally use and contribute to it; can they obtain and operate it reliably; and will the project sustain a useful relationship with them?

The assessment combines the following primary sources. Requirements belonging to a particular badge or standard are not universal legal requirements.

| Research source                                                                                                                                           | What it contributes to this assessment                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Open Source Guides: starting a project](https://opensource.guide/starting-a-project/)                                                                    | Launch basics: licensing, README, contribution instructions, conduct expectations, review of sensitive history, and people responsible for the project.                                                                           |
| [OpenSSF OSPS Baseline v2026.08.28](https://baseline.openssf.org/versions/2026-08-28)                                                                     | A maturity-based security baseline. Level 1 is the appropriate initial reference; higher levels inform later improvements. This version is the current release at the audit date.                                                 |
| [OpenSSF Best Practices passing criteria](https://www.bestpractices.dev/en/criteria/0)                                                                    | Broader expectations for user/API documentation, feedback, releases, tests, analysis, and vulnerability response. Useful as a continuing improvement plan.                                                                        |
| [OpenSSF Scorecard](https://scorecard.dev/)                                                                                                               | Automated indicators for review, branch protection, dependencies, workflow permissions, packaging, and maintenance. A score is evidence about practices, not proof that software is safe. No Scorecard score was calculated here. |
| [GitHub Actions secure-use reference](https://docs.github.com/en/actions/reference/security/secure-use)                                                   | Least privilege, immutable action references, and protecting privileged workflows from untrusted contributions.                                                                                                                   |
| [npm package metadata](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) and [trusted publishing](https://docs.npmjs.com/trusted-publishers/) | Artifact contents and consumer entry points; a route to authenticated releases without long-lived publishing tokens.                                                                                                              |
| [SLSA v1.2](https://slsa.dev/spec/v1.2/)                                                                                                                  | Separates source/build assurance and provenance from ordinary functional testing. Higher assurance can be adopted incrementally.                                                                                                  |
| [Open Source Guides: governance](https://opensource.guide/leadership-and-governance/) and [community](https://opensource.guide/building-community/)       | Explicit ownership, contribution decisions, accessible discussion, and responsive maintenance.                                                                                                                                    |
| [CHAOSS: time to first response](https://www.chaoss.community/kb/metric-time-to-first-response/)                                                          | Measures whether users and contributors receive human responses; automated acknowledgments should be excluded.                                                                                                                    |

My practical launch standard for Looms is therefore:

| Area                     | Evidence an outsider should be able to obtain                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Legal clarity            | Recognizable license; included notices; clear contribution terms; reviewed ownership of imported code and assets.             |
| Immediate usefulness     | A clear problem statement, working installation, an executable first example, and accessible documentation.                   |
| Honest scope             | Explicit preview/stability status, supported environments, architectural limits, and responsibility boundaries.               |
| Reproducible development | A locked toolchain/dependency path, a documented check command, and passing checks on the actual release commit.              |
| Dependable distribution  | Installable release artifacts, correct exports/types, compatible package versions, release notes, and traceability to source. |
| Security operations      | Enforced access controls, protected credentials, practical reporting and response, and recurring dependency/code review.      |
| Contribution experience  | Findable maintainers, conduct rules, issue/PR instructions, understandable review expectations, and useful starter work.      |
| Ongoing stewardship      | A bounded roadmap, allocated maintainer time, a backup for privileged access, and a realistic support policy.                 |

A small project does not need a foundation, several chat communities, a paid support program, a mandatory CLA, or a perfect badge score to meet this practical standard. Those are choices to make when justified, not reasons to delay useful work indefinitely.

## Peer comparison: adopt the useful patterns

Two closely related SDK repositories provide concrete reference points. These are qualitative examples, not evidence that copying their structure causes adoption.

| Project                                                                 | Observable practice                                                                                                                                                                                                    | Application to Looms                                                                                                          |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [Temporal TypeScript SDK](https://github.com/temporalio/sdk-typescript) | Separates client/worker installation; links guides, examples, and API reference; states supported runtimes and distinguishes believed compatibility from regularly tested support; explains package version alignment. | Publish a package/environment support table and give consumers an installation path before monorepo development instructions. |
| [Inngest JavaScript SDK](https://github.com/inngest/inngest-js)         | Presents executable usage, framework integration, documentation links, and explicit runtime/TypeScript support expectations.                                                                                           | Make the first durable result easy to reach and define what compatibility Looms will maintain.                                |

Adjacent server projects are not interchangeable licensing precedents. Restate's server currently uses BSL 1.1, and Inngest distinguishes its server/CLI licensing from its Apache-licensed SDKs. Looms' Apache-2.0 choice is already a clear starting point; copying a competitor's repository would not justify copying its license. [Restate license](https://github.com/restatedev/restate/blob/main/LICENSE), [Inngest licensing statement](https://github.com/inngest/inngest/blob/main/README.md).

## Detailed comparison with established projects

Additional review requested by the project owner: contribution guide, security policy, and related repository practices. References include Vite, React, Fastify, and the Temporal/Inngest SDKs above. These projects are useful examples of established maintenance, not a representative statistical sample of successful projects.

**Looms' engineering documentation is further along than its contributor and maintainer documentation.** Its local workflow is usable, and its operational guides discuss real failure modes. An outsider still has to infer how to participate, what will be supported, who decides, and how a release earns trust.

| Item                   | Established-project example                                                                                | Looms assessment                                                                                             | Appropriate launch improvement                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Contribution guide     | Vite documents setup, tests, dependency choices, review, and releases.                                     | **Partial:** useful commands and layout, little contribution decision process.                               | Explain accepted work, proposal routing, regression tests, changesets, and review expectations.             |
| Beginner entry point   | Fastify's informal guide welcomes documentation/help/bug fixes and distinguishes minor PRs from proposals. | **Missing:** no starter backlog or explicit non-code contribution path.                                      | Offer a few scoped issues and explain how docs, reproductions, and reviews help.                            |
| Security reporting     | Fastify describes triage, coordination, publication, contacts, and team responsibility.                    | **Basic:** reporting address now supplied; response target and report fields exist.                          | Add scope, support precision, and a short description of handling and disclosure.                           |
| Security boundaries    | Vite names trusted and untrusted inputs and gives scope examples.                                          | **Good underlying content, weak policy linkage:** application auth/tenancy boundaries exist in product docs. | Link that material from SECURITY.md and clarify library defects versus application responsibilities.        |
| Support lifecycle      | Vite's release page distinguishes maintained lines, prereleases, deprecation, and migration.               | **Ambiguous:** “latest published 0.x release line” does not specify backports or compatibility.              | State which minor line receives fixes, how long older lines last, and how breaking changes are signaled.    |
| Issue intake           | Vite's bug form requests reproduction, environment, and relevant logs, and routes questions elsewhere.     | **Absent:** GitHub issues enabled, no forms or routing.                                                      | Request package/version, Bun/host/storage details, reproduction, expected/actual result, and redacted logs. |
| Pull-request intake    | Vite's template asks for the problem, alternatives, docs, and regression tests.                            | **Partial:** three checklist items only in CONTRIBUTING.                                                     | Put review evidence in the PR itself; allow an explanation when tests are inapplicable.                     |
| Maintainer ownership   | Fastify's governance defines roles, collaborator growth, and decisions.                                    | **Absent:** no published maintainer roles or authority.                                                      | One short maintainer document naming release/security/triage responsibility and how decisions are made.     |
| Consumer compatibility | Temporal separates tested support from plausible compatibility.                                            | **Partial:** scattered environment guidance, no package-wide contract.                                       | One supported-environments table tied to CI and artifact tests.                                             |
| Release execution      | Vite describes approval, publishing, verification, and recovery.                                           | **Material gap:** manual process plus reproducibly broken external package install.                          | Fix the packaging contract and rehearse releases before adding process polish.                              |

Sources for those comparisons: [Vite contribution guide](https://github.com/vitejs/vite/blob/main/CONTRIBUTING.md), [Fastify informal contribution guide](https://github.com/fastify/fastify/blob/main/docs/Guides/Contributing.md), [Fastify security policy](https://github.com/fastify/fastify/blob/main/SECURITY.md), [Vite security policy](https://github.com/vitejs/vite/blob/main/.github/SECURITY.md), [Vite releases](https://vite.dev/releases), [Vite bug form](https://github.com/vitejs/vite/blob/main/.github/ISSUE_TEMPLATE/bug_report.yml), [Vite PR template](https://github.com/vitejs/vite/blob/main/.github/PULL_REQUEST_TEMPLATE.md), [Fastify governance](https://github.com/fastify/.github/blob/main/GOVERNANCE.md), [Temporal SDK](https://github.com/temporalio/sdk-typescript).

### CONTRIBUTING.md: useful setup notes, incomplete contributor guidance

The current guide tells someone who already knows what to change how to run the repository. It does not adequately help a newcomer decide what work is welcome or how to get a change accepted.

I would retain the existing commands and package map, then add this compact structure:

1. **Ways to contribute.** Bugs, documentation, reproductions, examples, adapters, and tests; link suitable issues and identify current priorities.
2. **Before starting.** Search existing work. Small fixes can go straight to a PR; discuss new public APIs, storage semantics, and large refactors first.
3. **Development setup.** Clone/fork instructions, the tested Bun version, frozen install, and the smallest useful check commands. Explain when optional S2/Flox tooling is needed.
4. **Design expectations.** Preserve deterministic reducers, event/replay compatibility, single-writer assumptions, browser/server separation, and explicit failure handling. Link architecture docs instead of duplicating them.
5. **Testing expectations.** Show one targeted test command. A bug fix should normally include a regression test; changes to recovery should exercise restart behavior; documentation-only fixes do not need invented tests.
6. **Submitting a PR.** Explain the problem and resulting behavior, link the issue, provide verification, update affected docs, and add a changeset when shipped behavior changes.
7. **Review and decisions.** Name maintainers, explain how disagreements and incompatible proposals are resolved, and state realistic response expectations.
8. **Contribution terms and conduct.** Link license/conduct rules and state any adopted DCO/CLA policy. Do not silently introduce an agreement without a project decision.

An AI contribution policy is also a choice worth making explicitly for Looms. Vite and Fastify now set expectations about human understanding and responsibility, although their policies differ. My recommendation is that the submitter must understand, review, and test every change, including generated changes. Whether to require disclosure or prohibit particular submission methods is a project decision. [Vite AI policy](https://github.com/vitejs/vite/blob/main/CONTRIBUTING.md#ai-policy), [Fastify contribution rules](https://github.com/fastify/fastify/blob/main/CONTRIBUTING.md#rules).

### SECURITY.md: contact fixed; scope and handling still need definition

The project owner selected **security@swirls.ai**, and that is now the reporting address in SECURITY.md. No email was sent, so delivery and on-call coverage have not been tested.

The existing five-business-day acknowledgment goal is reasonable as a stated initial commitment if the team can meet it. For context, Fastify documents a four-business-day triage target plus a coordinated correction/publication process. Looms does not need to adopt Fastify's organization or exact timelines. It needs a policy that describes its own capacity. [Fastify security policy](https://github.com/fastify/fastify/blob/main/SECURITY.md).

I would add four things:

- **Exact scope:** which official packages are covered; whether demo deployments are covered; which inputs Looms treats as trusted. Document application-supplied authentication, tenant authorization, tool permissions, and model credentials without excusing defects in Looms' own guarantees.
- **Exact support:** clarify whether only the newest minor line is patched and what users of older releases should do. Before the first release, state that support applies to the preview/current development state as appropriate.
- **After reporting:** acknowledgment, triage, follow-up questions, coordination of a fix, and publication of an advisory when warranted. Promise response/update behavior the team can sustain; avoid a universal guaranteed fix deadline.
- **Safe reproductions:** ask reporters to remove customer data and live credentials, use controlled environments, and agree on disclosure timing. Do not invent a bug bounty, legal safe-harbor promise, or external escalation service.

Looms already has useful threat-boundary material in its product security docs. Bringing that into the policy by reference is more valuable than adding generic assurances. Vite illustrates how concrete scope examples reduce ambiguity. [Vite security policy](https://github.com/vitejs/vite/blob/main/.github/SECURITY.md).

### File length and project size are poor targets

React's root CONTRIBUTING.md is a short link to a longer guide, and its root SECURITY.md points to a separate responsible-disclosure program. The linked contribution page is on React's legacy documentation site, so its old tooling instructions should not be treated as current setup recommendations. The useful observation is structural: a short entry file works when the linked process exists. [React CONTRIBUTING](https://github.com/react/react/blob/main/CONTRIBUTING.md), [React SECURITY](https://github.com/react/react/blob/main/SECURITY.md), [legacy linked guide](https://legacy.reactjs.org/docs/how-to-contribute.html).

For Looms, a focused contribution guide, a short actionable security policy, a conduct policy with a real contact, two issue forms, a PR template, a small roadmap, and a maintainer-responsibility document are sufficient initial documentation scope. Several can share a document. The stronger projects' lesson is to make decisions and responsibilities visible, not to accumulate filenames.

The changes above are recommendations. Only the requested security email has been applied; contribution rules, response obligations, licensing agreements, and release policies have not been imposed on the project.

## What Looms already does well

- **Source licensing is explicit.** Root LICENSE and NOTICE identify Apache-2.0 and ByteSlice. GitHub recognizes the license. Package manifests consistently declare Apache-2.0.
- **Local development is functional.** Frozen dependency installation succeeded. All 15 package builds succeeded. The five small examples completed without model-provider credentials.
- **Tests cover meaningful behavior.** Coverage includes stores, replay/folding, idempotency, wake scheduling, snapshots, actors, event streaming, and property tests. The quickstart's approval/rejection examples are tested across separate processes in [durable-review.test.ts](https://github.com/ByteSliceHQ/looms/blob/9a93d1acd48d5310325e51885882386684f06766/examples/durable-review.test.ts#L8).
- **The product documentation is considerably beyond a README.** It addresses authorization, tenancy, external-effect retries, recovery, version changes, retention, operations, and troubleshooting. The [reliability guide](https://github.com/ByteSliceHQ/looms/blob/9a93d1acd48d5310325e51885882386684f06766/apps/docs/src/routes/docs.reliability.tsx#L16) expressly avoids an exactly-once external-action guarantee.
- **The documented deployment boundary is sensible.** The Cloudflare example disables public `workers.dev` and preview URLs. The [security guide](https://github.com/ByteSliceHQ/looms/blob/9a93d1acd48d5310325e51885882386684f06766/apps/docs/src/routes/docs.security.tsx#L16) states that applications supply authentication and per-run authorization.
- **CI exists and works.** It builds libraries/apps/docs, checks types, runs tests and lint/format checks, and gates documentation deployment on verification. Its explicit `contents: read` setting is good despite the broader repository default. [CI workflow](https://github.com/ByteSliceHQ/looms/blob/9a93d1acd48d5310325e51885882386684f06766/.github/workflows/ci.yml#L8), [successful audited run](https://github.com/ByteSliceHQ/looms/actions/runs/35056373089).
- **The scans did not reveal a confirmed secret or reported dependency advisory.** This is bounded evidence, described below, rather than a security clearance.

## Prioritized findings and acceptance criteria

Priority definitions: **P0** blocks the relevant launch gate; **P1** should be completed for a professional public launch or before making the associated support claim; **P2** is a scheduled improvement. “Owner” names a proposed responsibility, not an assignment to a particular person.

### F01 — Protect the authoritative repository and privileged access

**P0 before opening. Confirmed. Owner: repository/organization administrator.**

Live GitHub reads returned `main.protected=false`, no rulesets, and “Branch not protected” for the protection endpoint. ByteSliceHQ does not enforce 2FA organization-wide. This does **not** prove that individual maintainers lack 2FA. The organization's default repository permission is read, which is a positive control.

**Acceptance:** require pull requests and the actual verification check before merging; prevent unreviewed bypasses, force-pushes, and accidental deletion; document tightly scoped emergency access. Enforce MFA for privileged identities, review collaborator access, and identify a backup administrator. Require an independent reviewer where maintainer staffing permits; disclose any sole-maintainer exception instead of pretending independent review exists.

The directly relevant baseline controls are AC-01.01 (MFA), AC-03.01 (direct commits), and AC-03.02 (primary-branch deletion). The remaining selected launch mappings are BR-07.01 (secrets), LE-03.02 (release licensing), and VM-02.01 (security contacts). This is a partial mapping, not a full compliance assessment. [OSPS Baseline](https://baseline.openssf.org/versions/2026-08-28).

### F02 — Establish ongoing secret prevention and finish the disclosure review

**P0 before opening. Partly verified; remaining human review required. Owner: security maintainer and IP owner.**

GitHub reports secret scanning and push protection disabled. Gitleaks 8.30.1 was run against local history with `--all` and against an archive of current tracked files. Each scan reported the same false positive: the demo object field `p99_latency_ms`. No actual credential was confirmed.

Git reports 45 locally reachable commits; Gitleaks reports 43 scanned commits. Git also emits a negative-pattern warning from `.gitattributes`. The scan does not clear remote-only refs, PR discussions, CI artifacts/logs, deleted remote branches, or untracked local files.

[docs/swirls-adapter.md](https://github.com/ByteSliceHQ/looms/blob/9a93d1acd48d5310325e51885882386684f06766/docs/swirls-adapter.md#L1) contains internal product integration plans and names. That is a disclosure-review candidate, **not** an assertion of confidential information or a credential leak.

**Acceptance:** scan the complete set of refs intended for public release; review artifacts and internal documents; approve ownership and intended disclosure of code/assets; triage narrowly scoped false positives; fix the attributes warning; enable ongoing secret detection and push protection when available. If any real credential is discovered, revoke/rotate it before relying on history removal. Record the reviewed commit and reviewer. See [GitHub repository security guidance](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories).

### F03 — Provide a working private vulnerability contact

**P0 contact gap addressed in this working tree; operational verification remains. Owner: security maintainer.**

At the audited commit, SECURITY.md said to “email” via GitHub Security Advisories, but contained no address, named contact, or direct reporting link. The project owner subsequently supplied **security@swirls.ai**; [SECURITY.md](../../SECURITY.md#report-a-vulnerability) now links that address as the private reporting route. It does give useful report fields and a five-business-day acknowledgment goal. The reporting API returned 404 while the repository is private; this cannot establish how reporting will behave after publication.

**Acceptance:** name the responsible team, provide a monitored private contact, link the reporting form after enabling it, and verify the route from an outsider's perspective. Define which released versions receive fixes and how advisories/updates will be communicated. GitHub documents private reporting for **public** repositories, so test it as part of the visibility transition. [GitHub private reporting](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository).

### F04 — Repair the package publishing contract

**P0 before npm release or an installation-based announcement. Reproduced. Owner: release maintainer.**

[Releasing instructions:21](https://github.com/ByteSliceHQ/looms/blob/9a93d1acd48d5310325e51885882386684f06766/docs/releasing.md#L21) say `publishConfig` rewrites exports for npm and suggest `bunx changeset publish`. The installed Changesets 2.31.1 implementation selects npm for this Bun workspace. Inspecting npm-built tarballs after a successful library build showed:

- All 15 `main` entry points still target `./src/index.ts`.
- Fourteen manifests retain `workspace:*` production dependencies.
- The runtime artifact includes compiled output, but its consumer-facing metadata still points to source.
- An isolated install of `looms-runtime-0.1.0.tgz` fails with `Unsupported URL Type "workspace:": workspace:*`.

This is not evidence that someone already published a broken version. No publishing operation was performed. It proves the currently documented packaging assumptions need correction. Compare the [runtime manifest](https://github.com/ByteSliceHQ/looms/blob/9a93d1acd48d5310325e51885882386684f06766/packages/runtime/package.json#L16) with [npm's metadata semantics](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/).

**Acceptance:** choose one explicit packing/publishing implementation and test its output. Every runtime dependency must use a registry-resolvable version; all exports, declarations, CSS exports, CLI paths, and included files must resolve in the tarball. Install the complete release set into a clean consumer outside this repository, run the durable quickstart, test the CLI, type-check a consumer, and bundle the React client. Use a local test registry or equivalent isolated fixture for unpublished sibling packages. Test supported execution environments; do not assume switching entry points to `dist` establishes Node compatibility.

Add these artifact checks to CI. Keep the same tested tarballs through publication rather than rebuilding different artifacts after approval.

### F05 — Include licenses, notices, and useful package documentation

**P0 for release licensing; P1 for package README quality. Reproduced. Owner: release maintainer and IP owner.**

All 15 npm tarballs lack LICENSE, NOTICE, and README files. All package directories lack package-level README/LICENSE files. A root monorepo license is present, but is not carried into these artifacts by the tested packaging path.

**Acceptance:** include applicable license and notice texts in each distributable; retain third-party attributions; add a short package README with purpose, installation, supported environments, a minimal example, and canonical links. Audit the provenance of copied UI code, artwork, and vendored tooling. A shadcn MIT notice exists in the docs UI directory; that is good evidence for that directory, not a complete inventory of all copied code.

Apache-2.0 addresses license delivery and preservation of relevant notices. This audit identifies a packaging gap; it does not determine ownership or provide a full license-compatibility opinion. [Apache License, section 4](https://www.apache.org/licenses/LICENSE-2.0).

### F06 — Make first-release versioning internally consistent

**P0 before first package release. Reproduced. Owner: release maintainer.**

[Releasing instructions:30](https://github.com/ByteSliceHQ/looms/blob/9a93d1acd48d5310325e51885882386684f06766/docs/releasing.md#L30) describe a first `0.1.0` release. Current manifests already use `0.1.0`; pending minor changesets make `changeset status` plan `0.2.0` for 13 publishable packages and `0.1.1` for `@looms/debugger` and `@looms/ai-vercel`.

[Changeset configuration](https://github.com/ByteSliceHQ/looms/blob/9a93d1acd48d5310325e51885882386684f06766/.changeset/config.json#L5) has an empty fixed group and links only nine packages. The docs quickstart tells users to keep all `@looms/*` versions matching. Linked groups do not guarantee that every member is released together; fixed groups do. [Changesets linked packages](https://changesets.dev/guide/linked-packages), [fixed packages](https://changesets.dev/guide/fixed-packages).

**Acceptance:** decide whether the supported release unit is a single coordinated SDK or independently versioned packages. If all versions must match, use a complete fixed group and prove it in a dry versioning run. Otherwise document and validate compatible ranges. Select the actual inaugural version deliberately, reconcile pending changesets, generate release notes, and create source tags. No tags or GitHub releases were present at audit time. State breaking-change expectations during `0.x`; SemVer permits instability before `1.0`, but that alone is not a useful support promise. [SemVer](https://semver.org/).

### F07 — Align onboarding and durability claims with actual behavior

**P0 before a broad announcement. Confirmed. Owner: SDK/documentation maintainer.**

[README:9](https://github.com/ByteSliceHQ/looms/blob/9a93d1acd48d5310325e51885882386684f06766/README.md#L9) promises durability by default, while [createLooms:103](https://github.com/ByteSliceHQ/looms/blob/9a93d1acd48d5310325e51885882386684f06766/packages/runtime/src/looms.ts#L103) selects an in-memory store when none is supplied. The README's main example omits a persistent store. The separate reliability guide correctly explains the distinction.

The README leads with `bun install` without clone/directory instructions or a consumer package-install path. Its canonical docs link points to localhost. The site has a much stronger persisted-review tutorial, but its npm installation currently cannot succeed: unauthenticated registry reads for runtime, core, and react returned 404. This verifies those public package endpoints, not ownership of the npm scope. The public docs quickstart returned HTTP 403 to this audit client; access restrictions or bot filtering could explain it, so an ordinary-browser check remains necessary.

**Acceptance:** make the persisted-review example the primary entry point, show clone instructions separately, put the supported runtime and preview status near the top, and link a publicly reachable docs URL. Qualify persistence and single-writer requirements beside the claim. Prove a new user can install, start, exit, resume, and approve a run using only the public instructions. Include the debugger in the package inventory if it is part of the supported release.

### F08 — Harden CI and documentation deployment

**P1 before accepting outside contributions. Confirmed. Owner: repository administrator and CI maintainer.**

GitHub's default workflow permission is `write`, and Actions can approve pull requests. The current workflow overrides its token to `contents: read` and deploys only on a main-branch push after verification; those protections deserve credit. However, actions use mutable major-version tags, and the `production` environment has neither protection rules nor deployment branch restrictions.

**Acceptance:** change defaults to least privilege, disable Actions approving PRs unless a specific reviewed workflow needs it, pin actions to verified commit SHAs, and protect privileged workflow changes. Restrict production deployment to the intended branch and choose an explicit reviewer policy. Verify fork-workflow approval behavior after publication; its API returned 422 while private. Keep untrusted PR execution isolated from deploy/publish credentials. [GitHub secure-use reference](https://docs.github.com/en/actions/reference/security/secure-use).

### F09 — Create repeatable security maintenance

**P1 for launch. Confirmed settings/configuration gaps. Owner: security maintainer.**

GitHub reports Code Security and Dependabot security updates disabled. The CodeQL default-setup endpoint says Code Security must be enabled. There is no committed Dependabot/Renovate configuration or dedicated security-scanning workflow. Existing lint/type analysis is useful and should not be described as absent static analysis.

`bun audit --json` returned `{}` with exit 0 on the installed lockfile. That is a snapshot of the audit service's known advisories, not a source-code security assessment or proof that every dependency is safe.

**Acceptance:** choose an updater that supports the actual Bun workspace/lockfile; review grouped update PRs; schedule dependency auditing and security-oriented static analysis; document who triages findings and what blocks a release. Evaluate the effect of the pinned Effect release candidate and other prerelease build dependencies. Do not require replacing them merely because they are prereleases; either accept and document the risk or select a supported stable baseline.

The optional S2 installer dynamically selects a release and extracts a downloaded executable without checking a checksum/signature. Pin and verify that tool for reproducible setup, or keep it clearly optional and outside the basic contributor path. [Installer](https://github.com/ByteSliceHQ/looms/blob/9a93d1acd48d5310325e51885882386684f06766/scripts/install-s2-cli.sh#L91).

### F10 — Document and test supported environments

**P1 before claiming support. Confirmed gap in published-package contract. Owner: SDK maintainer.**

The root pins Bun 1.3.14 and declares `>=1.3.0`. None of the 15 publishable manifests declares an engine requirement. CI exercises one Ubuntu/Bun combination. Docs explain some Bun and Cloudflare distinctions, but there is no consolidated support contract across core/runtime, CLI, browser clients, React, and adapters.

Cloudflare tests mock `cloudflare:workers`, the namespace, SQL storage, and alarms. These are valid unit tests, not an execution test in workerd. PostgreSQL has an adapter without a corresponding PostgreSQL integration test in the inspected suite.

**Acceptance:** define supported Bun versions, browser/React/TypeScript expectations, whether Node is supported, and which adapters are experimental. Add artifact smoke tests for those promises and real host/storage integration checks for promoted adapters. Document unsupported environments rather than adding a large matrix without a user need.

### F11 — Make the authentication boundary difficult to miss

**P1 for SDK launch; required before promoting public hosting examples. Confirmed design tradeoff. Owner: runtime/security maintainer.**

The security guide correctly delegates authentication and tenancy to the application. The built-in Bun server nevertheless defaults to `0.0.0.0`, and the README does not surface the trust boundary near setup. This is not a newly proven authorization bypass: the runtime is designed to sit behind an application boundary. It is a misuse risk for users copying a host example.

**Acceptance:** consider loopback as the local default, require an explicit public bind when appropriate, and place deployment/authentication instructions beside serving examples. Supply a narrow authenticated gateway example and tests showing cross-tenant read/SSE/write denial and approved event construction. Document prompt/tool execution as application code with application-granted privileges; Looms should not imply that an agent tool is automatically sandboxed. [Server default](https://github.com/ByteSliceHQ/looms/blob/9a93d1acd48d5310325e51885882386684f06766/packages/runtime/src/server.ts#L303), [security guide](https://github.com/ByteSliceHQ/looms/blob/9a93d1acd48d5310325e51885882386684f06766/apps/docs/src/routes/docs.security.tsx#L16).

### F12 — Add community intake and explain decision-making

**P1 for a professional launch. Confirmed. Owner: lead maintainer.**

GitHub recognizes README, LICENSE, and CONTRIBUTING but no code of conduct, issue template, or pull-request template. Its community profile returns 57%; that is GitHub's file-oriented metric, not this audit's readiness score. Issues are enabled, Discussions is disabled, and there are no open issues. Discussions is optional: issues can provide the initial public conversation channel.

CONTRIBUTING explains local commands and a three-item PR checklist, but not how to propose substantial changes, report a reproducible bug, choose starter work, interpret compatibility requirements, or find responsible maintainers. No CODEOWNERS, maintainer/governance document, or public roadmap is tracked.

**Acceptance:** add a code of conduct with a monitored enforcement route; bug/feature forms; a PR template; support routing; named maintainer responsibilities; and a brief roadmap with explicit non-goals. Document contribution licensing and discuss whether a DCO is useful; a CLA is not automatically required. Identify who owns releases, security responses, docs, and triage, plus a backup for privileged operations. Seed a small set of genuinely scoped contribution issues. [Starting a project](https://opensource.guide/starting-a-project/), [governance guidance](https://opensource.guide/leadership-and-governance/).

### F13 — Establish release provenance and recovery procedures

**P1 for ongoing releases; strongly preferred for the first public package release. Confirmed process gap. Owner: release maintainer.**

Releases are intentionally manual. There is no publishing workflow, and therefore no repository evidence of reproducible publication, protected release credentials, provenance, or recovery from a partially published package set. Manual release is not inherently disqualifying if the exact process is tested and controlled.

**Acceptance:** build and validate immutable tarballs from an identified commit; publish using a restricted maintainer process or protected CI job; retain release notes and source tags; document partial-failure recovery and correction/deprecation of a bad package version. Verify npm scope access separately.

Prefer npm trusted publishing from GitHub Actions once configured. Current npm guidance requires a sufficiently recent npm/Node toolchain; automatic provenance applies to public packages from public repositories. This means pre-opening artifact rehearsal and post-opening publication are separate steps. Check first-package bootstrap and per-package trusted-publisher configuration rather than assuming it exists. [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

For later assurance, map the actual builder and attestation workflow to SLSA requirements. An npm provenance badge alone is not a claim of a particular SLSA level. [SLSA specification](https://slsa.dev/spec/v1.2/).

### F14 — Make durable compatibility a tested release property

**P1 before production-readiness claims; P2 expansion after preview. Partial coverage. Owner: runtime maintainer.**

Current tests meaningfully exercise recovery and replay. The versioning guide also correctly states that historical code bundles are not automatically pinned and protocol version metadata is not a migration engine. What is not established is a continuing release-to-release compatibility suite for logs, snapshots, modules, and adapters.

**Acceptance:** preserve representative released history/snapshot fixtures; test new code against old runs; specify supported upgrade paths and rollback limits. Add controlled fault cases around an external action succeeding before its outcome is recorded, duplicate delivery, and actor wake/storage failures. Publish measured workload limits only after reproducible tests. No benchmark harness or performance budget was identified in the tracked tree; that does not mean performance is poor. [Versioning guide](https://github.com/ByteSliceHQ/looms/blob/9a93d1acd48d5310325e51885882386684f06766/apps/docs/src/routes/docs.versioning.tsx#L16).

### F15 — Improve discoverability and allocate maintenance time

**P1 for launch presentation; P2 for ongoing measurement. Confirmed metadata gaps. Owner: project lead.**

GitHub's description and homepage are empty and topics are absent. Package READMEs are absent. The repository has no published roadmap or support routing. The docs site and core positioning already provide material to solve this without inventing a new brand.

**Acceptance:** set an accurate description/homepage/topics, link consumer docs and examples, identify experimental components, and state why users would choose Looms and when they should choose a different approach. Put genuine CI/version/license links where useful; do not add unearned security badges.

Allocate human time for issues and reviews before announcing. Responsive maintenance and understandable public decisions matter after launch; opening several social channels without capacity would spread that effort thin. [Building welcoming communities](https://opensource.guide/building-community/).

## Recommended launch sequence

These gates distinguish safe source disclosure from a working package release. Package publication does not have to precede making an explicitly experimental repository public.

| Gate                                 | Work and proposed owners                                                                    | Evidence needed to proceed                                                                                                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Open the source safely**        | Administrator: F01. Security/IP owners: F02–F03. Lead maintainer: basic F12.                | Approved disclosure/ownership review, scanned intended refs, enforced access controls, reachable security contact, clear experimental status and contribution expectations. Recheck public-only controls immediately after visibility changes. |
| **B. Ship an installable preview**   | Release maintainer: F04–F06, F13. Docs/SDK maintainer: F07, F10.                            | Correctly licensed tarballs; clean external install; durable start/stop/resume tutorial; coherent versions; documented support matrix; release notes/tags; public docs reachable in a normal browser.                                          |
| **C. Announce and support it**       | CI/security owners: F08–F09, F11. Lead maintainer: F12, F15.                                | Protected contribution/deployment path, routine scanning, support routing, small public roadmap, named triage/release coverage, accurate claims.                                                                                               |
| **D. Earn broader production trust** | Runtime/adapter maintainers: F10/F14 expansion. Release maintainer: stronger F13 assurance. | Real-host integration tests, upgrade fixtures, failure/recovery evidence, measured limits, and user feedback from actual deployments.                                                                                                          |

Suggested implementation batches, in dependency order:

1. Repository protection, access review, disclosure review, and actionable SECURITY.md.
2. Package staging/packing, artifact notices/READMEs, external-consumer checks, and version policy.
3. Public README/docs path, runtime support declarations, and safe deployment examples.
4. Contribution/community files, roadmap, updater/scanning configuration, and hardened release automation.

Do not turn every P2 improvement into a preview blocker. The release artifact failure and absent protections are substantially more important than badges, an elaborate governance model, or a broad benchmark program.

## How to judge success after launch

These are proposed Looms operating targets to agree with maintainers, not thresholds prescribed by the cited standards.

| Outcome                              | Initial measurement                                                                                                                                                                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A developer gets value quickly       | Observe three developers unfamiliar with Looms completing the install/restart/approval tutorial; record blockers and elapsed time. Aim for a reliable path within roughly 15 minutes.                                               |
| Users receive useful help            | Track median and 90th-percentile time to first human response; begin with a two-business-day triage target if staffing permits. Preserve the existing five-business-day security acknowledgment target unless deliberately revised. |
| Outside contributions remain welcome | Track first PRs that receive review, time to first review, and return contributors. Distinguish maintainer delays from contributor wait time.                                                                                       |
| Releases work                        | Require every supported artifact smoke test to pass; track installation regressions and emergency corrective releases.                                                                                                              |
| Users can upgrade safely             | Maintain compatibility fixtures and record upgrade issues by release.                                                                                                                                                               |
| The project is sustainable           | Review unattended issues, privileged-access backup coverage, and maintainer time monthly. Re-scope support if commitments exceed capacity.                                                                                          |

CHAOSS supports tracking first-response time while excluding bots. The target numbers above are my suggested starting points, not research-derived universal benchmarks. Stars/downloads can provide context but cannot establish successful installations, retention, or reliable operation. [CHAOSS response metric](https://www.chaoss.community/kb/metric-time-to-first-response/).

## Verification record and limits

| Check                                 | Result                                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Git state before audit                | Clean at the identified commit; GitHub main matched it.                                                                                                 |
| Frozen dependency installation        | Passed after allowing required filesystem/network access; 1,166 packages installed. No lockfile change.                                                 |
| `bun run verify`                      | Passed outside the restricted sandbox: 54/54 Turbo tasks successful, 16 cached; output reported 253 passing tests, zero failures. Lint warnings remain. |
| Package builds                        | All 15 completed.                                                                                                                                       |
| `bun run examples`                    | All five scripts completed successfully.                                                                                                                |
| npm pack inspection                   | All 15 packed after build; all retain source main entry points and omit license/notice/README; 14 retain workspace production dependencies.             |
| Isolated runtime tarball installation | Failed reproducibly with `EUNSUPPORTEDPROTOCOL`.                                                                                                        |
| Changesets status                     | Planned mixed `0.2.0` and `0.1.1` publishable versions. No version mutation performed.                                                                  |
| Public package lookup                 | Runtime/core/react endpoints returned 404.                                                                                                              |
| Public docs URL                       | Quickstart returned 403 to this client; ordinary-browser accessibility remains unverified.                                                              |
| Dependency audit                      | `bun audit --json` returned `{}`, exit 0.                                                                                                               |
| Secret scans                          | Current tracked tree and local history each reported the demo-field false positive; no confirmed credential.                                            |
| Hosted controls                       | Read through authenticated GitHub APIs; details preserved in the evidence JSON. No settings were changed.                                               |

The local toolchain was Bun `1.4.0-canary.1`, npm `11.12.1`, Changesets `2.31.1`, and Gitleaks `8.30.1`; CI pins Bun `1.3.14`. Initial tests failed because dependencies were incomplete and later because the sandbox denied localhost listeners. Those failures were resolved and are not reported as Looms defects. The successful local run is not a clean-clone verification on every advertised platform; existing CI supplies additional evidence for its pinned environment.

During the audit itself, the only change to an existing repository file was the owner-requested security contact in SECURITY.md. The later community-documentation updates are described at the top of this report. No runtime source-code fixes, GitHub settings changes, visibility changes, package publication, external messages, or deployments were made. The other added files record research and findings. Ownership authorization, npm administration/recovery, real user onboarding, and a full threat model remain human/process or follow-up engineering checks. Revalidate settings and artifacts against the final release commit; this report is a point-in-time assessment, not an evergreen assurance statement.
