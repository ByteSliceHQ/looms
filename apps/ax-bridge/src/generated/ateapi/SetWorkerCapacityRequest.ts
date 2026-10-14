// Original file: proto/ateapi.proto

import type { ObjectRef as _ateapi_ObjectRef, ObjectRef__Output as _ateapi_ObjectRef__Output } from '../ateapi/ObjectRef';
import type { WorkerResources as _ateapi_WorkerResources, WorkerResources__Output as _ateapi_WorkerResources__Output } from '../ateapi/WorkerResources';

export interface SetWorkerCapacityRequest {
  'worker'?: (_ateapi_ObjectRef | null);
  'capacity'?: (_ateapi_WorkerResources | null);
}

export interface SetWorkerCapacityRequest__Output {
  'worker': (_ateapi_ObjectRef__Output | null);
  'capacity': (_ateapi_WorkerResources__Output | null);
}
