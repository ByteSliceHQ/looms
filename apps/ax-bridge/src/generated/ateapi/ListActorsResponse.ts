// Original file: proto/ateapi.proto

import type { Actor as _ateapi_Actor, Actor__Output as _ateapi_Actor__Output } from '../ateapi/Actor';

export interface ListActorsResponse {
  'actors'?: (_ateapi_Actor)[];
  'nextPageToken'?: (string);
}

export interface ListActorsResponse__Output {
  'actors': (_ateapi_Actor__Output)[];
  'nextPageToken': (string);
}
