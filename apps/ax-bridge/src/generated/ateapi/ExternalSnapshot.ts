// Original file: proto/ateapi.proto

import type { SnapshotContentScope as _ateapi_SnapshotContentScope, SnapshotContentScope__Output as _ateapi_SnapshotContentScope__Output } from '../ateapi/SnapshotContentScope';

export interface ExternalSnapshot {
  'snapshotUri'?: (string);
  'contentScope'?: (_ateapi_SnapshotContentScope);
}

export interface ExternalSnapshot__Output {
  'snapshotUri': (string);
  'contentScope': (_ateapi_SnapshotContentScope__Output);
}
