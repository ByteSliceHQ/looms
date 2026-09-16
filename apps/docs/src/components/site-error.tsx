import { Link } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

import { Illustration } from '../illustrations/illustration'
import type { IllustrationName } from '../illustrations/scenes'

function SiteStatusPage({
  code,
  title,
  description,
  illustration,
  detail,
  onNavigate,
}: {
  code: string
  title: string
  description: string
  illustration: IllustrationName
  detail?: string
  onNavigate?: () => void
}) {
  return (
    <main
      id="main-content"
      className="site-error mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-[68rem] flex-col justify-center px-5 py-12 md:px-8 md:py-20"
    >
      <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-16">
        <div className="site-error-copy order-2 md:order-1">
          <p className="text-muted mb-5 font-mono text-xs tracking-widest uppercase">{code}</p>
          <h1 className="text-foreground mb-4 text-3xl leading-tight font-medium tracking-tight md:text-4xl">
            {title}
          </h1>
          <p className="text-body mb-8 max-w-[28rem] text-[1.05rem] leading-relaxed">
            {description}
          </p>
          {detail ? (
            <pre className="border-line bg-background-subtle text-muted mb-8 max-w-[36rem] overflow-x-auto rounded-sm border px-4 py-3 font-mono text-[0.78rem] leading-relaxed whitespace-pre-wrap">
              {detail}
            </pre>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              to="/"
              onClick={onNavigate}
              className="text-foreground border-line hover:border-muted inline-flex items-center border-b pb-0.5 text-sm font-medium no-underline"
            >
              Back home
            </Link>
            <Link
              to="/docs"
              onClick={onNavigate}
              className="text-muted hover:text-foreground text-sm no-underline"
            >
              Read the docs
            </Link>
          </div>
        </div>
        <div className="order-1 flex justify-center md:order-2">
          <Illustration
            name={illustration}
            decorative
            className="block h-auto w-[min(100%,28rem)]"
          />
        </div>
      </div>
    </main>
  )
}

export function NotFoundPage() {
  return (
    <SiteStatusPage
      code="404 / Not found"
      title="This path was never woven."
      description="The page you asked for is not in this site. Check the URL, or start again from the docs."
      illustration="not-found"
    />
  )
}

export function ErrorPage({ error, reset }: ErrorComponentProps) {
  const detail =
    import.meta.env.DEV && error instanceof Error
      ? error.message
      : import.meta.env.DEV
        ? String(error)
        : undefined

  return (
    <SiteStatusPage
      code="500 / Something broke"
      title="The weave broke mid-run."
      description="Something unexpected failed while loading this page. The recorded work is still safe — try again, or head back to known ground."
      illustration="error"
      detail={detail}
      onNavigate={reset}
    />
  )
}
