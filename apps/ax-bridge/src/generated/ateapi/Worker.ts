// Original file: proto/ateapi.proto

import type { ResourceMetadata as _ateapi_ResourceMetadata, ResourceMetadata__Output as _ateapi_ResourceMetadata__Output } from '../ateapi/ResourceMetadata';
import type { WorkerStatus as _ateapi_WorkerStatus, WorkerStatus__Output as _ateapi_WorkerStatus__Output } from '../ateapi/WorkerStatus';

export interface Worker {
  'metadata'?: (_ateapi_ResourceMetadata | null);
  'workerNamespace'?: (string);
  'workerPool'?: (string);
  'workerPod'?: (string);
  'workerPodUid'?: (string);
  'nodeName'?: (string);
  'ip'?: (string);
  'sandboxClass'?: (string);
  'labels'?: ({[key: string]: string});
  'status'?: (_ateapi_WorkerStatus | null);
}

export interface Worker__Output {
  'metadata': (_ateapi_ResourceMetadata__Output | null);
  'workerNamespace': (string);
  'workerPool': (string);
  'workerPod': (string);
  'workerPodUid': (string);
  'nodeName': (string);
  'ip': (string);
  'sandboxClass': (string);
  'labels': ({[key: string]: string});
  'status': (_ateapi_WorkerStatus__Output | null);
}
