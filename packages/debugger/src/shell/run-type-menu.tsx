import { ChevronsUpDown, Plus } from 'lucide-react'

import type { PublishedDefinition } from '@looms/core'

import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { definitionKey } from './definition-key'

export function RunTypeMenu({
  definitions,
  selected,
  onSelect,
}: {
  definitions: readonly PublishedDefinition[]
  selected?: PublishedDefinition
  onSelect: (definition: PublishedDefinition) => void
}) {
  const kinds = [...new Set(definitions.map((definition) => definition.kind))]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="data-[state=open]:bg-accent data-[state=open]:text-foreground text-foreground max-w-64 gap-2 px-2"
        >
          {selected ? (
            <span className="flex min-w-0 items-baseline gap-1.5">
              <span className="text-muted-foreground font-mono text-[11px] font-normal">
                {selected.kind}
              </span>
              <span className="text-muted-foreground/60 font-normal">/</span>
              <span className="truncate">{selected.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Select run type</span>
          )}
          <ChevronsUpDown className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <div className="text-muted-foreground flex items-center gap-1.5 px-2 pt-1.5 pb-1 text-[11px]">
          <Plus className="size-3" />
          Start a new run
        </div>
        <DropdownMenuRadioGroup value={selected ? definitionKey(selected) : ''}>
          {kinds.map((kind, index) => (
            <DropdownMenuGroup key={kind}>
              {index > 0 ? <DropdownMenuSeparator /> : null}
              <DropdownMenuLabel className="font-mono">{kind}</DropdownMenuLabel>
              {definitions
                .filter((definition) => definition.kind === kind)
                .map((definition) => (
                  <DropdownMenuRadioItem
                    key={definitionKey(definition)}
                    value={definitionKey(definition)}
                    onSelect={() => onSelect(definition)}
                    className="flex-col items-start gap-0"
                  >
                    <span className="font-medium">{definition.name}</span>
                    {definition.description ? (
                      <span className="text-muted-foreground line-clamp-1 text-[11px]">
                        {definition.description}
                      </span>
                    ) : null}
                  </DropdownMenuRadioItem>
                ))}
            </DropdownMenuGroup>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
