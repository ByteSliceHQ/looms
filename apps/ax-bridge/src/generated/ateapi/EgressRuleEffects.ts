// Original file: proto/ateapi.proto

import type { CredentialHeaderInjection as _ateapi_CredentialHeaderInjection, CredentialHeaderInjection__Output as _ateapi_CredentialHeaderInjection__Output } from '../ateapi/CredentialHeaderInjection';

export interface EgressRuleEffects {
  'injectStaticHeaders'?: (_ateapi_CredentialHeaderInjection)[];
}

export interface EgressRuleEffects__Output {
  'injectStaticHeaders': (_ateapi_CredentialHeaderInjection__Output)[];
}
