// Original file: proto/ateapi.proto

import type { ActorTemplate as _ateapi_ActorTemplate, ActorTemplate__Output as _ateapi_ActorTemplate__Output } from '../ateapi/ActorTemplate';

export interface ListActorTemplatesResponse {
  'actorTemplates'?: (_ateapi_ActorTemplate)[];
  'nextPageToken'?: (string);
}

export interface ListActorTemplatesResponse__Output {
  'actorTemplates': (_ateapi_ActorTemplate__Output)[];
  'nextPageToken': (string);
}
