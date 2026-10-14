// Original file: proto/ateapi.proto

import type { Resources as _ateapi_Resources, Resources__Output as _ateapi_Resources__Output } from '../ateapi/Resources';

export interface WorkerResources {
  'resources'?: (_ateapi_Resources | null);
  'actors'?: (number);
}

export interface WorkerResources__Output {
  'resources': (_ateapi_Resources__Output | null);
  'actors': (number);
}
