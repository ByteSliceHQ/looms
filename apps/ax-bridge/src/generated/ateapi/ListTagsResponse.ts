// Original file: proto/ateapi.proto

import type { Tag as _ateapi_Tag, Tag__Output as _ateapi_Tag__Output } from '../ateapi/Tag';

export interface ListTagsResponse {
  'tags'?: (_ateapi_Tag)[];
  'nextPageToken'?: (string);
}

export interface ListTagsResponse__Output {
  'tags': (_ateapi_Tag__Output)[];
  'nextPageToken': (string);
}
