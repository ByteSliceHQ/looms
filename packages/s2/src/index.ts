export { S2ConfigSchema, s2ConfigFromEnv, streamNameForRun, type S2Config } from './config'
export {
  findS2Binary,
  isPortOpen,
  s2Lite,
  startS2Lite,
  type S2LiteOptions,
  type StartedS2Lite,
} from './lite'
export {
  makeS2EventStore,
  paginateS2Stream,
  readAllPages,
  s2,
  S2EventStoreLive,
  type ReadAllPagesOptions,
  type S2ReadBatchLike,
} from './store'
export { createKeyedSerializer, type KeyedSerializer } from './serialize'
export { s2Projector } from './projector'
export {
  assembleSnapshot,
  frameSnapshot,
  s2SnapshotStore,
  S2SnapshotStoreLive,
  type SnapshotFrame,
} from './snapshot-store'
