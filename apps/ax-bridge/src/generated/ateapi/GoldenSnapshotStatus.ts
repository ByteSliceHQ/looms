// Original file: proto/ateapi.proto

import type { ExternalSnapshot as _ateapi_ExternalSnapshot, ExternalSnapshot__Output as _ateapi_ExternalSnapshot__Output } from '../ateapi/ExternalSnapshot';
import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../google/protobuf/Timestamp';

export interface GoldenSnapshotStatus {
  'goldenSnapshot'?: (_ateapi_ExternalSnapshot | null);
  'takeGoldenSnapshotAt'?: (_google_protobuf_Timestamp | null);
  'errorMessage'?: (string);
}

export interface GoldenSnapshotStatus__Output {
  'goldenSnapshot': (_ateapi_ExternalSnapshot__Output | null);
  'takeGoldenSnapshotAt': (_google_protobuf_Timestamp__Output | null);
  'errorMessage': (string);
}
