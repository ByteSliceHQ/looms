// Original file: proto/ateapi.proto

import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../google/protobuf/Timestamp';
import type { Long } from '@grpc/proto-loader';

export interface ResourceMetadata {
  'atespace'?: (string);
  'name'?: (string);
  'uid'?: (string);
  'version'?: (number | string | Long);
  'createTime'?: (_google_protobuf_Timestamp | null);
  'updateTime'?: (_google_protobuf_Timestamp | null);
}

export interface ResourceMetadata__Output {
  'atespace': (string);
  'name': (string);
  'uid': (string);
  'version': (string);
  'createTime': (_google_protobuf_Timestamp__Output | null);
  'updateTime': (_google_protobuf_Timestamp__Output | null);
}
