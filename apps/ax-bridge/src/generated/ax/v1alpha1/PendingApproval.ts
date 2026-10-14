// Original file: proto/ax.proto

import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../../google/protobuf/Timestamp';

export interface PendingApproval {
  'id'?: (string);
  'action'?: (string);
  'requestedAt'?: (_google_protobuf_Timestamp | null);
}

export interface PendingApproval__Output {
  'id': (string);
  'action': (string);
  'requestedAt': (_google_protobuf_Timestamp__Output | null);
}
