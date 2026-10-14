// Original file: proto/ateapi.proto

import type { ObjectRef as _ateapi_ObjectRef, ObjectRef__Output as _ateapi_ObjectRef__Output } from '../ateapi/ObjectRef';

export interface DeleteActorRequest {
  'actor'?: (_ateapi_ObjectRef | null);
  'anyState'?: (boolean);
}

export interface DeleteActorRequest__Output {
  'actor': (_ateapi_ObjectRef__Output | null);
  'anyState': (boolean);
}
