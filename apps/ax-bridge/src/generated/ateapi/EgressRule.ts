// Original file: proto/ateapi.proto

import type { HostnameRule as _ateapi_HostnameRule, HostnameRule__Output as _ateapi_HostnameRule__Output } from '../ateapi/HostnameRule';
import type { CIDRRule as _ateapi_CIDRRule, CIDRRule__Output as _ateapi_CIDRRule__Output } from '../ateapi/CIDRRule';
import type { Empty as _google_protobuf_Empty, Empty__Output as _google_protobuf_Empty__Output } from '../google/protobuf/Empty';

export interface EgressRule {
  'hostnames'?: (_ateapi_HostnameRule | null);
  'cidrs'?: (_ateapi_CIDRRule | null);
  'all'?: (_google_protobuf_Empty | null);
}

export interface EgressRule__Output {
  'hostnames': (_ateapi_HostnameRule__Output | null);
  'cidrs': (_ateapi_CIDRRule__Output | null);
  'all': (_google_protobuf_Empty__Output | null);
}
