// Original file: proto/ateapi.proto

import type { ObjectRef as _ateapi_ObjectRef, ObjectRef__Output as _ateapi_ObjectRef__Output } from '../ateapi/ObjectRef';

export interface WorkerAssignment {
  'workerNamespace'?: (string);
  'workerPool'?: (string);
  'workerPod'?: (string);
  'workerPodUid'?: (string);
  'workerPodIp'?: (string);
  'worker'?: (_ateapi_ObjectRef | null);
}

export interface WorkerAssignment__Output {
  'workerNamespace': (string);
  'workerPool': (string);
  'workerPod': (string);
  'workerPodUid': (string);
  'workerPodIp': (string);
  'worker': (_ateapi_ObjectRef__Output | null);
}
