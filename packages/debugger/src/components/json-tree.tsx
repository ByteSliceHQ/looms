import { Check, ChevronRight, Copy } from 'lucide-react'
import { memo, useMemo, useState, type MouseEvent, type ReactNode } from 'react'

import type { JsonValue } from '@looms/core'

import { cn } from '../lib/cn'
import { jsonEntries, jsonNode, jsonPreview, parseStructuredJson, type JsonNode } from '../lib/json'

/** Children past this count render in collapsed buckets so huge arrays never flood the DOM. */
const CHUNK_SIZE = 100
/** Nodes wider than this start collapsed even inside the default expand depth. */
const AUTO_EXPAND_LIMIT = 50
const STRING_CLAMP = 320

interface TreeOptions {
  readonly defaultExpandDepth: number
}

function Chevron({ open }: { open: boolean }) {
  return (
    <ChevronRight
      aria-hidden
      className={cn('ease-snappy size-3 transition-transform duration-100', open && 'rotate-90')}
    />
  )
}

function Key({ name, index }: { name?: string; index: boolean }) {
  if (name === undefined) {
    return null
  }

  return (
    <span className={cn('mr-1 shrink-0', index ? 'text-muted-foreground' : 'text-json-key')}>
      {name}
      <span className="text-muted-foreground">:</span>
    </span>
  )
}

function StringValue({ value }: { value: string }) {
  const [expanded, setExpanded] = useState(false)
  const clamped = !expanded && value.length > STRING_CLAMP
  const shown = clamped ? value.slice(0, STRING_CLAMP) : value

  return (
    <span className="text-json-string">
      &quot;{shown}
      {clamped ? (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground ml-0.5 rounded-sm px-0.5 hover:underline"
          onClick={() => setExpanded(true)}
        >
          …+{value.length - STRING_CLAMP}
        </button>
      ) : null}
      &quot;
    </span>
  )
}

function Scalar({ node }: { node: JsonNode }) {
  switch (node.kind) {
    case 'string':
      return <StringValue value={node.value} />
    case 'number':
      return <span className="text-json-number">{String(node.value)}</span>
    case 'boolean':
      return <span className="text-json-boolean">{String(node.value)}</span>
    case 'null':
      return <span className="text-json-null italic">null</span>
    case 'object':
      return <span className="text-muted-foreground">{'{}'}</span>
    case 'array':
      return <span className="text-muted-foreground">[]</span>

    default: {
      const exhaustive: never = node
      return exhaustive
    }
  }
}

/** Leaf values flow inline so long strings wrap beneath their key instead of in a narrow column. */
function Leaf({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('py-px pl-4 break-words whitespace-pre-wrap', className)}>{children}</div>
  )
}

function Branch({
  label,
  summary,
  defaultOpen,
  children,
}: {
  label: ReactNode
  summary: ReactNode
  defaultOpen: boolean
  children: (forceOpen: boolean) => ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [deep, setDeep] = useState(false)
  const [generation, setGeneration] = useState(0)

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    const next = !open
    setOpen(next)

    // Alt-click opens or closes the whole subtree, like browser devtools.
    if (event.altKey) {
      setDeep(next)
      setGeneration((value) => value + 1)
    }
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className="hover:bg-accent/50 group/branch -mx-1 flex w-[calc(100%+0.5rem)] min-w-0 items-start gap-1 rounded-sm px-1 py-px text-left"
      >
        <span className="text-muted-foreground group-hover/branch:text-foreground flex h-5 w-3 shrink-0 items-center">
          <Chevron open={open} />
        </span>
        {label}
        <span className="text-muted-foreground min-w-0 truncate">{summary}</span>
      </button>
      {open ? (
        <div key={generation} className="border-border/70 ml-1.5 border-l pl-2.5">
          {children(deep)}
        </div>
      ) : null}
    </div>
  )
}

