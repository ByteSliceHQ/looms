// Original file: proto/ateapi.proto

import type { ResourceMetadata as _ateapi_ResourceMetadata, ResourceMetadata__Output as _ateapi_ResourceMetadata__Output } from '../ateapi/ResourceMetadata';
import type { ObjectRef as _ateapi_ObjectRef, ObjectRef__Output as _ateapi_ObjectRef__Output } from '../ateapi/ObjectRef';
import type { Selector as _ateapi_Selector, Selector__Output as _ateapi_Selector__Output } from '../ateapi/Selector';
import type { ActorStatus as _ateapi_ActorStatus, ActorStatus__Output as _ateapi_ActorStatus__Output } from '../ateapi/ActorStatus';

export interface Actor {
  'metadata'?: (_ateapi_ResourceMetadata | null);
  'actorTemplate'?: (_ateapi_ObjectRef | null);
  'workerSelector'?: (_ateapi_Selector | null);
  'sourceTag'?: (_ateapi_ObjectRef | null);
  'status'?: (_ateapi_ActorStatus | null);
}

export interface Actor__Output {
  'metadata': (_ateapi_ResourceMetadata__Output | null);
  'actorTemplate': (_ateapi_ObjectRef__Output | null);
  'workerSelector': (_ateapi_Selector__Output | null);
  'sourceTag': (_ateapi_ObjectRef__Output | null);
  'status': (_ateapi_ActorStatus__Output | null);
}
