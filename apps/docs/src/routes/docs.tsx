import { Outlet, createFileRoute, Link, useRouterState } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import pages from '../docs-manifest.json'
import { docsNav, isDocsNavGroup, type DocsNavGroup, type DocsNavLink } from '../nav'

export const Route = createFileRoute('/docs')({
  component: DocsLayout,
})

function DocsNavLinkItem({
  item,
  nested = false,
  mobile = false,
  onNavigate,
}: {
  item: DocsNavLink
  nested?: boolean
  mobile?: boolean
  onNavigate?: () => void
}) {
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: true }}
      className={
        mobile
          ? 'text-muted hover:text-foreground data-[status=active]:text-foreground block py-2 text-lg no-underline transition-colors data-[status=active]:font-medium'
          : nested
            ? 'text-muted hover:text-foreground data-[status=active]:text-foreground text-[0.82rem] no-underline transition-colors data-[status=active]:font-medium'
            : 'text-muted hover:text-foreground data-[status=active]:text-foreground text-[0.88rem] no-underline transition-colors data-[status=active]:font-medium'
      }
      onClick={onNavigate}
    >
      {item.label}
    </Link>
  )
}

function DocsNavGroupItem({
  group,
  mobile = false,
  onNavigate,
}: {
  group: DocsNavGroup
  mobile?: boolean
  onNavigate?: () => void
}) {
  return (
    <div
      className={
        mobile
          ? 'flex w-full flex-col gap-2'
          : "[&:has(a[data-status='active'])>span]:text-foreground flex w-full flex-col gap-1.5"
      }
    >
      <span
        className={
          mobile
            ? 'text-foreground text-sm font-medium tracking-wide uppercase'
            : 'text-muted text-[0.88rem] font-medium'
        }
      >
        {group.label}
      </span>
      <div className="border-line-subtle flex flex-col border-l pl-4 md:gap-1.5 md:pl-3">
        {group.children.map((child) => (
          <DocsNavLinkItem
            key={child.to}
            item={child}
            nested
            mobile={mobile}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  )
}

function DocsNavigation({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean
  onNavigate?: () => void
}) {
  return (
    <>
      {docsNav.map((item) => {
        if (isDocsNavGroup(item)) {
          return (
            <DocsNavGroupItem
              key={item.label}
              group={item}
              mobile={mobile}
              onNavigate={onNavigate}
            />
          )
        }

        return <DocsNavLinkItem key={item.to} item={item} mobile={mobile} onNavigate={onNavigate} />
      })}
    </>
  )
}

function DocsLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const currentPage = pages.find((page) => page.path === pathname.replace(/\/$/, ''))
  const [menuOpen, setMenuOpen] = useState(false)
  const menuDialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = menuDialogRef.current

    if (!dialog) {
      return
    }

    if (menuOpen && !dialog.open) {
      dialog.showModal()
    } else if (!menuOpen && dialog.open) {
      dialog.close()
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [menuOpen])

  return (
    <div className="mx-auto grid max-w-[68rem] grid-cols-1 gap-8 px-5 py-8 pb-16 md:grid-cols-[13rem_minmax(0,44rem)] md:gap-16 md:px-8 md:py-12 md:pb-24">
      <button
        type="button"
        className="border-line text-foreground hover:bg-background-subtle focus-visible:outline-line flex w-full cursor-pointer items-center justify-between rounded-md border bg-transparent px-4 py-3 text-sm font-medium md:hidden"
        aria-haspopup="dialog"
        aria-expanded={menuOpen}
        aria-controls="docs-mobile-menu"
        onClick={() => setMenuOpen(true)}
      >
        Browse documentation
        <Menu aria-hidden="true" size={18} />
      </button>

      <dialog
        ref={menuDialogRef}
        id="docs-mobile-menu"
        className="bg-background text-body fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 p-0 md:hidden"
        aria-labelledby="docs-mobile-menu-title"
        onClose={() => setMenuOpen(false)}
      >
        <div className="border-line-subtle flex items-center justify-between border-b px-5 py-5">
          <span id="docs-mobile-menu-title" className="text-foreground font-semibold">
            Documentation
          </span>
          <button
            type="button"
            className="border-line text-muted hover:bg-background-subtle hover:text-foreground focus-visible:outline-line inline-flex size-10 cursor-pointer items-center justify-center rounded-md border bg-transparent"
            aria-label="Close documentation menu"
            onClick={() => setMenuOpen(false)}
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        <nav className="flex h-[calc(100dvh-5.1rem)] flex-col gap-5 overflow-y-auto px-6 py-6">
          <DocsNavigation mobile onNavigate={() => setMenuOpen(false)} />
        </nav>
      </dialog>

      <nav className="sticky top-8 hidden max-h-[calc(100vh-4rem)] flex-col gap-2.5 self-start overflow-y-auto pt-1 md:flex">
        <DocsNavigation />
      </nav>
      <main id="main-content" className="min-w-0">
        {currentPage && currentPage.sections.length > 2 && (
          <details className="border-line mb-8 border-b pb-4 text-[0.85rem]">
            <summary className="text-foreground cursor-pointer">On this page</summary>
            <nav className="grid gap-[0.45rem] pt-4" aria-label="On this page">
              {currentPage.sections
                .filter((section) => section.level === 2)
                .map((section) => (
                  <a key={section.id} href={`#${section.id}`}>
                    {section.title}
                  </a>
                ))}
            </nav>
          </details>
        )}
        <article className="prose max-w-none">
          <Outlet />
        </article>
        <footer className="border-line text-muted mt-16 flex flex-wrap justify-between gap-4 border-t pt-4 text-[0.8rem]">
          <a href="https://github.com/ByteSliceHQ/looms/issues">Report a docs issue</a>
          <span>0.0.x series · Pin your package version</span>
        </footer>
      </main>
    </div>
  )
}
