// Original file: proto/ax.proto

import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../../google/protobuf/Timestamp';

export interface Condition {
  'type'?: (string);
  'status'?: (string);
  'lastTransitionTime'?: (_google_protobuf_Timestamp | null);
  'reason'?: (string);
  'message'?: (string);
}

export interface Condition__Output {
  'type': (string);
  'status': (string);
  'lastTransitionTime': (_google_protobuf_Timestamp__Output | null);
  'reason': (string);
  'message': (string);
}
