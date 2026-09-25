import type { ComponentType } from 'react'

import type { PublishedDefinition } from '@looms/core'

import type { DebuggerEvent, EventSummary } from './contracts'

export interface EventFamilyView {
  readonly family: string
  /** Event type prefix the family owns. Defaults to `${family}.`. */
  readonly prefix?: string
  readonly color: string
  readonly summarize?: (event: DebuggerEvent) => EventSummary | undefined
}

export interface WorkspaceContext {
  readonly definition: PublishedDefinition
  readonly runId?: string
  readonly onStarted: (runId: string) => void
}

export interface WorkspaceView {
  readonly kinds: readonly string[]
  readonly component: ComponentType<WorkspaceContext>
  /** Narrows `kinds`. When omitted, every definition of those kinds uses the workspace. */
  readonly matches?: (definition: PublishedDefinition) => boolean
}

/** A projection pane. The component reads the projection for `runId` itself. */
export interface ProjectionView {
  readonly name: string
  readonly component: ComponentType<{ readonly runId: string }>
}

export interface DebuggerPlugin {
  readonly name: string
  readonly families?: readonly EventFamilyView[]
  readonly workspace?: WorkspaceView
  readonly projections?: readonly ProjectionView[]
}

export function workspaceFor(
  plugins: readonly DebuggerPlugin[],
  definition: PublishedDefinition,
): WorkspaceView | undefined {
  return plugins.find(
    (plugin) =>
      plugin.workspace !== undefined &&
      plugin.workspace.kinds.includes(definition.kind) &&
      (plugin.workspace.matches?.(definition) ?? true),
  )?.workspace
}

export function projectionFor(
  plugins: readonly DebuggerPlugin[],
  name: string,
): ProjectionView | undefined {
  for (const plugin of plugins) {
    const view = plugin.projections?.find((candidate) => candidate.name === name)

    if (view) {
      return view
    }
  }

  return undefined
}
