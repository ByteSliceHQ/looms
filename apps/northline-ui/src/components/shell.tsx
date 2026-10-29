import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <aside className="rail">
        <Link to="/" className="wordmark">
          <span className="wordmark-mark">NL</span>
          <span>
            <span className="wordmark-name">Northline</span>
            <span className="wordmark-sub">Exception desk</span>
          </span>
        </Link>
        <nav className="nav" aria-label="Desk">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Board
          </Link>
          <Link to="/desk" className="nav-link" activeProps={{ className: 'nav-link is-active' }}>
            Floor desk
          </Link>
          <Link to="/sweep" className="nav-link" activeProps={{ className: 'nav-link is-active' }}>
            Morning sweep
          </Link>
        </nav>
        <p className="rail-note">Regional LTL · Kansas City</p>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}

export function PageHeader({
  kicker,
  title,
  copy,
}: {
  kicker: string
  title: string
  copy: string
}) {
  return (
    <header className="page-head">
      <p className="page-kicker">{kicker}</p>
      <h1 className="page-title">{title}</h1>
      <p className="page-copy">{copy}</p>
    </header>
  )
}
