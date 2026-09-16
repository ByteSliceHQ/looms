# Security Policy

## Report a vulnerability

Report suspected vulnerabilities and other security-related issues privately to [security@swirls.ai](mailto:security@swirls.ai). Please do not open a public issue or pull request with details of an undisclosed vulnerability.

Include what you can:

- Affected Looms package and version, or the commit if you are using the repository directly
- Runtime, storage backend, and relevant configuration
- Reproduction steps or a small proof of concept
- Expected behavior, observed behavior, and potential impact
- Any known workaround

An incomplete report is welcome if you suspect a security problem. Remove live credentials, customer data, and private event content from examples. Use systems and data you control for reproductions.

## What to expect

We aim to acknowledge reports within **5 business days**. Maintainers will review the report, ask for missing information when needed, and discuss the impact and next steps with you.

For a confirmed vulnerability, we will coordinate a fix and public disclosure with the reporter. We will communicate affected versions, available fixes or workarounds, and relevant deployment guidance. Resolution time depends on the issue; the acknowledgment target is not a guaranteed fix deadline.

Please allow time for investigation and coordination before publishing exploit details. If you have not received an acknowledgment within five business days, follow up at the same address with the date and subject of your original report.

## Supported versions

Security fixes are applied to the latest published `0.x` release line until `1.0.0`. If you are using an older version, include it in your report so we can assess the impact. Report suspected issues in the current development branch as well.

## Scope and application responsibilities

This policy covers the official Looms packages maintained in this repository. Potential vulnerabilities in Looms' own handling of input, event storage, execution, or data exposure belong here. If you are unsure whether a problem is in Looms or an integration, describe the boundary in your report and we will help triage it.

Looms runs inside an application-controlled environment. Application code, module definitions, effect handlers, tool implementations, configuration, and installed dependencies execute with the privileges the application gives them. Looms does not provide a sandbox for untrusted tools or code.

Your application is responsible for:

- Authenticating callers and authorizing each run operation, including reads and event-stream subscriptions
- Enforcing tenant ownership and deciding which events a caller may submit or receive
- Protecting model credentials and other secrets, and keeping sensitive data out of public logs or browser-visible streams
- Configuring network access, request limits, and any browser or webhook protections needed by the deployment

A run ID does not grant permission to access a run. Event-schema validation does not establish a caller's authority. Keep execution hosts behind an appropriate application boundary.

See [authentication and tenancy](https://looms.sh/docs/security) for deployment guidance and [reliability and recovery](https://looms.sh/docs/reliability) for retry and external-action behavior. These application responsibilities do not exclude reports of defects in Looms' own documented behavior.
