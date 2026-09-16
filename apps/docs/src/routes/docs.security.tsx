import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/security')({
  head: () => pageHead('/docs/security'),
  component: Page,
})

function Page() {
  return (
    <>
      <h1>Authentication and tenancy</h1>

      <p>
        Looms hosts expose execution APIs. Your application supplies authentication, authorization,
        and tenant ownership. A runId is an identifier, not a secret or permission token.
      </p>
      <h2 id="put-an-application-boundary-in-front-of-the-host">
        Put an application boundary in front of the host
        <a
          className="heading-anchor"
          href="#put-an-application-boundary-in-front-of-the-host"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <ol>
        <li>Authenticate a session or service identity.</li>
        <li>Resolve the run's owner from your authoritative database.</li>
        <li>
          Authorize the requested operation: viewing history, sending a message, making a decision,
          or cancelling work.
        </li>
        <li>Validate and construct an allowed event on the server.</li>
        <li>Forward only the authorized request to Looms.</li>
      </ol>
      <p>
        Enforce this for reads and SSE subscriptions as well as writes. Both /runs/:id paths and
        /api/events?runId=... expose run data. For new runs, generate/assign ownership on the
        server; do not trust a tenant ID or arbitrary run ID from a browser.
      </p>
      <h2 id="do-not-expose-unrestricted-event-ingestion">
        Do not expose unrestricted event ingestion
        <a
          className="heading-anchor"
          href="#do-not-expose-unrestricted-event-ingestion"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        A valid schema proves a payload's shape, not its authority. An untrusted client must not
        forge internal lifecycle events, payment outcomes, or another person's approval. Prefer
        purpose-specific application endpoints that accept a user intent and construct a narrow set
        of events.
      </p>
      <h2 id="keep-secrets-and-private-events-server-side">
        Keep secrets and private events server-side
        <a
          className="heading-anchor"
          href="#keep-secrets-and-private-events-server-side"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Model keys, credentials, and service modules stay on the host. Share only browser-safe
        catalogs and projections. A UI projection does not redact its input stream: if you send the
        full log to a browser, that browser can read every event in it. Filter or serve an
        authorized read model when events contain private information.
      </p>
      <h2 id="browser-and-webhook-protections">
        Browser and webhook protections
        <a
          className="heading-anchor"
          href="#browser-and-webhook-protections"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        With cookie sessions, implement your framework's CSRF and origin protections for mutations.
        Configure CORS deliberately. Use TLS. Validate webhook signatures before parsing them as
        commands, cap request sizes, rate-limit starts and signals, and verify provider event IDs
        against a durable deduplication record.
      </p>
      <h2 id="approval-authorization">
        Approval authorization
        <a
          className="heading-anchor"
          href="#approval-authorization"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Authorize the actual approver and operation, not merely the existence of an approval ID.
        Handle race conditions and late replies at the same authoritative boundary. Store enough
        attribution to explain who decided and what inputs they reviewed without placing secrets in
        events.
      </p>
      <h2 id="deployment-boundary">
        Deployment boundary
        <a className="heading-anchor" href="#deployment-boundary" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        The deployment guide disables the public workers.dev endpoint by default. Call the Worker
        through a private service binding or configure an authenticated gateway before enabling a
        public route. A service binding restricts access to the host but does not replace per-user
        authorization in your gateway.
      </p>
    </>
  )
}
