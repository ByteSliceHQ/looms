// Original file: proto/ateapi.proto

import type { Long } from '@grpc/proto-loader';

export interface DeleteOptions {
  'version'?: (number | string | Long);
  'uid'?: (string);
}

export interface DeleteOptions__Output {
  'version': (string);
  'uid': (string);
}
