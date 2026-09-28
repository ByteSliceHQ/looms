// Original file: proto/ax.proto

import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../../google/protobuf/Timestamp';

export interface ObjectMeta {
  'name'?: (string);
  'atespace'?: (string);
  'creationTimestamp'?: (_google_protobuf_Timestamp | null);
}

export interface ObjectMeta__Output {
  'name': (string);
  'atespace': (string);
  'creationTimestamp': (_google_protobuf_Timestamp__Output | null);
}
