export {
  S2ConfigSchema,
  s2ConfigFromEnv,
  streamNameForActor,
  type S2Config,
} from './config'
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
  s2,
  S2EventStoreLive,
} from './store'
