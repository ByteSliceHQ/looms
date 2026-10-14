// Original file: proto/ateapi.proto

import type { ObjectRef as _ateapi_ObjectRef, ObjectRef__Output as _ateapi_ObjectRef__Output } from '../ateapi/ObjectRef';
import type { DeleteOptions as _ateapi_DeleteOptions, DeleteOptions__Output as _ateapi_DeleteOptions__Output } from '../ateapi/DeleteOptions';

export interface DeleteWorkerRequest {
  'worker'?: (_ateapi_ObjectRef | null);
  'options'?: (_ateapi_DeleteOptions | null);
}

export interface DeleteWorkerRequest__Output {
  'worker': (_ateapi_ObjectRef__Output | null);
  'options': (_ateapi_DeleteOptions__Output | null);
}
