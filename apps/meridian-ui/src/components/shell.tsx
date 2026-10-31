import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

const links = [
  { to: '/', label: 'Floor' },
  { to: '/orders', label: 'Blotter' },
  { to: '/risk', label: 'Risk' },
  { to: '/analyst', label: 'Analyst' },
] as const

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <header className="top">
        <Link to="/" className="mark">
          Meridian
        </Link>
        <nav className="nav">
          {links.map((link) => (
            <Link key={link.to} to={link.to} activeOptions={{ exact: link.to === '/' }}>
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}

export function PageHeader({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="page-head">
      <h1>{title}</h1>
      {detail ? <p>{detail}</p> : null}
    </div>
  )
}
