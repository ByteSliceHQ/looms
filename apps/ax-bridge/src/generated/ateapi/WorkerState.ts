// Original file: proto/ateapi.proto

export const WorkerState = {
  WORKER_STATE_UNSPECIFIED: 'WORKER_STATE_UNSPECIFIED',
  WORKER_STATE_ACTIVE: 'WORKER_STATE_ACTIVE',
  WORKER_STATE_DRAINING: 'WORKER_STATE_DRAINING',
} as const;

export type WorkerState =
  | 'WORKER_STATE_UNSPECIFIED'
  | 0
  | 'WORKER_STATE_ACTIVE'
  | 1
  | 'WORKER_STATE_DRAINING'
  | 2

export type WorkerState__Output = typeof WorkerState[keyof typeof WorkerState]