function Children({
  node,
  depth,
  options,
  forceOpen,
}: {
  node: JsonNode
  depth: number
  options: TreeOptions
  forceOpen: boolean
}) {
  const entries = jsonEntries(node)
  const index = node.kind === 'array'

  if (entries.length <= CHUNK_SIZE) {
    return entries.map(([key, value]) => (
      <Entry
        key={key}
        name={key}
        index={index}
        value={value}
        depth={depth}
        options={options}
        forceOpen={forceOpen}
      />
    ))
  }

  const chunks: (readonly (readonly [string, JsonValue])[])[] = []

  for (let start = 0; start < entries.length; start += CHUNK_SIZE) {
    chunks.push(entries.slice(start, start + CHUNK_SIZE))
  }

  return chunks.map((chunk, chunkIndex) => {
    const first = chunkIndex * CHUNK_SIZE
    const last = first + chunk.length - 1

    return (
      <Branch
        key={first}
        defaultOpen={forceOpen}
        label={
          <span className="text-muted-foreground shrink-0">
            [{first} … {last}]
          </span>
        }
        summary={null}
      >
        {(deep) =>
          chunk.map(([key, value]) => (
            <Entry
              key={key}
              name={key}
              index={index}
              value={value}
              depth={depth}
              options={options}
              forceOpen={deep}
            />
          ))
        }
      </Branch>
    )
  })
}

const Entry = memo(function Entry({
  name,
  index = false,
  value,
  depth,
  options,
  forceOpen = false,
}: {
  name?: string
  index?: boolean
  value: JsonValue
  depth: number
  options: TreeOptions
  forceOpen?: boolean
}) {
  const node = useMemo(() => jsonNode(value), [value])

  const embedded = useMemo(
    () => (node.kind === 'string' ? parseStructuredJson(node.value) : undefined),
    [node],
  )

  const branch: JsonNode | undefined =
    embedded !== undefined
      ? jsonNode(embedded)
      : node.kind === 'object' || node.kind === 'array'
        ? node
        : undefined

  const size = branch ? jsonEntries(branch).length : 0

  if (!branch || size === 0) {
    return (
      <Leaf>
        <Key name={name} index={index} />
        <Scalar node={branch ?? node} />
      </Leaf>
    )
  }

  const defaultOpen =
    forceOpen ||
    (embedded === undefined && depth < options.defaultExpandDepth && size <= AUTO_EXPAND_LIMIT)

  return (
    <Branch
      defaultOpen={defaultOpen}
      label={
        <>
          <Key name={name} index={index} />
          {embedded !== undefined ? (
            <span
              className="border-border text-muted-foreground mt-0.5 shrink-0 rounded-sm border px-1 text-[9px] leading-3.5 uppercase"
              title="String containing JSON"
            >
              json
            </span>
          ) : null}
        </>
      }
      summary={jsonPreview(branch)}
    >
      {(deep) => <Children node={branch} depth={depth + 1} options={options} forceOpen={deep} />}
    </Branch>
  )
})

function CopyButton({ value }: { value: JsonValue }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      aria-label="Copy JSON"
      className="text-muted-foreground hover:text-foreground bg-card/90 hover:bg-accent border-border absolute top-0 right-0 flex size-6 items-center justify-center rounded-md border opacity-0 transition-opacity duration-150 group-hover/json:opacity-100 focus-visible:opacity-100"
      onClick={() => {
        void navigator.clipboard
          .writeText(JSON.stringify(value, null, 2))
          .then(() => setCopied(true))
      }}
      onPointerLeave={() => setCopied(false)}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
    </button>
  )
}

/**
 * Collapsible, syntax-coloured JSON. Strings that hold JSON expand in place,
 * wide nodes start collapsed, and very large arrays render in buckets.
 */
export function JsonTree({
  value,
  defaultExpandDepth = 1,
  copyable = true,
  className,
}: {
  value: JsonValue
  defaultExpandDepth?: number
  copyable?: boolean
  className?: string
}) {
  const options = useMemo(() => ({ defaultExpandDepth }), [defaultExpandDepth])

  const { root, source } = useMemo(() => {
    const node = jsonNode(value)
    const embedded = node.kind === 'string' ? parseStructuredJson(node.value) : undefined
    return embedded !== undefined
      ? { root: jsonNode(embedded), source: embedded }
      : { root: node, source: value }
  }, [value])

  const hasChildren =
    (root.kind === 'object' || root.kind === 'array') && jsonEntries(root).length > 0

  return (
    <div className={cn('group/json relative min-w-0 font-mono text-[11px] leading-5', className)}>
      {hasChildren ? (
        <Children node={root} depth={0} options={options} forceOpen={false} />
      ) : (
        <Leaf className="pl-0">
          <Scalar node={root} />
        </Leaf>
      )}
      {copyable ? <CopyButton value={source} /> : null}
    </div>
  )
}
