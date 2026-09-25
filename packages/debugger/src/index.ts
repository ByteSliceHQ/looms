export type {
  DebuggerEvent,
  EventStreamCatalog,
  EventSummary,
  ReplayLoader,
  ReplayStep,
  RunTreeModel,
  ThreadTree,
} from './contracts'
export { createEventCatalog, defaultEventCatalog } from './events/catalog'
export { summarizeProtocolEvent } from './events/protocol-summarize'
export { DebuggerProvider, useDebugger, type DebuggerContextValue } from './context'
export {
  projectionFor,
  projectionView,
  workspaceFor,
  type DebuggerPlugin,
  type EventFamilyView,
  type ProjectionContext,
  type ProjectionView,
  type WorkspaceContext,
  type WorkspaceView,
} from './plugin'
export { DebuggerShell, type DebuggerSelection } from './shell/debugger-shell'
export { StartForm } from './shell/start-form'
export { useStartRun, type StartRun } from './shell/use-start-run'
export {
  formInput,
  inputForm,
  messageInput,
  type FormField,
  type FormValues,
  type InputForm,
} from './shell/schema-form'
export { cn, compactJson, errorMessage, shortId } from './lib/cn'
export { jsonFields, jsonNumberText, jsonText } from './lib/payload'
export { statusClass, statusDotClass, type StatusKind } from './lib/status'
export { countEventsByThread, runStatusFromEvents, startedAtFromEvents } from './lib/event-counts'
export { projectRunView, type ProjectedRunView } from './lib/project-run'
export { StatusDot } from './components/status-dot'
export { JsonView } from './components/json-view'
export { RunTree } from './components/run-tree'
export { EventStream } from './components/event-stream'
export { EventInspector } from './components/event-inspector'
export { DebuggerSplit } from './components/debugger-split'
export { Checkbox } from './ui/checkbox'
export { ScrollArea, ScrollBar } from './ui/scroll-area'
