import type { ComponentType } from 'react'

import type { LoomsDefinition } from '@looms/client'
import type { ProjectionDefinition } from '@looms/core'

import type { DebuggerEvent, EventSummary } from './contracts'

export interface EventFamilyView {
  readonly family: string
  readonly prefix: string
  readonly color: string
  readonly summarize?: (event: DebuggerEvent) => EventSummary | undefined
}

export interface WorkspaceContext {
  readonly definition: LoomsDefinition
  readonly runId?: string
  readonly onStarted: (runId: string) => void
}

export interface WorkspaceView {
  readonly kinds: readonly string[]
  readonly component: ComponentType<WorkspaceContext>
}

export interface ProjectionContext<S> {
  readonly runId: string
  readonly state: S
}

export interface ProjectionView<S> {
  readonly projection: ProjectionDefinition<S>
  readonly component: ComponentType<ProjectionContext<S>>
}

export interface DebuggerPlugin {
  readonly name: string
  readonly families?: readonly EventFamilyView[]
  readonly workspace?: WorkspaceView
  readonly projections?: readonly ProjectionView<any>[]
}

export function defineDebuggerPlugin(plugin: DebuggerPlugin): DebuggerPlugin {
  return plugin
}

export function projectionView<S>(
  projection: ProjectionDefinition<S>,
  component: ComponentType<ProjectionContext<S>>,
): ProjectionView<S> {
  return { projection, component }
}

export function workspaceFor(
  plugins: readonly DebuggerPlugin[],
  kind: string,
): WorkspaceView | undefined {
  for (const plugin of plugins) {
    if (plugin.workspace?.kinds.includes(kind)) {
      return plugin.workspace
    }
  }

  return undefined
}

export function projectionFor(
  plugins: readonly DebuggerPlugin[],
  name: string,
): ProjectionView<any> | undefined {
  for (const plugin of plugins) {
    const view = plugin.projections?.find((candidate) => candidate.projection.name === name)

    if (view) {
      return view
    }
  }

  return undefined
}
