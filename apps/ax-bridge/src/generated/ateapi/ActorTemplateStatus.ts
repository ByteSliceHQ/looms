// Original file: proto/ateapi.proto

import type { GoldenSnapshotStatus as _ateapi_GoldenSnapshotStatus, GoldenSnapshotStatus__Output as _ateapi_GoldenSnapshotStatus__Output } from '../ateapi/GoldenSnapshotStatus';

export interface ActorTemplateStatus {
  'goldenSnapshotStatus'?: (_ateapi_GoldenSnapshotStatus | null);
}

export interface ActorTemplateStatus__Output {
  'goldenSnapshotStatus': (_ateapi_GoldenSnapshotStatus__Output | null);
}
