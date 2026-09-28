// Original file: proto/ateapi.proto

import type { ObjectRef as _ateapi_ObjectRef, ObjectRef__Output as _ateapi_ObjectRef__Output } from '../ateapi/ObjectRef';
import type { Resources as _ateapi_Resources, Resources__Output as _ateapi_Resources__Output } from '../ateapi/Resources';
import type { ResourceMetadata as _ateapi_ResourceMetadata, ResourceMetadata__Output as _ateapi_ResourceMetadata__Output } from '../ateapi/ResourceMetadata';

export interface ActorAssignment {
  'actor'?: (_ateapi_ObjectRef | null);
  'actorUid'?: (string);
  'actorTemplateRef'?: (_ateapi_ObjectRef | null);
  'resources'?: (_ateapi_Resources | null);
  'metadata'?: (_ateapi_ResourceMetadata | null);
}

export interface ActorAssignment__Output {
  'actor': (_ateapi_ObjectRef__Output | null);
  'actorUid': (string);
  'actorTemplateRef': (_ateapi_ObjectRef__Output | null);
  'resources': (_ateapi_Resources__Output | null);
  'metadata': (_ateapi_ResourceMetadata__Output | null);
}
