// Original file: proto/ateapi.proto

import type { SnapshotContentScope as _ateapi_SnapshotContentScope, SnapshotContentScope__Output as _ateapi_SnapshotContentScope__Output } from '../ateapi/SnapshotContentScope';

export interface LocalSnapshotInfo {
  'snapshotName'?: (string);
  'nodeVmsWithLocalSnapshots'?: (string)[];
  'contentScope'?: (_ateapi_SnapshotContentScope);
}

export interface LocalSnapshotInfo__Output {
  'snapshotName': (string);
  'nodeVmsWithLocalSnapshots': (string)[];
  'contentScope': (_ateapi_SnapshotContentScope__Output);
}
