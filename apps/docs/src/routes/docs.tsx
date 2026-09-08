import { Outlet, createFileRoute, Link } from '@tanstack/react-router'
import { docsNav } from '../nav'

export const Route = createFileRoute('/docs')({
  component: DocsLayout,
})

function DocsLayout() {
  return (
    <div className="docs">
      <nav className="docs-nav">
        {docsNav.map((item) => (
          <Link key={item.to} to={item.to}>
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
