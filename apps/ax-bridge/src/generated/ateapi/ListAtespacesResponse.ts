// Original file: proto/ateapi.proto

import type { Atespace as _ateapi_Atespace, Atespace__Output as _ateapi_Atespace__Output } from '../ateapi/Atespace';

export interface ListAtespacesResponse {
  'atespaces'?: (_ateapi_Atespace)[];
  'nextPageToken'?: (string);
}

export interface ListAtespacesResponse__Output {
  'atespaces': (_ateapi_Atespace__Output)[];
  'nextPageToken': (string);
}
