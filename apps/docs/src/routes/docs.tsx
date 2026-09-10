import { Outlet, createFileRoute, Link } from '@tanstack/react-router'
import { docsNav } from '../nav'

export const Route = createFileRoute('/docs')({
  component: DocsLayout,
})

function DocsLayout() {
  return (
    <div className="mx-auto grid max-w-[68rem] grid-cols-1 gap-8 px-5 py-8 pb-16 md:grid-cols-[12rem_minmax(0,44rem)] md:gap-16 md:px-8 md:py-12 md:pb-24">
      <nav className="sticky top-8 flex max-h-[calc(100vh-4rem)] flex-col gap-2 self-start overflow-y-auto pt-1 max-md:static max-md:max-h-none max-md:flex-row max-md:flex-wrap max-md:gap-x-5 max-md:overflow-y-visible max-md:border-b max-md:border-line-subtle max-md:pb-4">
        {docsNav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="text-[0.88rem] text-muted no-underline transition-colors hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="prose">
        <Outlet />
      </div>
    </div>
  )
}
