// Original file: proto/ax.proto

import type { Listener as _ax_v1alpha1_Listener, Listener__Output as _ax_v1alpha1_Listener__Output } from '../../ax/v1alpha1/Listener';
import type { EgressConfig as _ax_v1alpha1_EgressConfig, EgressConfig__Output as _ax_v1alpha1_EgressConfig__Output } from '../../ax/v1alpha1/EgressConfig';

export interface GatewaySpec {
  'listeners'?: (_ax_v1alpha1_Listener)[];
  'egress'?: (_ax_v1alpha1_EgressConfig | null);
}

export interface GatewaySpec__Output {
  'listeners': (_ax_v1alpha1_Listener__Output)[];
  'egress': (_ax_v1alpha1_EgressConfig__Output | null);
}
