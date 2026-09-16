import { useNavigate } from '@tanstack/react-router'
import { FileText, Search } from 'lucide-react'
import { useState, useEffect } from 'react'

import pages from '../docs-manifest.json'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './ui/dialog'

export function DocsSearch() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="docs-search-trigger"
          aria-label="Search documentation"
          aria-keyshortcuts="Meta+K Control+K"
        >
          <Search size={15} aria-hidden="true" />
          <span>Search docs</span>
          <kbd>⌘ K</kbd>
        </button>
      </DialogTrigger>
      <DialogContent className="command-dialog overflow-hidden p-0">
        <DialogTitle className="sr-only">Search documentation</DialogTitle>
        <DialogDescription className="sr-only">
          Find Looms guides and API reference. Use arrow keys to choose a page and Enter to open it.
        </DialogDescription>
        <Command
          filter={(value, search, keywords) => {
            const title = value.toLowerCase()
            const query = search.toLowerCase().trim()

            if (title.includes(query)) {
              return 1
            }

            const content = `${title} ${keywords?.join(' ') ?? ''}`.toLowerCase()
            return query.split(/\s+/).every((term) => content.includes(term)) ? 0.5 : 0
          }}
        >
          <CommandInput placeholder="Search documentation…" />
          <CommandList>
            <CommandEmpty>No pages found. Try “approvals” or “custom threads”.</CommandEmpty>
            <CommandGroup heading="Documentation">
              {pages.map((page) => (
                <CommandItem
                  key={page.path}
                  value={page.title}
                  keywords={[page.text]}
                  onSelect={() => {
                    setOpen(false)
                    void navigate({ to: page.path })
                  }}
                >
                  <FileText aria-hidden="true" className="mt-0.5" />
                  <div>
                    <strong>{page.title}</strong>
                    <p>{page.description}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
