import type { ComponentType } from 'react'

import type { AnyRuntimeModule, PublishedDefinition } from '@looms/core'

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
  /**
   * Projections this plugin renders inside a workspace, or leaves as data.
   * `debuggerConformance` requires every module projection to be a pane or listed here.
   */
  readonly headlessProjections?: readonly string[]
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

/**
 * The debugger plugin covers the module when every catalog event has a family and every
 * projection is a pane or named in `headlessProjections`.
 */
export function debuggerConformance(
  module: AnyRuntimeModule,
  plugin: DebuggerPlugin,
): readonly string[] {
  const errors: string[] = []

  if (plugin.name !== module.namespace) {
    errors.push(
      `debugger plugin ${plugin.name} does not match module namespace ${module.namespace}`,
    )
  }

  const families = plugin.families ?? []
  const namespace = module.events?.namespace ?? module.namespace

  for (const key of Object.keys(module.events?.entries ?? {}).toSorted()) {
    const type = `${namespace}.${key}`
    const covered = families.some((family) => type.startsWith(family.prefix ?? `${family.family}.`))

    if (!covered) {
      errors.push(`event ${type} has no debugger family`)
    }
  }

  const panes = new Set((plugin.projections ?? []).map((view) => view.name))
  const headless = new Set(plugin.headlessProjections ?? [])

  const declared = Object.values(module.projections ?? {})
    .map((projection) => projection.name)
    .toSorted()

  for (const name of [...panes].toSorted()) {
    if (!declared.includes(name)) {
      errors.push(`debugger pane ${name} is not a projection of ${module.namespace}`)
    }

    if (headless.has(name)) {
      errors.push(`projection ${name} is both a debugger pane and headless`)
    }
  }

  for (const name of [...headless].toSorted()) {
    if (!declared.includes(name)) {
      errors.push(`headless projection ${name} is not declared by ${module.namespace}`)
    }
  }

  for (const name of declared) {
    if (!panes.has(name) && !headless.has(name)) {
      errors.push(`projection ${name} has no debugger pane or headlessProjections entry`)
    }
  }

  return errors
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
