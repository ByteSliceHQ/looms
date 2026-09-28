// Original file: proto/ateapi.proto

import type { Worker as _ateapi_Worker, Worker__Output as _ateapi_Worker__Output } from '../ateapi/Worker';

export interface ListWorkersResponse {
  'workers'?: (_ateapi_Worker)[];
  'nextPageToken'?: (string);
}

export interface ListWorkersResponse__Output {
  'workers': (_ateapi_Worker__Output)[];
  'nextPageToken': (string);
}
