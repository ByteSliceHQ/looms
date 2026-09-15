import { useMemo, useState } from 'react'

import { ScrollArea } from '@looms/debugger'

import { orchestrationSourceFiles } from '../landing/orchestration-source'
import { highlightCode } from './code-highlight'

export function LandingSourceIde() {
  const [activeName, setActiveName] = useState(orchestrationSourceFiles[0]?.name ?? '')

  const activeFile =
    orchestrationSourceFiles.find((file) => file.name === activeName) ?? orchestrationSourceFiles[0]

  const highlighted = useMemo(
    () => (activeFile ? highlightCode(activeFile.source, activeFile.language) : ''),
    [activeFile],
  )

  if (!activeFile) {
    return null
  }

  return (
    <div className="landing-source-ide border-line bg-background-subtle flex h-[22rem] min-h-[22rem] flex-col overflow-hidden rounded-lg border lg:h-[32rem] lg:min-h-[32rem]">
      <div
        role="tablist"
        aria-label="Source files"
        className="border-border flex min-h-9 items-end overflow-x-auto border-b px-2"
      >
        {orchestrationSourceFiles.map((file) => {
          const selected = file.name === activeFile.name

          return (
            <button
              key={file.name}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveName(file.name)}
              className={`relative h-9 shrink-0 px-3 font-mono text-[10px] transition-colors ${
                selected ? 'text-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              {file.name}
              {selected ? (
                <span className="bg-foreground absolute inset-x-2 bottom-0 h-px" />
              ) : null}
            </button>
          )
        })}
      </div>
      <ScrollArea horizontal className="min-h-0 flex-1">
        <div
          role="tabpanel"
          aria-label={activeFile.name}
          className="landing-source-code min-h-full"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </ScrollArea>
    </div>
  )
}
