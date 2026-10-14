// Original file: proto/ateapi.proto

import type { WorkerState as _ateapi_WorkerState, WorkerState__Output as _ateapi_WorkerState__Output } from '../ateapi/WorkerState';
import type { WorkerResources as _ateapi_WorkerResources, WorkerResources__Output as _ateapi_WorkerResources__Output } from '../ateapi/WorkerResources';

export interface WorkerStatus {
  'state'?: (_ateapi_WorkerState);
  'capacity'?: (_ateapi_WorkerResources | null);
  'allocated'?: (_ateapi_WorkerResources | null);
}

export interface WorkerStatus__Output {
  'state': (_ateapi_WorkerState__Output);
  'capacity': (_ateapi_WorkerResources__Output | null);
  'allocated': (_ateapi_WorkerResources__Output | null);
}
