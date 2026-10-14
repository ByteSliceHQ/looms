// Original file: proto/ateapi.proto

import type { SnapshotContentScope as _ateapi_SnapshotContentScope, SnapshotContentScope__Output as _ateapi_SnapshotContentScope__Output } from '../ateapi/SnapshotContentScope';
import type { OnResumeConfig as _ateapi_OnResumeConfig, OnResumeConfig__Output as _ateapi_OnResumeConfig__Output } from '../ateapi/OnResumeConfig';

export interface SnapshotsConfig {
  'onPause'?: (_ateapi_SnapshotContentScope);
  'onCommit'?: (_ateapi_SnapshotContentScope);
  'onResume'?: (_ateapi_OnResumeConfig | null);
  'storageLocation'?: (string);
}

export interface SnapshotsConfig__Output {
  'onPause': (_ateapi_SnapshotContentScope__Output);
  'onCommit': (_ateapi_SnapshotContentScope__Output);
  'onResume': (_ateapi_OnResumeConfig__Output | null);
  'storageLocation': (string);
}
