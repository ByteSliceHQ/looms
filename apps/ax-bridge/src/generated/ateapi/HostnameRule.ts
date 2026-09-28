// Original file: proto/ateapi.proto

import type { EgressRuleEffects as _ateapi_EgressRuleEffects, EgressRuleEffects__Output as _ateapi_EgressRuleEffects__Output } from '../ateapi/EgressRuleEffects';

export interface HostnameRule {
  'patterns'?: (string)[];
  'effects'?: (_ateapi_EgressRuleEffects | null);
}

export interface HostnameRule__Output {
  'patterns': (string)[];
  'effects': (_ateapi_EgressRuleEffects__Output | null);
}
